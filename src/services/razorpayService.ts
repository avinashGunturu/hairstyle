import { supabase } from './supabaseClient';
import { addCredits, updateUserPlan, getSubscriptionPlan } from './creditService';

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
        console.log('Initializing Razorpay with Key:', import.meta.env.VITE_RAZORPAY_KEY_ID ? 'Found' : 'Missing');
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
            handler: async function (response: any) {
                // Payment successful
                await handlePaymentSuccess(
                    paymentRecord.id,
                    response.razorpay_payment_id,
                    response.razorpay_signature || '',
                    plan,
                    session.user.id
                );
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
 * Handle successful payment
 */
async function handlePaymentSuccess(
    paymentRecordId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    plan: any,
    userId: string
) {
    try {
        console.log('Processing payment success for:', paymentRecordId);

        // Update payment record
        const { error: updateError } = await supabase
            .from('payment_transactions')
            .update({
                gateway_payment_id: razorpayPaymentId,
                gateway_signature: razorpaySignature,
                status: 'success',
                completed_at: new Date().toISOString()
            })
            .eq('id', paymentRecordId);

        if (updateError) {
            console.error('Failed to update payment transaction:', updateError);
            throw updateError;
        }

        console.log('Payment transaction updated. Adding credits...');

        // Add credits to user account
        const creditResult = await addCredits(
            userId,
            plan.credits,
            plan.plan_type === 'subscription' ? 'subscription' : 'topup',
            `Purchased ${plan.display_name}`,
            plan.id
        );

        if (!creditResult.success) {
            console.error('Failed to add credits:', creditResult.error);
            throw new Error(creditResult.error);
        }

        console.log('Credits added. Updating plan...');

        // Always update the user's plan type and dates on purchase/upgrade
        // Use the actual plan name (basic, starter, popular, pro, ultra, etc.)
        const durationDays = plan.duration_days > 0 ? plan.duration_days : 30; // Default to 30 days if not specified
        const planName = plan.plan_name || plan.id; // Use plan_name from database
        const planUpdateSuccess = await updateUserPlan(userId, planName, durationDays);
        if (!planUpdateSuccess) {
            console.error('Failed to update user plan details');
        }

        console.log('Payment processed successfully');
    } catch (error) {
        console.error('Error processing payment:', error);
        // We should probably alert the user here or show a modal
        alert('Payment succeeded at gateway but failed to update account. Please contact support.');
    }
}

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
