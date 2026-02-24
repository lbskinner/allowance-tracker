-- Add current_balance to kids and keep it in sync via trigger. Run after schema.sql.

-- 1. Add column
alter table public.kids
  add column if not exists current_balance numeric(12, 2) not null default 0;

-- 2. Recalculate and set current_balance for one kid (used by trigger)
create or replace function public.update_kid_current_balance(p_kid_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  bal numeric(12, 2);
begin
  select coalesce(
    sum(case when type = 'credit' then amount else -amount end),
    0
  ) into bal
  from public.transactions
  where kid_id = p_kid_id;

  update public.kids
  set current_balance = bal
  where id = p_kid_id;
end;
$$;

-- 3. Trigger: after any change to transactions, update the affected kid(s)
create or replace function public.sync_kid_balance_on_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.update_kid_current_balance(new.kid_id);
    return new;
  elsif tg_op = 'DELETE' then
    perform public.update_kid_current_balance(old.kid_id);
    return old;
  else
    -- UPDATE
    if old.kid_id = new.kid_id then
      perform public.update_kid_current_balance(new.kid_id);
    else
      perform public.update_kid_current_balance(old.kid_id);
      perform public.update_kid_current_balance(new.kid_id);
    end if;
    return new;
  end if;
end;
$$;

drop trigger if exists sync_kid_balance_on_transaction on public.transactions;
create trigger sync_kid_balance_on_transaction
  after insert or update or delete on public.transactions
  for each row execute function public.sync_kid_balance_on_transaction();

-- 4. Backfill existing kids
do $$
declare
  k record;
begin
  for k in select id from public.kids
  loop
    perform public.update_kid_current_balance(k.id);
  end loop;
end;
$$;
