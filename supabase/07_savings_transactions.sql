-- 1. Tranzaksiyaga maqsad ustuni (maqsad o'chirilsa, unga solingan tranzaksiyalar ham o'chadi)
alter table public.transactions
  add column goal_id uuid references public.savings_goals(id) on delete cascade;

create index transactions_goal_idx
  on public.transactions (goal_id);

-- 2. Yangi tur: 'saving'
alter table public.transactions
  drop constraint if exists transactions_type_check;

alter table public.transactions
  add constraint transactions_type_check
  check (type in ('income', 'expense', 'saving'));

-- 'saving' turi albatta maqsadga bog'langan bo'lishi shart, boshqa turlar esa yo'q
alter table public.transactions
  add constraint transactions_saving_goal_check
  check ((type = 'saving') = (goal_id is not null));

-- 3. Xavfsizlik: faqat o'zingizning kategoriya va maqsadingizga bog'lash mumkin
drop policy "Users manage own transactions" on public.transactions;

create policy "Users manage own transactions"
  on public.transactions for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = category_id
          and c.user_id = (select auth.uid())
      )
    )
    and (
      goal_id is null
      or exists (
        select 1 from public.savings_goals g
        where g.id = goal_id
          and g.user_id = (select auth.uid())
      )
    )
  );

-- 4. Maqsaddagi summani tranzaksiyalar bilan avtomatik moslab turadigan trigger
create function public.sync_goal_amount()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.type = 'saving' then
      update public.savings_goals
        set current_amount = current_amount + new.amount
        where id = new.goal_id;
    end if;
    return new;

  elsif tg_op = 'DELETE' then
    if old.type = 'saving' then
      update public.savings_goals
        set current_amount = greatest(0, current_amount - old.amount)
        where id = old.goal_id;
    end if;
    return old;

  else
    if old.type = 'saving' then
      update public.savings_goals
        set current_amount = greatest(0, current_amount - old.amount)
        where id = old.goal_id;
    end if;
    if new.type = 'saving' then
      update public.savings_goals
        set current_amount = current_amount + new.amount
        where id = new.goal_id;
    end if;
    return new;
  end if;
end;
$$;

revoke execute on function public.sync_goal_amount()
  from public, anon, authenticated;

create trigger transactions_sync_goal_amount
  after insert or update or delete on public.transactions
  for each row execute function public.sync_goal_amount();