import { supabase } from './supabaseClient';
import { getSubscriptionPlan } from './creditService';
import { logger } from '../utils/logger';

// Declare Razorpay on window
declare global {
    interface Window {
        Razorpay: any;
    }
}

/**
 * Load Razorpay script dynamically
 */
export function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

/**
 * Create a payment order and initiate Razorpay checkout
 */
export async function initiatePurchase(
    planId: string,
    onSuccess?: () => void,
    onFailure?: (error: string) => void
) {
    try {
        logger.log('Initializing Razorpay with Key:', import.meta.env.VITE_RAZORPAY_KEY_ID ? 'Found' : 'Missing');
        // Load Razorpay script
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            throw new Error('Failed to load Razorpay SDK');
        }

        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            throw new Error('User not authenticated');
        }

        // Get plan details
        const plan = await getSubscriptionPlan(planId);
        if (!plan) {
            throw new Error('Plan not found');
        }

        // Create payment record in database
        const { data: paymentRecord, error: paymentError } = await supabase
            .from('payment_transactions')
            .insert({
                user_id: session.user.id,
                plan_id: plan.id,
                amount: plan.price,
                currency: 'INR',
                status: 'pending'
            })
            .select()
            .single();

        if (paymentError) throw paymentError;

        // Razorpay options
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: Math.round(plan.price * 100), // Convert to paise
            currency: 'INR',
            name: 'HairstyleAI',
            description: plan.display_name,
            image: 'https://placehold.co/256x256?text=H', // Use public URL to avoid CORS on localhost
            // Include metadata for webhook verification
            notes: {
                payment_record_id: paymentRecord.id,
                user_id: session.user.id,
                plan_id: plan.id,
                plan_name: plan.display_name
            },
            handler: async function (response: any) {
                // Payment successful at client side
                // NOTE: Credits are added by webhook, NOT here
                // This handler just updates UI and logs the attempt
                logger.log('Payment completed at client:', response.razorpay_payment_id);

                // Update payment record with gateway payment ID (webhook will mark as success)
                await supabase
                    .from('payment_transactions')
                    .update({
                        gateway_payment_id: response.razorpay_payment_id,
                        gateway_signature: response.razorpay_signature || '',
                        // Don't set status to 'success' here - webhook does that after verification
                        status: 'processing'
                    })
                    .eq('id', paymentRecord.id);

                // Show success message - credits will be added by webhook
                if (onSuccess) onSuccess();
            },
            prefill: {
                email: session.user.email,
                contact: session.user.user_metadata?.mobile || ''
            },
            theme: {
                color: '#FF6B00' // Your brand color
            },
            modal: {
                ondismiss: function () {
                    // User closed the payment modal
                    handlePaymentFailure(paymentRecord.id, 'Payment cancelled by user');
                    if (onFailure) onFailure('Payment cancelled');
                }
            }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();

    } catch (error: any) {
        console.error('Payment initiation failed:', error);
        if (onFailure) onFailure(error.message);
    }
}

/**
 * NOTE: handlePaymentSuccess has been removed.
 * Credits are now added securely via the Razorpay webhook edge function.
 * This prevents users from faking payment callbacks to get free credits.
 * See: supabase/functions/razorpay-webhook/index.ts
 */

/**
 * Handle failed payment
 */
async function handlePaymentFailure(paymentRecordId: string, errorMessage: string) {
    try {
        await supabase
            .from('payment_transactions')
            .update({
                status: 'failed',
                error_message: errorMessage,
                completed_at: new Date().toISOString()
            })
            .eq('id', paymentRecordId);
    } catch (error) {
        console.error('Error updating payment failure:', error);
    }
}
