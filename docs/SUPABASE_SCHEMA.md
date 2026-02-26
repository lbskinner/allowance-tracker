# Supabase schema for Allowance Tracker

Schema supports **multiple users per family** so both parents can log in and update the same kids and transactions.

---

## Overview

- **Household** = one family (e.g. "Smith Family"). Kids and transactions belong to a household, not to a single user.
- **Household members** = users who can see and edit that household’s kids and transactions (e.g. both parents). All members have equal access; there is no owner/member role distinction in the base schema.
- **Auth:** Supabase `auth.users` for login. No separate “users” table.
- **RLS:** Users only see data for households they’re a member of.

**Migrations:** After `schema.sql`, run `supabase/invite-co-parent.sql` (invite code + join by code), `supabase/kid-view-token.sql` (read-only kid view link), `supabase/kids-current-balance.sql` (current_balance on kids + trigger), and `supabase/transactions-added-by.sql` (added_by_display on transactions) to get the full feature set. New installs from current `schema.sql` already include `current_balance`, the trigger, and `added_by_display`.

---

## 1. `households`

| Column        | Type          | Nullable | Default             | Description          |
|---------------|---------------|----------|---------------------|----------------------|
| `id`          | `uuid`        | no       | `gen_random_uuid()` | Primary key          |
| `name`        | `text`        | yes      | —                   | e.g. "Smith Family"  |
| `invite_code` | `text`        | yes      | —                   | Unique 6-char code (from migration) |
| `created_at`  | `timestamptz` | no       | `now()`             | Created at           |

- One row per family. The first parent creates it; the second joins via invite code (see RPCs below).
- `invite_code` is added by `invite-co-parent.sql`; used for “Invite partner” and join-by-code.

---

## 2. `household_members`

| Column         | Type          | Nullable | Default   | Description                          |
|----------------|---------------|----------|-----------|--------------------------------------|
| `household_id` | `uuid`        | no       | —         | FK → `households(id)` ON DELETE CASCADE |
| `user_id`      | `uuid`        | no       | —         | FK → `auth.users(id)` ON DELETE CASCADE |
| `created_at`   | `timestamptz` | no       | `now()`   | When they joined                     |

- **Primary key:** `(household_id, user_id)`.
- No `role` column: all members are equal. When a user creates a household, a trigger adds them to `household_members`. Other parents are added via `join_household_by_code` (see RPCs).

---

## 3. `kids`

| Column            | Type            | Nullable | Default             | Description                                  |
|-------------------|-----------------|----------|---------------------|----------------------------------------------|
| `id`              | `uuid`          | no       | `gen_random_uuid()` | Primary key                                  |
| `household_id`    | `uuid`          | no       | —                   | FK → `households(id)`                         |
| `name`            | `text`          | no       | —                   | Kid’s name                                   |
| `allowance_amount`| `numeric(12,2)` | yes      | —                   | Default amount for “Add allowance”; null = hide button |
| `current_balance` | `numeric(12,2)` | no       | `0`                 | Running total (credits − expenses); kept in sync by trigger |
| `view_token`      | `text`          | yes      | —                   | Unique token for read-only view link (last 30 days) |
| `created_at`      | `timestamptz`   | no       | `now()`             | Created at                                   |

- Kids belong to a **household**; every member can view and edit them.
- `current_balance` is updated by trigger `sync_kid_balance_on_transaction` on insert/update/delete of `transactions`. For existing DBs, run **`supabase/kids-current-balance.sql`** to add the column, function, trigger, and backfill.
- `view_token` is set by `get_or_create_view_token` (see RPCs); used for the bookmarkable read-only kid view.

---

## 4. `transactions`

| Column             | Type            | Nullable | Default             | Description     |
|--------------------|-----------------|----------|---------------------|-----------------|
| `id`               | `uuid`          | no       | `gen_random_uuid()` | Primary key     |
| `kid_id`           | `uuid`          | no       | —                   | FK → `kids(id)` |
| `type`             | `text`          | no       | —                   | `'credit'` or `'expense'` |
| `amount`           | `numeric(12,2)` | no       | —                   | Positive amount |
| `date`             | `timestamptz`   | no       | `now()`             | When it happened |
| `description`      | `text`          | no       | `''`                | Optional note   |
| `added_by_display` | `text`          | yes      | —                   | Who added (e.g. email prefix); null for older rows |
| `created_at`       | `timestamptz`   | no       | `now()`             | Created at      |

- Access is controlled via kid → household → household_members.
- `added_by_display` is set by the app when inserting (e.g. from the current user’s email prefix); used to show “by X” in the transaction list and read-only view.

---

## Row Level Security (RLS)

- **households:** Members can SELECT/UPDATE. Any authenticated user can INSERT (trigger adds them to `household_members`). Any member can DELETE (e.g. leave or dissolve).
- **household_members:** Members can SELECT/INSERT/DELETE for their household (so they can add or remove members, e.g. invite partner or leave).
- **kids:** Any household member can SELECT/INSERT/UPDATE/DELETE kids for that household.
- **transactions:** Any household member can SELECT/INSERT/UPDATE/DELETE transactions for kids in that household.

Helper: `public.is_household_member(check_household_id uuid)` (SECURITY DEFINER) returns true if the current user is in that household; used by RLS and RPCs.

---

## RPCs and migrations

### Base schema (`schema.sql`)

- **`create_household_for_current_user(p_name text)`** — Creates a household (optional name); trigger adds the current user to `household_members`. Returns the new `household_id`. Called when a user creates a new household.

### Invite partner (`invite-co-parent.sql`)

- **`get_or_create_invite_code(p_household_id uuid)`** — Returns the household’s 6-character invite code (creates one if missing). Callable only by authenticated household members. Used by “Invite partner” in the app.
- **`join_household_by_code(p_code text)`** — Adds the current user to the household that has this invite code. Returns the `household_id`. Callable by authenticated users. Used when the partner enters the code or opens the join link.

### Read-only kid view (`kid-view-token.sql`)

- **`get_or_create_view_token(p_kid_id uuid)`** — Returns a stable token for that kid (creates one if missing). Callable only by authenticated household members. Used by “Get view link” in the app. Token is a 32-char hex (URL-safe).
- **`get_readonly_view(p_token text)`** — Callable by **anon** or authenticated. Looks up the kid by `view_token` and returns JSON: `{ kidName, kidId, transactions }`. Transactions are restricted to the **last 30 days**. Used by the public `/view/:token` page so kids can see their transactions without logging in.

---

## Adding the second parent (invite partner)

1. Parent A creates a household (app calls `create_household_for_current_user`; trigger adds A to `household_members`).
2. Parent A creates kids (INSERT into `kids` with that `household_id`).
3. Parent A opens “Invite partner” and copies the code or link (app calls `get_or_create_invite_code`).
4. Parent B signs up or logs in, then enters the code or opens the link with `?join=CODE` (app calls `join_household_by_code`), which INSERTs B into `household_members`.

---

## Mapping to app types

| App concept   | Supabase                                      |
|---------------|-----------------------------------------------|
| Current user  | `auth.uid()` from Supabase Auth               |
| Family        | One `households` row; users in `household_members` |
| Kid           | `kids` row; `household_id` links to family; `allowance_amount`, `view_token` for UI and read-only link |
| Transaction   | `transactions` row; `kid_id` → kid → household |

When inserting a kid, set `household_id` to the current user’s household (the one they created or joined via code).
