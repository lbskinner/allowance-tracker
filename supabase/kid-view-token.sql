-- Read-only view link per kid (stable, bookmarkable). Run after schema.sql.

-- 1. Add view_token to kids
alter table public.kids
  add column if not exists view_token text unique;

create index if not exists kids_view_token_idx on public.kids(view_token)
  where view_token is not null;

-- 2. Parent gets or creates the view link (authenticated, household member only)
-- Token: 32-char hex from md5 (built-in), no extensions required
create or replace function public.get_or_create_view_token(p_kid_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  k_household_id uuid;
  new_token text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  select household_id into k_household_id from public.kids where id = p_kid_id;
  if k_household_id is null then
    raise exception 'Kid not found';
  end if;
  if not public.is_household_member(k_household_id) then
    raise exception 'Not a member of this household';
  end if;

  update public.kids
  set view_token = coalesce(view_token, md5(p_kid_id::text || random()::text || clock_timestamp()::text))
  where id = p_kid_id
  returning view_token into new_token;

  return new_token;
end;
$$;
grant execute on function public.get_or_create_view_token(uuid) to authenticated;

-- 3. Public read-only view by token (anon); returns kid name + transactions from last 30 days only
create or replace function public.get_readonly_view(p_token text)
returns json
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  k_id uuid;
  k_name text;
  tx_rows json;
begin
  select id, name into k_id, k_name
  from public.kids
  where view_token = nullif(trim(p_token), '');

  if k_id is null then
    return null;
  end if;

  select coalesce(
    json_agg(
      json_build_object(
        'id', t.id,
        'kid_id', t.kid_id,
        'type', t.type,
        'amount', t.amount,
        'date', t.date,
        'description', coalesce(t.description, '')
      )
      order by t.date desc
    ),
    '[]'::json
  ) into tx_rows
  from public.transactions t
  where t.kid_id = k_id
    and t.date >= (now() - interval '30 days');

  return json_build_object(
    'kidName', k_name,
    'kidId', k_id,
    'transactions', tx_rows
  );
end;
$$;
grant execute on function public.get_readonly_view(text) to anon;
grant execute on function public.get_readonly_view(text) to authenticated;
