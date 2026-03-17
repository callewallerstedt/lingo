create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  languages text[] not null default '{}',
  active_language text,
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

create table if not exists user_vocab (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  language text not null,
  scope text not null,
  scenario_id text,
  word_key text not null,
  word text not null,
  translation text not null,
  starred boolean not null default false,
  folder text,
  count integer not null default 1,
  last_clicked timestamptz not null default now(),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, language, scope, scenario_id, word_key)
);

create table if not exists surge_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  language text not null,
  item_key text not null,
  item_text text not null,
  translation text not null,
  item_type text not null,
  status text not null default 'learning',
  stage integer not null default 0,
  times_seen integer not null default 0,
  times_correct integer not null default 0,
  last_result text,
  last_direction text,
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, language, item_key)
);

create table if not exists surge_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  language text not null,
  session_state jsonb not null,
  updated_at timestamptz not null default now(),
  unique (user_id, language)
);

alter table profiles add column if not exists languages text[] not null default '{}';
alter table profiles add column if not exists active_language text;
alter table user_vocab add column if not exists language text;
alter table user_vocab add column if not exists scope text;
alter table user_vocab add column if not exists scenario_id text;
alter table user_vocab add column if not exists word_key text;
alter table user_vocab add column if not exists word text;
alter table user_vocab add column if not exists translation text;
alter table user_vocab add column if not exists starred boolean not null default false;
alter table user_vocab add column if not exists folder text;
alter table user_vocab add column if not exists count integer not null default 1;
alter table user_vocab add column if not exists last_clicked timestamptz not null default now();
alter table user_vocab add column if not exists archived boolean not null default false;
alter table user_vocab add column if not exists created_at timestamptz not null default now();
alter table surge_progress add column if not exists language text;
alter table surge_progress add column if not exists item_key text;
alter table surge_progress add column if not exists item_text text;
alter table surge_progress add column if not exists translation text;
alter table surge_progress add column if not exists item_type text;
alter table surge_progress add column if not exists status text not null default 'learning';
alter table surge_progress add column if not exists stage integer not null default 0;
alter table surge_progress add column if not exists times_seen integer not null default 0;
alter table surge_progress add column if not exists times_correct integer not null default 0;
alter table surge_progress add column if not exists last_result text;
alter table surge_progress add column if not exists last_direction text;
alter table surge_progress add column if not exists last_reviewed_at timestamptz;
alter table surge_progress add column if not exists next_review_at timestamptz;
alter table surge_progress add column if not exists created_at timestamptz not null default now();
alter table surge_progress add column if not exists updated_at timestamptz not null default now();
alter table surge_sessions add column if not exists language text;
alter table surge_sessions add column if not exists session_state jsonb not null default '{}'::jsonb;
alter table surge_sessions add column if not exists updated_at timestamptz not null default now();

alter table profiles enable row level security;
alter table scenario_progress enable row level security;
alter table scenario_attempts enable row level security;
alter table user_vocab enable row level security;
alter table surge_progress enable row level security;
alter table surge_sessions enable row level security;

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

create policy "Vocab is self readable"
  on user_vocab for select
  using (auth.uid() = user_id);

create policy "Vocab is self writable"
  on user_vocab for insert
  with check (auth.uid() = user_id);

create policy "Vocab is self updatable"
  on user_vocab for update
  using (auth.uid() = user_id);

create policy "Vocab is self deletable"
  on user_vocab for delete
  using (auth.uid() = user_id);

create policy "Surge progress is self readable"
  on surge_progress for select
  using (auth.uid() = user_id);

create policy "Surge progress is self writable"
  on surge_progress for insert
  with check (auth.uid() = user_id);

create policy "Surge progress is self updatable"
  on surge_progress for update
  using (auth.uid() = user_id);

create policy "Surge sessions are self readable"
  on surge_sessions for select
  using (auth.uid() = user_id);

create policy "Surge sessions are self writable"
  on surge_sessions for insert
  with check (auth.uid() = user_id);

create policy "Surge sessions are self updatable"
  on surge_sessions for update
  using (auth.uid() = user_id);
