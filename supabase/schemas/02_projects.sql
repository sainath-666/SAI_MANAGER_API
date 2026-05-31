create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'Planning' check (status in ('Planning', 'In Progress', 'Review', 'Completed')),
  category text not null default 'General',
  target_tasks_count integer not null default 0 check (target_tasks_count >= 0),
  completed_tasks_count integer not null default 0 check (completed_tasks_count >= 0),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);

alter table public.projects enable row level security;

create policy "projects are readable by owner" on public.projects
  for select using (auth.uid() = user_id);

create policy "projects are insertable by owner" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "projects are updatable by owner" on public.projects
  for update using (auth.uid() = user_id);

create policy "projects are deletable by owner" on public.projects
  for delete using (auth.uid() = user_id);
