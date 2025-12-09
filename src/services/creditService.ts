import { supabase } from './supabaseClient';

/**
 * Get user credit information
 */
export async function getUserCredits(userId: string) {
    try {
        const { data, error } = await supabase
            .from('user_credits')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            // If user doesn't have a credit record yet, it might be null
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }

        return data;
    } catch (err) {
        console.error('Error fetching user credits:', err);
        return null;
    }
}

/**
 * Check if user has available credits
 */
export async function checkHasCredits(userId: string): Promise<boolean> {
    const data = await getUserCredits(userId);
    return (data?.credits || 0) > 0;
}

/**
 * Get current credit balance
 */
export async function getCreditBalance(userId: string): Promise<number> {
    const data = await getUserCredits(userId);
    return data?.credits || 0;
}

/**
 * Initialize credits for a new user
 */
export async function initializeUserCredits(userId: string) {
    try {
        const { error } = await supabase
            .from('user_credits')
            .insert({
                user_id: userId,
                credits: 0,
                plan_type: 'free'
            });

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error initializing user credits:', err);
        return false;
    }
}

/**
 * Deduct a credit from user account
 */
export async function deductCredit(
    userId: string,
    reason: string,
    relatedTo?: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    try {
        // 1. Get current credits
        const userData = await getUserCredits(userId);

        if (!userData) {
            return { success: false, error: 'User credit record not found' };
        }

        if (userData.credits <= 0) {
            return { success: false, error: 'Insufficient credits' };
        }

        // 2. Deduct credit
        const newBalance = userData.credits - 1;
        const { error: updateError } = await supabase
            .from('user_credits')
            .update({
                credits: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (updateError) throw updateError;

        // 3. Log transaction
        await supabase.from('credit_transactions').insert({
            user_id: userId,
            transaction_type: 'usage',
            credits_change: -1,
            balance_after: newBalance,
            description: reason,
            related_to: relatedTo || 'style_generation'
        });

        return { success: true, newBalance };
    } catch (err: unknown) {
        console.error('Error deducting credit:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Add credits to user account
 */
export async function addCredits(
    userId: string,
    amount: number,
    source: string,
    description?: string,
    planId?: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    try {
        // 1. Get current credits (or create if doesn't exist)
        let userData = await getUserCredits(userId);

        if (!userData) {
            // Initialize if doesn't exist
            await initializeUserCredits(userId);
            userData = await getUserCredits(userId);
        }

        if (!userData) {
            return { success: false, error: 'Failed to initialize user credits' };
        }

        // 2. Add credits
        const newBalance = userData.credits + amount;
        const { error: updateError } = await supabase
            .from('user_credits')
            .update({
                credits: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (updateError) throw updateError;

        // 3. Log transaction
        await supabase.from('credit_transactions').insert({
            user_id: userId,
            transaction_type: 'purchase',
            credits_change: amount,
            balance_after: newBalance,
            description: description || `Purchased credits from ${source}`,
            related_to: source,
            metadata: planId ? { plan_id: planId } : {}
        });

        return { success: true, newBalance };
    } catch (err: unknown) {
        console.error('Error adding credits:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Update user plan after subscription purchase
 */
export async function updateUserPlan(
    userId: string,
    planName: string,
    durationDays: number
): Promise<boolean> {
    try {
        const planStartDate = new Date();
        const planEndDate = new Date();
        planEndDate.setDate(planEndDate.getDate() + durationDays);

        const { error } = await supabase
            .from('user_credits')
            .update({
                plan_type: planName,
                plan_start_date: planStartDate.toISOString(),
                plan_end_date: planEndDate.toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error updating user plan:', err);
        return false;
    }
}

/**
 * Get user's credit transaction history
 */
export async function getCreditTransactions(
    userId: string,
    limit: number = 10
) {
    try {
        const { data, error } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching credit transactions:', err);
        return [];
    }
}

/**
 * Get subscription plan details
 */
/**
 * Get subscription plan details
 */
export async function getSubscriptionPlan(planIdentifier: string) {
    try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planIdentifier);

        const query = supabase
            .from('subscription_plans')
            .select('*');

        if (isUuid) {
            query.eq('id', planIdentifier);
        } else {
            query.eq('plan_name', planIdentifier);
        }

        const { data, error } = await query.single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error fetching plan details:', err);
        return null;
    }
}

/**
 * Get all active subscription plans
 */
export async function getAllPlans(planType?: 'subscription' | 'topup') {
    try {
        let query = supabase
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true);

        if (planType) {
            query = query.eq('plan_type', planType);
        }

        const { data, error } = await query.order('price', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching plans:', err);
        return [];
    }
}
