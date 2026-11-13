-- =====================================================
-- 02: categories va transactions jadvallari
-- =====================================================

-- 1. categories jadvali
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text,
  created_at timestamptz not null default now(),
  unique (user_id, name, type)
);

-- 2. transactions jadvali
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount > 0),
  category_id uuid references public.categories(id) on delete set null,
  description text,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- Tarixni tez ochish uchun indeks
create index transactions_user_date_idx
  on public.transactions (user_id, date desc);

-- 3. Row Level Security
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

-- Kategoriyalar: faqat o'ziniki
create policy "Users manage own categories"
  on public.categories for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Tranzaksiyalar: faqat o'ziniki, kategoriya ham o'zining bo'lishi shart
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
  );

-- =====================================================
-- Boshlang'ich kategoriyalar
-- =====================================================

create function public.create_default_categories(p_user_id uuid)
returns void
language sql
security definer set search_path = ''
as $$
  insert into public.categories (user_id, name, type, icon) values
    (p_user_id, 'Salary',        'income',  'briefcase'),
    (p_user_id, 'Allowance',     'income',  'wallet'),
    (p_user_id, 'Freelance',     'income',  'laptop'),
    (p_user_id, 'Gift',          'income',  'gift'),
    (p_user_id, 'Other',         'income',  'ellipsis'),
    (p_user_id, 'Food',          'expense', 'utensils'),
    (p_user_id, 'Transport',     'expense', 'bus'),
    (p_user_id, 'Education',     'expense', 'graduation-cap'),
    (p_user_id, 'Shopping',      'expense', 'shopping-bag'),
    (p_user_id, 'Entertainment', 'expense', 'gamepad-2'),
    (p_user_id, 'Health',        'expense', 'heart-pulse'),
    (p_user_id, 'Bills',         'expense', 'receipt'),
    (p_user_id, 'Other',         'expense', 'ellipsis')
  on conflict (user_id, name, type) do nothing;
$$;

revoke execute on function public.create_default_categories(uuid)
  from public, anon, authenticated;

-- Yangi foydalanuvchi trigger funksiyasi: profil + kategoriyalar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  perform public.create_default_categories(new.id);

  return new;
end;
$$;

-- Mavjud foydalanuvchilarga kategoriyalarni berish
select public.create_default_categories(id) from