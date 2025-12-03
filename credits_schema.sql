-- =====================================================
-- CREDIT & SUBSCRIPTION SYSTEM SCHEMA
-- =====================================================

-- ===== 1. USER CREDITS TABLE =====
create table if not exists public.user_credits (
  user_id uuid references auth.users(id) primary key,
  credits int default 0 check (credits >= 0),
  plan_type text default 'free' check (plan_type in ('free', 'basic', 'pro', 'enterprise')),
  plan_start_date timestamp with time zone,
  plan_end_date timestamp with time zone,
  auto_renew boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_credits enable row level security;

-- Policies
drop policy if exists "Users can view own credits" on public.user_credits;
drop policy if exists "Users can update own credits" on public.user_credits;

create policy "Users can view own credits" on public.user_credits
  for select using (auth.uid() = user_id);

create policy "Users can update own credits" on public.user_credits
  for update using (auth.uid() = user_id);

-- Auto-update timestamp trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists user_credits_updated_at on public.user_credits;
create trigger user_credits_updated_at
  before update on public.user_credits
  for each row execute function update_updated_at();

-- ===== 2. SUBSCRIPTION PLANS TABLE =====
create table if not exists public.subscription_plans (
  id uuid default gen_random_uuid() primary key,
  plan_name text unique not null,
  display_name text not null,
  credits int not null check (credits >= 0),
  price decimal(10,2) not null check (price >= 0),
  duration_days int not null check (duration_days >= 0),
  features jsonb default '[]'::jsonb,
  is_active boolean default true,
  plan_type text not null check (plan_type in ('subscription', 'topup')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.subscription_plans enable row level security;

-- Policy - anyone can view active plans
drop policy if exists "Anyone can view active plans" on public.subscription_plans;
create policy "Anyone can view active plans" on public.subscription_plans
  for select using (is_active = true);

-- ===== 3. CREDIT TRANSACTIONS TABLE =====
create table if not exists public.credit_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  transaction_type text not null check (transaction_type in ('purchase', 'usage', 'refund', 'bonus', 'expiry')),
  credits_change int not null,
  balance_after int not null check (balance_after >= 0),
  description text,
  related_to text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.credit_transactions enable row level security;

-- Policy - users can only view their own transactions
drop policy if exists "Users can view own transactions" on public.credit_transactions;
create policy "Users can view own transactions" on public.credit_transactions
  for select using (auth.uid() = user_id);

-- Index for faster queries
create index if not exists credit_transactions_user_id_idx on public.credit_transactions(user_id);
create index if not exists credit_transactions_created_at_idx on public.credit_transactions(created_at desc);

-- ===== 4. PAYMENT TRANSACTIONS TABLE =====
create table if not exists public.payment_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  plan_id uuid references public.subscription_plans(id),
  amount decimal(10,2) not null check (amount >= 0),
  currency text default 'INR' not null,
  payment_gateway text default 'razorpay' not null,
  gateway_order_id text,
  gateway_payment_id text,
  gateway_signature text,
  status text default 'pending' check (status in ('pending', 'success', 'failed', 'refunded')),
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- Enable RLS
alter table public.payment_transactions enable row level security;

-- Policy - users can only view their own payments
drop policy if exists "Users can view own payments" on public.payment_transactions;
create policy "Users can view own payments" on public.payment_transactions
  for select using (auth.uid() = user_id);

-- Index for faster queries
create index if not exists payment_transactions_user_id_idx on public.payment_transactions(user_id);
create index if not exists payment_transactions_gateway_order_id_idx on public.payment_transactions(gateway_order_id);
create index if not exists payment_transactions_status_idx on public.payment_transactions(status);

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert Subscription Plans (Monthly - matching homepage)
insert into public.subscription_plans (plan_name, display_name, credits, price, duration_days, features, plan_type) values
  ('basic', 'Basic Plan', 10, 49.00, 30, '["10 HD hairstyle renders", "Full hairstyle library", "Unlimited face shape checks", "Download and share freely", "No Watermark", "Standard Support"]'::jsonb, 'subscription'),
  ('starter', 'Starter Plan', 50, 249.00, 30, '["50 HD hairstyle renders", "Full hairstyle library", "Unlimited face shape checks", "Download and share freely", "No Watermark", "All Styles Access", "Priority Support"]'::jsonb, 'subscription'),
  ('popular', 'Popular Plan', 80, 499.00, 30, '["80 HD hairstyle renders", "Full hairstyle library", "Unlimited face shape checks", "Download and share freely", "No Watermark", "Priority Processing", "New Styles First"]'::jsonb, 'subscription'),
  ('pro', 'Pro Plan', 150, 899.00, 30, '["150 HD hairstyle renders", "Full hairstyle library", "Unlimited face shape checks", "Download and share freely", "No Watermark", "Priority Processing", "Dedicated Support"]'::jsonb, 'subscription'),
  ('ultra', 'Ultra Plan', 250, 1499.00, 30, '["250 HD hairstyle renders", "Full hairstyle library", "Unlimited face shape checks", "Download and share freely", "No Watermark", "Instant Processing", "VIP Support"]'::jsonb, 'subscription')
on conflict (plan_name) do nothing;

-- Insert Credit Top-up Packages (matching settings page add-ons)
insert into public.subscription_plans (plan_name, display_name, credits, price, duration_days, features, plan_type) values
  ('topup_mini', 'Mini Top-Up', 5, 39.00, 0, '["5 credits", "No expiry", "Instant activation"]'::jsonb, 'topup'),
  ('topup_small', 'Small Pack', 15, 129.00, 0, '["15 credits", "No expiry", "Instant activation"]'::jsonb, 'topup'),
  ('topup_medium', 'Medium Pack', 30, 199.00, 0, '["30 credits", "No expiry", "Instant activation"]'::jsonb, 'topup')
on conflict (plan_name) do nothing;
