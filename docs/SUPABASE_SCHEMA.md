# Supabase tables for Allowance Tracker

Schema supports **multiple users per family** so both parents can log in and update the same kids and transactions.

---

## Overview

- **Household** = one family (e.g. "Smith Family"). Kids and transactions belong to a household, not to a single user.
- **Household members** = users who can see and edit that household’s kids and transactions (e.g. both parents).
- **Auth:** Supabase `auth.users` for login. No separate “users” table.
- **RLS:** Users only see data for households they’re a member of.

---

## 1. `households`

| Column       | Type          | Nullable | Default             | Description        |
|-------------|----------------|----------|---------------------|--------------------|
| `id`        | `uuid`         | no       | `gen_random_uuid()` | Primary key        |
| `name`      | `text`         | yes      | —                   | e.g. "Smith Family" |
| `created_at`| `timestamptz`  | no       | `now()`             | Created at         |

- One row per family. Parent A creates it; Parent B is added as a member (see below).

---

## 2. `household_members`

| Column        | Type          | Nullable | Default   | Description                          |
|---------------|---------------|----------|-----------|--------------------------------------|
| `household_id`| `uuid`        | no       | —         | FK → `households(id)` ON DELETE CASCADE |
| `user_id`     | `uuid`        | no       | —         | FK → `auth.users(id)` ON DELETE CASCADE |
| `role`        | `text`        | no       | `'member'`| `'owner'` or `'member'`               |
| `created_at`  | `timestamptz` | no       | `now()`   | When they joined                     |

- **Primary key:** `(household_id, user_id)`.
- When a user **creates** a household, a trigger adds them as `role = 'owner'`. Other parents are added with `role = 'member'` (e.g. via invite or join flow in the app).

---

## 3. `kids`

| Column        | Type          | Nullable | Default             | Description     |
|---------------|---------------|----------|---------------------|-----------------|
| `id`          | `uuid`        | no       | `gen_random_uuid()` | Primary key     |
| `household_id`| `uuid`        | no       | —                   | FK → `households(id)` |
| `name`        | `text`        | no       | —                   | Kid’s name      |
| `created_at`  | `timestamptz` | no       | `now()`             | Created at      |

- Kids belong to a **household**, so every member of that household (both parents) can view and edit them.

---

## 4. `transactions`

| Column        | Type            | Nullable | Default             | Description     |
|---------------|-----------------|----------|---------------------|-----------------|
| `id`          | `uuid`          | no       | `gen_random_uuid()` | Primary key     |
| `kid_id`      | `uuid`          | no       | —                   | FK → `kids(id)` |
| `type`        | `text`          | no       | —                   | `'credit'` or `'expense'` |
| `amount`      | `numeric(12,2)` | no       | —                   | Positive amount |
| `date`        | `timestamptz`   | no       | `now()`             | When it happened |
| `description` | `text`          | no       | `''`                | Optional note   |
| `created_at`  | `timestamptz`   | no       | `now()`             | Created at      |

- Unchanged. Access is controlled via kid → household → household_members.

---

## Row Level Security (RLS)

- **households:** Members can SELECT/UPDATE. Any authenticated user can INSERT (trigger adds them as owner). Only **owners** can DELETE.
- **household_members:** Members of a household can SELECT/INSERT/DELETE rows for that household (so they can add or remove other members, e.g. the other parent).
- **kids:** Any household member can SELECT/INSERT/UPDATE/DELETE kids for that household.
- **transactions:** Any household member can SELECT/INSERT/UPDATE/DELETE transactions for kids in that household.

---

## Adding the second parent

1. Parent A creates a household (INSERT into `households`; trigger adds A as owner).
2. Parent A creates kids (INSERT into `kids` with that `household_id`).
3. To add Parent B: insert a row into `household_members` with the same `household_id` and B’s `user_id` (e.g. after B signs up and you have their id, or via an invite-by-email flow that looks up the user).

The app can implement “Invite co-parent” (e.g. send link or code) and then INSERT into `household_members` when they accept or enter the code.

---

## Mapping to app types

| App concept   | Supabase                                      |
|---------------|-----------------------------------------------|
| Current user  | `auth.uid()` from Supabase Auth               |
| Family        | One `households` row; users in `household_members` |
| Kid           | `kids` row; `household_id` links to family    |
| Transaction   | `transactions` row; `kid_id` → kid → household |

When inserting a kid, set `household_id` to the current user’s household (e.g. the one they created or were added to).
