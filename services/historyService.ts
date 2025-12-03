import { supabase } from './supabaseClient';

export interface GenerationHistoryItem {
    id: string;
    user_id: string;
    style_name: string;
    face_shape: string | null;
    gender: 'male' | 'female' | null;
    created_at: string;
}

/**
 * Save a new generation to history
 */
export async function saveGenerationToHistory(
    userId: string,
    styleName: string,
    faceShape?: string,
    gender?: 'male' | 'female'
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('generation_history')
            .insert({
                user_id: userId,
                style_name: styleName,
                face_shape: faceShape || null,
                gender: gender || null
            });

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error('Error saving generation history:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Get user's generation history
 */
export async function getUserHistory(
    userId: string,
    limit: number = 50
): Promise<GenerationHistoryItem[]> {
    try {
        const { data, error } = await supabase
            .from('generation_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching generation history:', err);
        return [];
    }
}

/**
 * Delete a history item
 */
export async function deleteHistoryItem(
    userId: string,
    historyId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('generation_history')
            .delete()
            .eq('id', historyId)
            .eq('user_id', userId); // Extra security check

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error('Error deleting history item:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Clear all history for a user
 */
export async function clearAllHistory(
    userId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('generation_history')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error('Error clearing history:', err);
        return { success: false, error: err.message };
    }
}
