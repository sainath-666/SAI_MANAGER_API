alter table public.projects
  add column if not exists category text not null default 'General',
  add column if not exists target_tasks_count integer not null default 0,
  add column if not exists completed_tasks_count integer not null default 0,
  add column if not exists due_date date;

alter table public.projects
  drop constraint if exists projects_status_check;

alter table public.projects
  alter column status set default 'Planning';

update public.projects
set status = case
  when status = 'completed' then 'Completed'
  when status = 'archived' then 'Completed'
  when status = 'active' then 'In Progress'
  else status
end;

alter table public.projects
  add constraint projects_status_check
  check (status in ('Planning', 'In Progress', 'Review', 'Completed'));

alter table public.tasks
  add column if not exists category text not null default 'General';

alter table public.tasks
  alter column project_id drop not null;

alter table public.tasks
  drop constraint if exists tasks_project_id_fkey;

alter table public.tasks
  add constraint tasks_project_id_fkey
  foreign key (project_id) references public.projects(id) on delete set null;
