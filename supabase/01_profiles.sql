-- =====================================================
-- 01: profiles jadvali
-- =====================================================

-- 1. profiles jadvali
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar text,
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

-- 2. Row Level Security'ni yoqamiz
alter table public.profiles enable row level security;

-- 3. Qoida: foydalanuvchi faqat o'z profilini ko'radi
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- 4. Qoida: foydalanuvchi faqat o'z profilini yangilaydi
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- =====================================================
-- Yangi foydalanuvchi uchun avtomatik profil
-- =====================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

-- Funksiyani faqat trigger chaqira olsin, tashqaridan emas
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mavjud foydalanuvchilar uchun profil yaratish
insert into public.profiles (id, full_name)
select id, raw_user_meta_data ->> 'full_name'
from auth.users
on conflict (id) do nothing;