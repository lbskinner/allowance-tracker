-- Add preset_amounts to kids (quick amounts for Add Transaction form; max 3 enforced in UI).
-- Run after schema.sql (and other migrations that alter kids).

alter table public.kids
  add column if not exists preset_amounts numeric(12, 2)[] not null default '{}';
