-- 1. savings_goals jadvali
create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(12, 2) not null check (target_amount > 0),
  current_amount numeric(12, 2) not null default 0 check (current_amount >= 0),
  deadline date,
  description text,
  created_at timestamptz not null default now()
);

create index savings_goals_user_idx
  on public.savings_goals (user_id);

-- 2. Row Level Security
alter table public.savings_goals enable row level security;

-- Maqsadlar: faqat o'ziniki
create policy "Users manage own savings goals"
  on public.savings_goals for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);