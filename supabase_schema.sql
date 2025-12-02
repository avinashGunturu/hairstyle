create table if not exists public.face_analysis_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id), -- Nullable for guests
  created_by text not null, -- 'authenticated' or 'user'
  user_name text,
  user_email text,
  user_gender text,
  user_age text,
  face_shape text,
  confidence numeric,
  api_response jsonb, -- Full result from Gemini
  usage_info jsonb -- Token usage and cost
);

-- Enable RLS
alter table public.face_analysis_logs enable row level security;

-- Drop existing policies to ensure clean state
drop policy if exists "Enable insert for all users" on public.face_analysis_logs;
drop policy if exists "Enable select for users based on user_id" on public.face_analysis_logs;
drop policy if exists "Enable select for guests" on public.face_analysis_logs;
drop policy if exists "Enable update for users based on user_id" on public.face_analysis_logs;
drop policy if exists "Enable update for guests" on public.face_analysis_logs;

-- Allow inserts from anyone (since guests can use it)
create policy "Enable insert for all users" on public.face_analysis_logs for insert with check (true);

-- Allow select only for own rows (authenticated)
create policy "Enable select for users based on user_id" on public.face_analysis_logs for select using (auth.uid() = user_id);

-- Allow select for guests (where user_id is null) - Needed for returning representation after insert
create policy "Enable select for guests" on public.face_analysis_logs for select using (user_id is null);

-- Allow update for own rows (authenticated)
create policy "Enable update for users based on user_id" on public.face_analysis_logs for update using (auth.uid() = user_id);

-- Allow update for guest rows (where user_id is null)
create policy "Enable update for guests" on public.face_analysis_logs for update using (user_id is null);
