-- Yangi hisoblar uchun false, mavjud hisoblarni esa darhol true qilamiz
alter table public.profiles
  add column onboarded boolean not null default false;

update public.profiles set onboarded = true;