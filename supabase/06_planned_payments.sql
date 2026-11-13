-- 1. planned_payments jadvali
create table public.planned_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  name text not null,
  amount numeric(12, 2) not null check (amount > 0),
  due_date date,
  category_id uuid references public.categories(id) on delete set null,
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now()
);

create index planned_payments_user_month_idx
  on public.planned_payments (user_id, month);

-- 2. Row Level Security
alter table public.planned_payments enable row level security;

create policy "Users manage own planned payments"
  on public.planned_payments for all
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
          and c.type = 'expense'
      )
    )
    and (
      transaction_id is null
      or exists (
        select 1 from public.transactions t
        where t.id = transaction_id
          and t.user_id = (select auth.uid())
      )
    )
  );