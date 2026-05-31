create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  type text not null check (type in ('income', 'expense')),
  category text not null default 'General',
  date timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_date_idx on public.transactions (date);

alter table public.transactions enable row level security;

create policy "transactions are readable by owner" on public.transactions
  for select using (auth.uid() = user_id);

create policy "transactions are insertable by owner" on public.transactions
  for insert with check (auth.uid() = user_id);

create policy "transactions are updatable by owner" on public.transactions
  for update using (auth.uid() = user_id);

create policy "transactions are deletable by owner" on public.transactions
  for delete using (auth.uid() = user_id);
