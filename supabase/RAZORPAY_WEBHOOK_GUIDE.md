# Razorpay Webhook Deployment Guide

## Overview
This guide explains how to deploy the secure Razorpay webhook that verifies payments server-side.

## Step 1: Add Database Column

Run this SQL in your Supabase SQL Editor:

```sql
-- Add webhook_verified column to payment_transactions
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS webhook_verified BOOLEAN DEFAULT FALSE;

-- Create RPC function for adding credits (idempotent)
CREATE OR REPLACE FUNCTION add_credits_to_user(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE user_credits 
  SET credits = credits + p_amount 
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Step 2: Add Supabase Secrets

Go to **Supabase Dashboard → Edge Functions → Secrets** and add:

| Secret Name | Value |
|------------|-------|
| `RAZORPAY_WEBHOOK_SECRET` | Your Razorpay Webhook Secret (from Razorpay Dashboard) |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key (from Settings → API) |

> ⚠️ **IMPORTANT**: The `RAZORPAY_WEBHOOK_SECRET` is different from `RAZORPAY_KEY_SECRET`. 
> You generate this secret when creating a webhook in Razorpay.

## Step 3: Deploy Edge Function

### Option A: Via Supabase CLI
```bash
supabase link --project-ref svuhythvtdbtbleberdz
supabase functions deploy razorpay-webhook
```

### Option B: Via Dashboard
1. Go to **Edge Functions** in Supabase Dashboard
2. Click **Create new edge function**
3. Name it `razorpay-webhook`
4. Copy the code from `supabase/functions/razorpay-webhook/index.ts`
5. Click **Deploy function**

## Step 4: Configure Razorpay Webhook

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to **Settings → Webhooks**
3. Click **+ Add New Webhook**
4. Configure:
   - **Webhook URL**: `https://svuhythvtdbtbleberdz.supabase.co/functions/v1/razorpay-webhook`
   - **Secret**: Generate a new secret and save it (this is `RAZORPAY_WEBHOOK_SECRET`)
   - **Active Events**: 
     - ✅ `payment.captured`
     - ✅ `payment.failed`
5. Click **Create Webhook**

## Step 5: Test the Flow

1. Make a test payment in your app
2. Check Supabase Edge Function logs for webhook receipt
3. Verify `webhook_verified = true` in `payment_transactions` table

## Security Flow

```
User pays → Razorpay captures → Webhook triggered → Signature verified → Credits added
                                      ↓
                               If signature invalid → Request rejected (401)
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Invalid signature | Check RAZORPAY_WEBHOOK_SECRET matches Razorpay dashboard |
| 500 Server error | Check SUPABASE_SERVICE_ROLE_KEY is set |
| Credits not added | Check Edge Function logs in Supabase |
| Webhook not received | Test with Razorpay's webhook test feature |
