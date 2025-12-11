// Supabase Edge Function: razorpay-webhook
// Securely handles Razorpay payment callbacks with signature verification
// Credits are only added after cryptographic verification - cannot be faked by users
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

/**
 * Verify Razorpay webhook signature using HMAC SHA256
 */
async function verifyRazorpaySignature(
    payload: string,
    signature: string,
    secret: string
): Promise<boolean> {
    try {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signatureBuffer = await crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(payload)
        );

        const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        return signature === expectedSignature;
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // Only accept POST requests
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        // 1. Get Razorpay webhook secret from environment
        const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
        if (!RAZORPAY_WEBHOOK_SECRET) {
            console.error('RAZORPAY_WEBHOOK_SECRET not configured');
            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 2. Get the raw body for signature verification
        const rawBody = await req.text();
        const signature = req.headers.get('x-razorpay-signature');

        if (!signature) {
            console.error('Missing Razorpay signature header');
            return new Response(JSON.stringify({ error: 'Missing signature' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 3. Verify the signature
        const isValid = await verifyRazorpaySignature(rawBody, signature, RAZORPAY_WEBHOOK_SECRET);
        if (!isValid) {
            console.error('Invalid Razorpay signature');
            return new Response(JSON.stringify({ error: 'Invalid signature' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        console.log('Signature verified successfully');

        // 4. Parse the webhook payload
        const payload = JSON.parse(rawBody);
        const event = payload.event;
        const paymentEntity = payload.payload?.payment?.entity;

        console.log('Webhook event:', event);
        console.log('Payment ID:', paymentEntity?.id);

        // 5. Create Supabase admin client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // 6. Handle payment.captured event
        if (event === 'payment.captured') {
            const razorpayPaymentId = paymentEntity?.id;
            const razorpayOrderId = paymentEntity?.order_id;
            const amount = paymentEntity?.amount; // In paise
            const notes = paymentEntity?.notes || {};

            // Notes should contain our payment_record_id and user_id
            const paymentRecordId = notes.payment_record_id;
            const userId = notes.user_id;
            const planId = notes.plan_id;

            if (!paymentRecordId || !userId) {
                console.error('Missing payment_record_id or user_id in notes');
                // Try to find by gateway_order_id if notes are missing
                const { data: paymentRecord } = await supabaseAdmin
                    .from('payment_transactions')
                    .select('*')
                    .eq('gateway_order_id', razorpayOrderId)
                    .single();

                if (!paymentRecord) {
                    console.log('Could not find payment record, but payment succeeded at gateway');
                    return new Response(JSON.stringify({ status: 'acknowledged' }), {
                        status: 200,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }
            }

            // Check if payment was already processed (idempotency)
            const { data: existingPayment } = await supabaseAdmin
                .from('payment_transactions')
                .select('status')
                .eq('id', paymentRecordId)
                .single();

            if (existingPayment?.status === 'success') {
                console.log('Payment already processed, skipping');
                return new Response(JSON.stringify({ status: 'already_processed' }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Update payment record
            const { error: updateError } = await supabaseAdmin
                .from('payment_transactions')
                .update({
                    gateway_payment_id: razorpayPaymentId,
                    status: 'success',
                    completed_at: new Date().toISOString(),
                    webhook_verified: true
                })
                .eq('id', paymentRecordId);

            if (updateError) {
                console.error('Failed to update payment transaction:', updateError);
                throw updateError;
            }

            // Get plan details
            const { data: plan } = await supabaseAdmin
                .from('subscription_plans')
                .select('*')
                .eq('id', planId)
                .single();

            if (!plan) {
                console.error('Plan not found:', planId);
                throw new Error('Plan not found');
            }

            // Get current user balance first
            const { data: currentCredits } = await supabaseAdmin
                .from('user_credits')
                .select('credits')
                .eq('user_id', userId)
                .single();

            const currentBalance = currentCredits?.credits || 0;
            const newBalance = currentBalance + plan.credits;

            // Update user's credit balance
            const { error: balanceError } = await supabaseAdmin
                .from('user_credits')
                .update({
                    credits: newBalance,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);

            if (balanceError) {
                console.error('Failed to update credit balance:', balanceError);
                throw balanceError;
            }

            console.log('Credits updated:', currentBalance, '->', newBalance);

            // Log the transaction with correct column names
            const { error: creditError } = await supabaseAdmin
                .from('credit_transactions')
                .insert({
                    user_id: userId,
                    transaction_type: 'purchase',
                    credits_change: plan.credits,
                    balance_after: newBalance,
                    description: `Purchased ${plan.display_name} (Webhook verified)`,
                    related_to: 'subscription',
                    metadata: { plan_id: plan.id, payment_id: razorpayPaymentId }
                });

            if (creditError) {
                console.error('Failed to log credit transaction:', creditError);
                // Don't throw here - credits already added, just log failed
            }

            // Update user's plan type
            const durationDays = plan.duration_days > 0 ? plan.duration_days : 30;
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + durationDays);

            await supabaseAdmin
                .from('user_credits')
                .update({
                    plan_type: plan.plan_type,
                    plan_expires_at: expiryDate.toISOString()
                })
                .eq('user_id', userId);

            console.log('Payment processed successfully via webhook');

            return new Response(JSON.stringify({ status: 'success' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 7. Handle payment.failed event
        if (event === 'payment.failed') {
            const notes = paymentEntity?.notes || {};
            const paymentRecordId = notes.payment_record_id;
            const errorDescription = paymentEntity?.error_description || 'Payment failed';

            if (paymentRecordId) {
                await supabaseAdmin
                    .from('payment_transactions')
                    .update({
                        status: 'failed',
                        error_message: errorDescription,
                        completed_at: new Date().toISOString()
                    })
                    .eq('id', paymentRecordId);
            }

            console.log('Payment failed:', errorDescription);

            return new Response(JSON.stringify({ status: 'acknowledged' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Acknowledge other events
        return new Response(JSON.stringify({ status: 'acknowledged' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
