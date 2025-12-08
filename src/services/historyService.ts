import { supabase } from './supabaseClient';

export interface GenerationHistoryItem {
    id: string;
    user_id: string;
    customer_name: string | null;
    email: string | null;
    mobile: string | null;
    dob: string | null;
    style_name: string;
    face_shape: string | null;
    gender: 'male' | 'female' | null;
    status: 'analysis_started' | 'analysis_complete' | 'generation_complete';
    created_at: string;
    updated_at?: string;
}

export interface UserDetailsForSession {
    name: string;
    email: string;
    mobile?: string;
    dob?: string;
    gender: 'male' | 'female';
}

/**
 * Phase 1: Create a session record when user starts face analysis
 * Stores all user details for lead tracking and conversion analytics
 */
export async function createAnalysisSession(
    userId: string,
    faceShape: string,
    userDetails: UserDetailsForSession
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('generation_history')
            .insert({
                user_id: userId,
                customer_name: userDetails.name,
                email: userDetails.email,
                mobile: userDetails.mobile || null,
                dob: userDetails.dob || null,
                style_name: null, // Will be updated when user selects a style
                face_shape: faceShape,
                gender: userDetails.gender,
                status: 'analysis_complete'
            })
            .select('id')
            .single();

        if (error) throw error;
        console.log('[HistoryService] Created analysis session:', data?.id);
        return { success: true, sessionId: data?.id };
    } catch (err: any) {
        console.error('Error creating analysis session:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Phase 2: Update session when user generates a hairstyle
 * This completes the conversion tracking
 */
export async function updateSessionWithGeneration(
    sessionId: string,
    styleName: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('generation_history')
            .update({
                style_name: styleName,
                status: 'generation_complete',
                updated_at: new Date().toISOString()
            })
            .eq('id', sessionId);

        if (error) throw error;
        console.log('[HistoryService] Updated session with generation:', sessionId, styleName);
        return { success: true };
    } catch (err: any) {
        console.error('Error updating session with generation:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Get the latest analysis session for a user (without generation completed)
 * Useful for finding pending sessions
 */
export async function getLatestPendingSession(
    userId: string
): Promise<GenerationHistoryItem | null> {
    try {
        const { data, error } = await supabase
            .from('generation_history')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'analysis_complete')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        return data || null;
    } catch (err) {
        console.error('Error fetching pending session:', err);
        return null;
    }
}

/**
 * Save a new generation to history (original function - keeps backward compatibility)
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
                gender: gender || null,
                status: 'generation_complete'
            });

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error('Error saving generation history:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Get user's generation history (original - for backward compatibility)
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
 * Get user's generation history with pagination and filters
 * @param userId - User ID
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @param filters - Optional search filters
 * @returns Paginated result with data, total count, and pagination info
 */
export async function getUserHistoryPaginated(
    userId: string,
    page: number = 1,
    pageSize: number = 10,
    filters?: {
        searchQuery?: string;
        faceShape?: string;
        gender?: string;
    }
): Promise<{
    data: GenerationHistoryItem[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}> {
    try {
        const offset = (page - 1) * pageSize;

        // Build base query for count
        let countQuery = supabase
            .from('generation_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        // Apply filters to count query
        if (filters?.faceShape && filters.faceShape !== 'all') {
            countQuery = countQuery.ilike('face_shape', filters.faceShape);
        }
        if (filters?.gender && filters.gender !== 'all') {
            countQuery = countQuery.ilike('gender', filters.gender);
        }
        if (filters?.searchQuery) {
            // Search in customer_name or style_name
            countQuery = countQuery.or(`customer_name.ilike.%${filters.searchQuery}%,style_name.ilike.%${filters.searchQuery}%`);
        }

        const { count, error: countError } = await countQuery;

        if (countError) throw countError;

        const totalCount = count || 0;
        const totalPages = Math.ceil(totalCount / pageSize);

        // Build data query
        let dataQuery = supabase
            .from('generation_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        // Apply filters to data query
        if (filters?.faceShape && filters.faceShape !== 'all') {
            dataQuery = dataQuery.ilike('face_shape', filters.faceShape);
        }
        if (filters?.gender && filters.gender !== 'all') {
            dataQuery = dataQuery.ilike('gender', filters.gender);
        }
        if (filters?.searchQuery) {
            dataQuery = dataQuery.or(`customer_name.ilike.%${filters.searchQuery}%,style_name.ilike.%${filters.searchQuery}%`);
        }

        // Apply pagination
        dataQuery = dataQuery.range(offset, offset + pageSize - 1);

        const { data, error } = await dataQuery;

        if (error) throw error;

        return {
            data: data || [],
            totalCount,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        };
    } catch (err) {
        console.error('Error fetching paginated history:', err);
        return {
            data: [],
            totalCount: 0,
            currentPage: 1,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
        };
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

/**
 * Get conversion analytics (sessions started vs completed)
 */
export async function getConversionStats(
    userId?: string
): Promise<{ analysisCount: number; generationCount: number; conversionRate: number }> {
    try {
        let query = supabase.from('generation_history').select('status');
        if (userId) query = query.eq('user_id', userId);

        const { data, error } = await query;
        if (error) throw error;

        const analysisCount = data?.filter(d => d.status === 'analysis_complete' || d.status === 'generation_complete').length || 0;
        const generationCount = data?.filter(d => d.status === 'generation_complete').length || 0;
        const conversionRate = analysisCount > 0 ? (generationCount / analysisCount) * 100 : 0;

        return { analysisCount, generationCount, conversionRate: Math.round(conversionRate * 10) / 10 };
    } catch (err) {
        console.error('Error fetching conversion stats:', err);
        return { analysisCount: 0, generationCount: 0, conversionRate: 0 };
    }
}

