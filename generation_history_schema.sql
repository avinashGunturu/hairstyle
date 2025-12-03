-- =====================================================
-- GENERATION HISTORY TABLE
-- Stores user's hairstyle generation history
-- =====================================================

-- 1. Create generation_history table
create table if not exists public.generation_history (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    style_name text not null,
    face_shape text,
    gender text check (gender in ('male', 'female')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- Index for faster queries
    constraint generation_history_user_id_created_at_idx unique (user_id, created_at)
);

-- 2. Create index for better performance
create index if not exists generation_history_user_id_idx on public.generation_history(user_id);
create index if not exists generation_history_created_at_idx on public.generation_history(created_at desc);

-- 3. Enable Row Level Security
alter table public.generation_history enable row level security;

-- 4. RLS Policies
drop policy if exists "Users can view own generation history" on public.generation_history;
drop policy if exists "Users can insert own generation history" on public.generation_history;
drop policy if exists "Users can delete own generation history" on public.generation_history;

create policy "Users can view own generation history" on public.generation_history
  for select using (auth.uid() = user_id);

create policy "Users can insert own generation history" on public.generation_history
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own generation history" on public.generation_history
  for delete using (auth.uid() = user_id);

-- 5. Grant permissions
grant select, insert, delete on public.generation_history to authenticated;
