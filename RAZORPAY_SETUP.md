# Razorpay Setup Instructions (Vite)

## Step 2.1: Get Razorpay API Keys

### For Test/Development Mode:

1. Go to https://razorpay.com/
2. Sign up or Log in to your Razorpay account
3. Go to **Settings** (gear icon) → **API Keys**
4. Click **Generate Test Keys**
5. You'll see:
   - **Key ID**: Starts with `rzp_test_`
   - **Key Secret**: Click "eye" icon to reveal

### Add to .env.local:

Since you are using **Vite**, you must use the `VITE_` prefix:

```env
# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
VITE_RAZORPAY_KEY_SECRET=YOUR_SECRET_KEY_HERE
```

**Note:** 
- `VITE_RAZORPAY_KEY_ID` is exposed to the browser (for Razorpay checkout)

### For Production (Later):

When you're ready to go live:
1. Complete KYC verification in Razorpay dashboard
2. Generate **Live Keys** (start with `rzp_live_`)
3. Replace test keys with live keys

## What's Been Done:

✅ Razorpay SDK installed (`npm install razorpay`)
✅ Ready to accept your API keys

## Next Step:

After adding your Razorpay keys to `.env.local`, restart your dev server (`npm run dev`) to load the new variables!
