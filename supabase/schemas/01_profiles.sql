create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable by owner" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles are insertable by owner" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles are updatable by owner" on public.profiles
  for update using (auth.uid() = id);
