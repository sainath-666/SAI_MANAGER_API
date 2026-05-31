create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'archived', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_project_id_idx on public.tasks (project_id);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

create policy "profiles are readable by owner" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles are insertable by owner" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles are updatable by owner" on public.profiles
  for update using (auth.uid() = id);

create policy "projects are readable by owner" on public.projects
  for select using (auth.uid() = user_id);

create policy "projects are insertable by owner" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "projects are updatable by owner" on public.projects
  for update using (auth.uid() = user_id);

create policy "projects are deletable by owner" on public.projects
  for delete using (auth.uid() = user_id);

create policy "tasks are readable by owner" on public.tasks
  for select using (auth.uid() = user_id);

create policy "tasks are insertable by owner" on public.tasks
  for insert with check (auth.uid() = user_id);

create policy "tasks are updatable by owner" on public.tasks
  for update using (auth.uid() = user_id);

create policy "tasks are deletable by owner" on public.tasks
  for delete using (auth.uid() = user_id);