-- 1. budgets jadvali
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  monthly_limit numeric(12, 2) not null check (monthly_limit > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category_id)
);

create index budgets_user_idx
  on public.budgets (user_id);

-- 2. Row Level Security
alter table public.budgets enable row level security;

-- Faqat o'zining byudjetlari, faqat o'zining xarajat kategoriyasi uchun
create policy "Users manage own budgets"
  on public.budgets for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.categories c
      where c.id = category_id
        and c.user_id = (select auth.uid())
        and c.type = 'expense'
    )
  );