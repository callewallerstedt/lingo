create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists scenario_progress (
  user_id uuid references auth.users on delete cascade,
  scenario_id text not null,
  completed_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, scenario_id)
);

create table if not exists scenario_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  scenario_id text not null,
  task_text text not null,
  completed_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table scenario_progress enable row level security;
alter table scenario_attempts enable row level security;

create policy "Profiles are self readable"
  on profiles for select
  using (auth.uid() = id);

create policy "Profiles are self writable"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Profiles are self updatable"
  on profiles for update
  using (auth.uid() = id);

create policy "Progress is self readable"
  on scenario_progress for select
  using (auth.uid() = user_id);

create policy "Progress is self writable"
  on scenario_progress for insert
  with check (auth.uid() = user_id);

create policy "Progress is self updatable"
  on scenario_progress for update
  using (auth.uid() = user_id);

create policy "Attempts are self readable"
  on scenario_attempts for select
  using (auth.uid() = user_id);

create policy "Attempts are self writable"
  on scenario_attempts for insert
  with check (auth.uid() = user_id);
