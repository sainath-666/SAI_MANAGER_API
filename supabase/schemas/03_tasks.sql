create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  category text not null default 'General',
  due_date date,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_project_id_idx on public.tasks (project_id);

alter table public.tasks enable row level security;

create policy "tasks are readable by owner" on public.tasks
  for select using (auth.uid() = user_id);

create policy "tasks are insertable by owner" on public.tasks
  for insert with check (auth.uid() = user_id);

create policy "tasks are updatable by owner" on public.tasks
  for update using (auth.uid() = user_id);

create policy "tasks are deletable by owner" on public.tasks
  for delete using (auth.uid() = user_id);
