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

create index if not exists notes_user_id_idx on public.notes (user_id);
create index if not exists notes_is_pinned_idx on public.notes (user_id, is_pinned);

alter table public.notes enable row level security;

create policy "notes are readable by owner" on public.notes
  for select using (auth.uid() = user_id);

create policy "notes are insertable by owner" on public.notes
  for insert with check (auth.uid() = user_id);

create policy "notes are updatable by owner" on public.notes
  for update using (auth.uid() = user_id);

create policy "notes are deletable by owner" on public.notes
  for delete using (auth.uid() = user_id);
