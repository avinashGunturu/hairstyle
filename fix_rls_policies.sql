-- =====================================================
-- FIX RLS POLICIES
-- =====================================================

-- 1. USER CREDITS
-- Allow users to insert their own initial credit record
create policy "Users can insert own credits" on public.user_credits
  for insert with check (auth.uid() = user_id);

-- 2. PAYMENT TRANSACTIONS
-- Allow users to create payment records
create policy "Users can insert own payments" on public.payment_transactions
  for insert with check (auth.uid() = user_id);

-- Allow users to update their own payment records (e.g. marking as success/failed)
create policy "Users can update own payments" on public.payment_transactions
  for update using (auth.uid() = user_id);

-- 3. CREDIT TRANSACTIONS
-- Allow users to log their own usage/purchases (Note: In production, move this to Edge Functions for security)
create policy "Users can insert own transactions" on public.credit_transactions
  for insert with check (auth.uid() = user_id);
