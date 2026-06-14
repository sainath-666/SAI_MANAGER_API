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

create policy "habits are readable by owner" on public.habits
  for select using (auth.uid() = user_id);

create policy "habits are insertable by owner" on public.habits
  for insert with check (auth.uid() = user_id);

create policy "habits are updatable by owner" on public.habits
  for update using (auth.uid() = user_id);

create policy "habits are deletable by owner" on public.habits
  for delete using (auth.uid() = user_id);
