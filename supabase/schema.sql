-- CouchSpin cloud sync
-- Paste this into the Supabase SQL editor and run it once.

create table if not exists public.libraries (
  user_id    uuid primary key references auth.users on delete cascade,
  library    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.libraries enable row level security;

-- Each row is reachable only by the user it belongs to. Without these policies
-- RLS denies everything, so all three verbs need one.
create policy "read own library"
  on public.libraries for select
  using (auth.uid() = user_id);

create policy "insert own library"
  on public.libraries for insert
  with check (auth.uid() = user_id);

create policy "update own library"
  on public.libraries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
