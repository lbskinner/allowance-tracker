-- Invite co-parent: invite_code on households + RPCs for get/create code and join by code.
-- Run in Supabase SQL Editor after schema.sql.

-- 1. Add invite_code to households (unique, so one code maps to one household)
alter table public.households
  add column if not exists invite_code text unique;

create index if not exists households_invite_code_idx on public.households(invite_code)
  where invite_code is not null;

-- 2. Get or create invite code for a household (only members can call)
create or replace function public.get_or_create_invite_code(p_household_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_household_member(p_household_id) then
    raise exception 'Not a member of this household';
  end if;

  select h.invite_code into code
  from public.households h
  where h.id = p_household_id;

  if code is not null then
    return code;
  end if;

  -- Generate a 6-character alphanumeric code (uppercase for readability)
  loop
    code := upper(substr(md5(gen_random_uuid()::text || clock_timestamp()::text), 1, 6));
    update public.households
    set invite_code = code
    where id = p_household_id and invite_code is null;
    if found then
      return code;
    end if;
    -- Another request may have set it
    select h.invite_code into code from public.households h where h.id = p_household_id;
    if code is not null then
      return code;
    end if;
  end loop;
end;
$$;
grant execute on function public.get_or_create_invite_code(uuid) to authenticated;

-- 3. Join household by code (adds current user to household_members)
create or replace function public.join_household_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
  uid uuid := auth.uid();
  code_trim text := trim(upper(p_code));
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  if code_trim = '' then
    raise exception 'Invalid invite code';
  end if;

  select id into hid
  from public.households
  where invite_code = code_trim;

  if hid is null then
    raise exception 'Invalid or expired invite code';
  end if;

  insert into public.household_members (household_id, user_id)
  values (hid, uid)
  on conflict (household_id, user_id) do nothing;

  return hid;
end;
$$;
grant execute on function public.join_household_by_code(text) to authenticated;
