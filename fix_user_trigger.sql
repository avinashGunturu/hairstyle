-- =====================================================
-- AUTOMATIC USER INITIALIZATION TRIGGER
-- =====================================================

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Insert into user_credits with default values
  insert into public.user_credits (user_id, credits, plan_type)
  values (new.id, 0, 'free')
  on conflict (user_id) do nothing;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================
-- FIX RLS POLICIES (Ensuring access for later)
-- =====================================================

-- 1. USER CREDITS
-- Allow users to view their own credits
drop policy if exists "Users can view own credits" on public.user_credits;
create policy "Users can view own credits" on public.user_credits
  for select using (auth.uid() = user_id);

-- Allow users to update their own credits (if needed for client-side logic, though server-side is safer)
drop policy if exists "Users can update own credits" on public.user_credits;
create policy "Users can update own credits" on public.user_credits
  for update using (auth.uid() = user_id);

-- 2. PAYMENT TRANSACTIONS
-- Allow users to insert their own payments
drop policy if exists "Users can insert own payments" on public.payment_transactions;
create policy "Users can insert own payments" on public.payment_transactions
  for insert with check (auth.uid() = user_id);

-- Allow users to view their own payments
drop policy if exists "Users can view own payments" on public.payment_transactions;
create policy "Users can view own payments" on public.payment_transactions
  for select using (auth.uid() = user_id);

-- Allow users to update their own payments
drop policy if exists "Users can update own payments" on public.payment_transactions;
create policy "Users can update own payments" on public.payment_transactions
  for update using (auth.uid() = user_id);

-- 3. CREDIT TRANSACTIONS
-- Allow users to insert their own transactions
drop policy if exists "Users can insert own transactions" on public.credit_transactions;
create policy "Users can insert own transactions" on public.credit_transactions
  for insert with check (auth.uid() = user_id);

-- Allow users to view their own transactions
drop policy if exists "Users can view own transactions" on public.credit_transactions;
create policy "Users can view own transactions" on public.credit_transactions
  for select using (auth.uid() = user_id);
