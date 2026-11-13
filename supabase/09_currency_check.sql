alter table public.profiles
  add constraint profiles_currency_check
  check (currency in ('USD', 'EUR', 'GBP', 'UZS', 'RUB', 'KZT', 'KRW', 'JPY', 'TRY', 'CNY'));