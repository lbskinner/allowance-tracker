-- Add "added by" display (e.g. email prefix) to transactions. Run after schema.sql.

alter table public.transactions
  add column if not exists added_by_display text;
