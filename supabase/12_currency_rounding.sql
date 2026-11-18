create or replace function public.convert_user_currency(
  p_rate numeric,
  p_new_currency text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  -- So'm, von va iyena butun sonlarda, qolganlari 2 xonagacha
  v_decimals int := case when p_new_currency in ('UZS', 'KRW', 'JPY') then 0 else 2 end;
  v_min numeric := case when p_new_currency in ('UZS', 'KRW', 'JPY') then 1 else 0.01 end;
begin
  if p_rate is null or p_rate <= 0 or p_rate > 1000000000 then
    raise exception 'Invalid exchange rate';
  end if;

  -- Aylantirish vaqtida maqsad summalarini trigger o'zgartirmasin
  perform set_config('app.skip_goal_sync', 'on', true);

  update public.transactions
    set amount = greatest(v_min, round(amount * p_rate, v_decimals))
    where user_id = (select auth.uid());

  update public.savings_goals
    set target_amount = greatest(v_min, round(target_amount * p_rate, v_decimals)),
        current_amount = round(current_amount * p_rate, v_decimals)
    where user_id = (select auth.uid());

  update public.planned_payments
    set amount = greatest(v_min, round(amount * p_rate, v_decimals))
    where user_id = (select auth.uid());

  update public.profiles
    set currency = p_new_currency
    where id = (select auth.uid());

  perform set_config('app.skip_goal_sync', 'off', true);
end;
$$;