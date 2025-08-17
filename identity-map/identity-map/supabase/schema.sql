-- SQL schema for the first increment of the Identity Map application.
--
-- This schema defines two tables: sessions and participants.  It also
-- enables row‑level security (RLS) and sets up the policies required for
-- inserting and reading data safely.  When deploying to Supabase, run
-- these statements in the SQL editor.

-- Create the sessions table.  Each session has a unique human‑readable
-- code used by participants to join, an optional facilitator email and
-- expiration timestamp, and an auto‑generated created_at timestamp.
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  facilitator_email text,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- Create the participants table.  Each participant is associated with a
-- session via a foreign key.  `is_visible` determines whether the
-- participant’s name and identity information are visible to others.
-- `consent_given` must be true to join a session.  Like sessions,
-- participants receive an auto‑generated created_at timestamp.
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  display_name text not null,
  is_visible boolean default false,
  consent_given boolean not null,
  created_at timestamptz default now()
);

-- Enable row‑level security.  Without enabling RLS, policies have no effect.
alter table sessions enable row level security;
alter table participants enable row level security;

-- Allow anyone to read sessions.  Future increments may tighten this
-- policy if sessions contain sensitive metadata.
create policy if not exists "allow_read_sessions" on sessions
  for select
  using (true);

-- Allow service roles (e.g. the server API) to insert sessions.  This
-- policy is permissive because the server performs its own validation.
create policy if not exists "allow_insert_sessions" on sessions
  for insert
  with check (true);

-- Allow anyone (unauthenticated users) to insert a participant row.  This
-- is necessary because participants join sessions without authenticating.
create policy if not exists "allow_insert_participants" on participants
  for insert
  with check (true);

-- Participants can read only their own record.  When participants
-- authenticate in future increments, `auth.uid()` will reference their
-- user ID.  In this increment, participants are not authenticated,
-- therefore this policy effectively disallows reads from the client.  The
-- server uses the service key and bypasses RLS to fetch data when needed.
create policy if not exists "participant_read_own" on participants
  for select
  using (id = auth.uid());
