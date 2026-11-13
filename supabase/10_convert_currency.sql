-- 1. Trigger funksiyasi: aylantirish paytida o'tkazib yuboradigan bo'ldi
create or replace function public.sync_goal_amount()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if current_setting('app.skip_goal_sync', true) = 'on' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

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

-- 2. Barcha summalarni kurs bo'yicha aylantiruvchi funksiya
create function public.convert_user_currency(
  p_rate numeric,
  p_new_currency text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_rate is null or p_rate <= 0 or p_rate > 1000000000 then
    raise exception 'Invalid exchange rate';
  end if;

  -- Aylantirish vaqtida maqsad summalarini trigger o'zgartirmasin
  perform set_config('app.skip_goal_sync', 'on', true);

  update public.transactions
    set amount = greatest(0.01, round(amount * p_rate, 2))
    where user_id = (select auth.uid());

  update public.savings_goals
    set target_amount = greatest(0.01, round(target_amount * p_rate, 2)),
        current_amount = round(current_amount * p_rate, 2)
    where user_id = (select auth.uid());

  update public.planned_payments
    set amount = greatest(0.01, round(amount * p_rate, 2))
    where user_id = (select auth.uid());

  update public.profiles
    set currency = p_new_currency
    where id = (select auth.uid());

  perform set_config('app.skip_goal_sync', 'off', true);
end;
$$;

revoke execute on function public.convert_user_currency(numeric, text)
  from public, anon;
grant execute on function public.convert_user_currency(numeric, text)
  to authenticated;