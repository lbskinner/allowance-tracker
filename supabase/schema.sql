-- Allowance Tracker – Supabase schema (multi-user: households so both parents can use the app)
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Requires Supabase Auth to be enabled (it is by default).

-- 1. Households (e.g. "Smith Family" – one per family, shared by both parents)
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamptz not null default now()
);

-- 2. Household members (which users belong to which household; both parents are members)
create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- When a user creates a household, add them as a member (all members are equal)
create or replace function public.handle_new_household()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.household_members (household_id, user_id)
  values (new.id, auth.uid());
  return new;
end;
$$;
create trigger on_household_created
  after insert on public.households
  for each row execute function public.handle_new_household();

-- RPC for new users to create a household (bypasses RLS; trigger still adds them to household_members)
-- p_name: optional household name (e.g. "Smith Family")
create or replace function public.create_household_for_current_user(p_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
  uid uuid := auth.uid();
  name_trim text := nullif(trim(p_name), '');
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  insert into public.households (name) values (name_trim) returning id into new_household_id;
  -- Trigger adds (new_household_id, auth.uid()) to household_members
  return new_household_id;
end;
$$;
grant execute on function public.create_household_for_current_user(text) to authenticated;
grant execute on function public.create_household_for_current_user(text) to anon;
grant execute on function public.create_household_for_current_user(text) to service_role;

-- 3. Kids (belong to a household, so all members of that household can manage them)
create table public.kids (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  allowance_amount numeric(12, 2) check (allowance_amount is null or allowance_amount > 0),
  current_balance numeric(12, 2) not null default 0,
  view_token text unique,
  created_at timestamptz not null default now()
);

-- 4. Transactions (ownership via kid → household)
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid not null references public.kids(id) on delete cascade,
  type text not null check (type in ('credit', 'expense')),
  amount numeric(12, 2) not null check (amount > 0),
  date timestamptz not null default now(),
  description text not null default '',
  added_by_display text,
  created_at timestamptz not null default now()
);

-- Indexes
create index household_members_user_id_idx on public.household_members(user_id);
create index kids_household_id_idx on public.kids(household_id);
create index transactions_kid_id_idx on public.transactions(kid_id);
create index transactions_date_idx on public.transactions(date desc);

-- Row Level Security
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.kids enable row level security;
alter table public.transactions enable row level security;

-- Helper: true if current user is a member of the given household.
-- SECURITY DEFINER so reading household_members in policies doesn't cause infinite recursion.
create or replace function public.is_household_member(check_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.household_members
    where household_id = check_household_id
    and user_id = auth.uid()
  );
$$;

-- Households: members can see and update; anyone authenticated can create (trigger adds them as owner)
create policy "Members can view own households"
  on public.households for select
  using (
    exists (
      select 1 from public.household_members
      where household_members.household_id = households.id
      and household_members.user_id = auth.uid()
    )
  );
create policy "Members can update own households"
  on public.households for update
  using (
    exists (
      select 1 from public.household_members
      where household_members.household_id = households.id
      and household_members.user_id = auth.uid()
    )
  );
create policy "Authenticated users can create households"
  on public.households for insert
  with check (auth.uid() is not null);
create policy "Members can delete household"
  on public.households for delete
  using (
    exists (
      select 1 from public.household_members
      where household_members.household_id = households.id
      and household_members.user_id = auth.uid()
    )
  );

-- Household members: use is_household_member() to avoid recursion (policy must not read same table via RLS)
create policy "Members can view household members"
  on public.household_members for select
  using (
    user_id = auth.uid()
    or public.is_household_member(household_id)
  );
create policy "Members can add household members"
  on public.household_members for insert
  with check (
    user_id = auth.uid()
    or public.is_household_member(household_id)
  );
create policy "Members can remove household members"
  on public.household_members for delete
  using (
    user_id = auth.uid()
    or public.is_household_member(household_id)
  );

-- Kids: any household member can manage kids in that household
create policy "Household members can manage kids"
  on public.kids for all
  using (
    exists (
      select 1 from public.household_members
      where household_members.household_id = kids.household_id
      and household_members.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.household_members
      where household_members.household_id = kids.household_id
      and household_members.user_id = auth.uid()
    )
  );

-- Transactions: any household member can manage transactions for kids in their household
create policy "Household members can manage transactions"
  on public.transactions for all
  using (
    exists (
      select 1 from public.kids
      join public.household_members on household_members.household_id = kids.household_id
      where kids.id = transactions.kid_id
      and household_members.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.kids
      join public.household_members on household_members.household_id = kids.household_id
      where kids.id = transactions.kid_id
      and household_members.user_id = auth.uid()
    )
  );

-- Keep kids.current_balance in sync when transactions change
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

create trigger sync_kid_balance_on_transaction
  after insert or update or delete on public.transactions
  for each row execute function public.sync_kid_balance_on_transaction();

comment on table public.households is 'One per family; shared by multiple users (e.g. both parents)';
comment on table public.household_members is 'Which users belong to which household; all members have full access';
comment on table public.kids is 'One row per kid; scoped by household so all household members can edit';
comment on table public.transactions is 'Credits and expenses per kid';
