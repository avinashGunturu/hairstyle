-- =====================================================
-- FIX MISSING CREDITS & POLICIES
-- =====================================================

-- 1. Ensure INSERT policy exists for user_credits
-- This allows the client-side code to initialize credits if the trigger failed or didn't run
drop policy if exists "Users can insert own credits" on public.user_credits;
create policy "Users can insert own credits" on public.user_credits
  for insert with check (auth.uid() = user_id);

-- 2. Backfill missing credit records for ALL existing users
-- This loops through all users in auth.users and ensures they have a record in user_credits
do $$
declare
  r record;
begin
  for r in select id from auth.users loop
    insert into public.user_credits (user_id, credits, plan_type)
    values (r.id, 0, 'free')
    on conflict (user_id) do nothing;
  end loop;
end;
$$;
