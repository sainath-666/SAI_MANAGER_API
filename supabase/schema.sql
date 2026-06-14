-- =============================================================================
-- SAI Manager — Complete Supabase Schema
-- Run this in the Supabase SQL Editor to bootstrap all tables.
-- All statements are idempotent (CREATE TABLE IF NOT EXISTS).
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- PROFILES  (one row per auth.users row)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text unique,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable by owner"   on public.profiles for select using (auth.uid() = id);
create policy "profiles are insertable by owner" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles are updatable by owner"  on public.profiles for update using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- PROJECTS
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        not null references auth.users(id) on delete cascade,
  name                  text        not null,
  description           text,
  status                text        not null default 'Planning'
                                    check (status in ('Planning', 'In Progress', 'Review', 'Completed')),
  category              text        not null default 'General',
  target_tasks_count    integer     not null default 0 check (target_tasks_count >= 0),
  completed_tasks_count integer     not null default 0 check (completed_tasks_count >= 0),
  due_date              date,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);

alter table public.projects enable row level security;

create policy "projects are readable by owner"   on public.projects for select using (auth.uid() = user_id);
create policy "projects are insertable by owner" on public.projects for insert with check (auth.uid() = user_id);
create policy "projects are updatable by owner"  on public.projects for update using (auth.uid() = user_id);
create policy "projects are deletable by owner"  on public.projects for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- TASKS
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id          uuid        primary key default gen_random_uuid(),
  project_id  uuid        references public.projects(id) on delete set null,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  title       text        not null,
  description text,
  status      text        not null default 'todo'   check (status   in ('todo', 'in_progress', 'done')),
  priority    text        not null default 'medium' check (priority in ('low', 'medium', 'high')),
  category    text        not null default 'General',
  due_date    date,
  order_index integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists tasks_user_id_idx    on public.tasks (user_id);
create index if not exists tasks_project_id_idx on public.tasks (project_id);
create index if not exists tasks_status_idx     on public.tasks (user_id, status);

alter table public.tasks enable row level security;

create policy "tasks are readable by owner"   on public.tasks for select using (auth.uid() = user_id);
create policy "tasks are insertable by owner" on public.tasks for insert with check (auth.uid() = user_id);
create policy "tasks are updatable by owner"  on public.tasks for update using (auth.uid() = user_id);
create policy "tasks are deletable by owner"  on public.tasks for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- TRANSACTIONS  (Finance)
-- ---------------------------------------------------------------------------
create table if not exists public.transactions (
  id          uuid           primary key default gen_random_uuid(),
  user_id     uuid           not null references auth.users(id) on delete cascade,
  title       text           not null,
  amount      numeric(12, 2) not null check (amount >= 0),
  type        text           not null check (type in ('income', 'expense')),
  category    text           not null default 'General',
  date        timestamptz    not null,
  created_at  timestamptz    not null default now(),
  updated_at  timestamptz    not null default now()
);

create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_date_idx    on public.transactions (user_id, date desc);
create index if not exists transactions_type_idx    on public.transactions (user_id, type);

alter table public.transactions enable row level security;

create policy "transactions are readable by owner"   on public.transactions for select using (auth.uid() = user_id);
create policy "transactions are insertable by owner" on public.transactions for insert with check (auth.uid() = user_id);
create policy "transactions are updatable by owner"  on public.transactions for update using (auth.uid() = user_id);
create policy "transactions are deletable by owner"  on public.transactions for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- NOTES
-- ---------------------------------------------------------------------------
create table if not exists public.notes (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  title       text        not null,
  content     text        not null default '',
  category    text        not null default 'General',
  is_pinned   boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists notes_user_id_idx  on public.notes (user_id);
create index if not exists notes_pinned_idx   on public.notes (user_id, is_pinned);

alter table public.notes enable row level security;

create policy "notes are readable by owner"   on public.notes for select using (auth.uid() = user_id);
create policy "notes are insertable by owner" on public.notes for insert with check (auth.uid() = user_id);
create policy "notes are updatable by owner"  on public.notes for update using (auth.uid() = user_id);
create policy "notes are deletable by owner"  on public.notes for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- HABITS  (Goals / Streaks)
-- ---------------------------------------------------------------------------
create table if not exists public.habits (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  title         text        not null,
  streak        integer     not null default 0 check (streak >= 0),
  is_completed  boolean     not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists habits_user_id_idx on public.habits (user_id);

alter table public.habits enable row level security;

create policy "habits are readable by owner"   on public.habits for select using (auth.uid() = user_id);
create policy "habits are insertable by owner" on public.habits for insert with check (auth.uid() = user_id);
create policy "habits are updatable by owner"  on public.habits for update using (auth.uid() = user_id);
create policy "habits are deletable by owner"  on public.habits for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- CALENDAR EVENTS
-- ---------------------------------------------------------------------------
create table if not exists public.calendar_events (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  title       text        not null,
  description text        not null default '',
  date        date        not null,
  start_time  text        not null,
  end_time    text        not null,
  color_hex   text        not null default '#4CAF50',
  category    text        not null default 'General',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists calendar_events_user_id_idx on public.calendar_events (user_id);
create index if not exists calendar_events_date_idx    on public.calendar_events (user_id, date);

alter table public.calendar_events enable row level security;

create policy "calendar_events are readable by owner"   on public.calendar_events for select using (auth.uid() = user_id);
create policy "calendar_events are insertable by owner" on public.calendar_events for insert with check (auth.uid() = user_id);
create policy "calendar_events are updatable by owner"  on public.calendar_events for update using (auth.uid() = user_id);
create policy "calendar_events are deletable by owner"  on public.calendar_events for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- AUTO-UPDATE updated_at TRIGGER  (optional but useful)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create or replace trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create or replace trigger trg_transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

create or replace trigger trg_notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

create or replace trigger trg_habits_updated_at
  before update on public.habits
  for each row execute function public.set_updated_at();

create or replace trigger trg_calendar_events_updated_at
  before update on public.calendar_events
  for each row execute function public.set_updated_at();
