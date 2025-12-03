-- Contact Messages Table
create table if not exists public.contact_messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  mobile text,
  topic text not null,
  message text not null,
  status text default 'new', -- 'new', 'read', 'responded'
  user_id uuid references auth.users(id) -- Nullable for guests
);

-- Enable RLS
alter table public.contact_messages enable row level security;

-- Drop existing policies if any
drop policy if exists "Enable insert for all users" on public.contact_messages;
drop policy if exists "Enable select for own messages" on public.contact_messages;

-- Allow anyone to insert messages
create policy "Enable insert for all users" on public.contact_messages 
  for insert with check (true);

-- Allow users to view their own messages
create policy "Enable select for own messages" on public.contact_messages 
  for select using (auth.uid() = user_id OR user_id is null);
