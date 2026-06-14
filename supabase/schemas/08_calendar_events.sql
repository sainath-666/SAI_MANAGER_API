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

create policy "calendar_events are readable by owner" on public.calendar_events
  for select using (auth.uid() = user_id);

create policy "calendar_events are insertable by owner" on public.calendar_events
  for insert with check (auth.uid() = user_id);

create policy "calendar_events are updatable by owner" on public.calendar_events
  for update using (auth.uid() = user_id);

create policy "calendar_events are deletable by owner" on public.calendar_events
  for delete using (auth.uid() = user_id);
