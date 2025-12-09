import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';
import { HairstyleSuggestion } from '../types';

/**
 * Database row structure from hairstyles table
 */
export interface HairstyleRow {
    id: number;
    shape: string;
    gender: string;
    hairstyle_name: string;
    hairstyle_image: string | null;
    description: string | null;
    reason: string | null;
    styling_advice: string | null;
}

/**
 * Get hairstyles from database based on face shape and gender
 * @param shape - Face shape (e.g., "Oval", "Round", "Square")
 * @param gender - Gender ("Male" or "Female")
 * @param limit - Maximum number of results (default 5)
 * @returns Array of HairstyleSuggestion objects
 */
export async function getHairstylesByFaceShape(
    shape: string,
    gender: string,
    limit: number = 5
): Promise<HairstyleSuggestion[]> {
    try {
        // Normalize inputs for case-insensitive matching
        const normalizedShape = shape.trim();
        const normalizedGender = gender.trim();

        logger.log(`[HairstyleService] Fetching hairstyles for shape: ${normalizedShape}, gender: ${normalizedGender}`);

        const { data, error } = await supabase
            .from('hairstyles')
            .select('*')
            .ilike('shape', normalizedShape)
            .ilike('gender', normalizedGender)
            .limit(limit);

        if (error) {
            console.error('[HairstyleService] Database error:', error);
            throw error;
        }

        if (!data || data.length === 0) {
            console.warn(`[HairstyleService] No hairstyles found for ${normalizedShape} ${normalizedGender}`);
            return [];
        }

        logger.log(`[HairstyleService] Found ${data.length} hairstyles`);

        // Map database rows to HairstyleSuggestion interface
        return (data as HairstyleRow[]).map(row => ({
            name: row.hairstyle_name,
            description: row.description || '',
            reason: row.reason || '',
            stylingAdvice: row.styling_advice || '',
            // Optionally include image if available
            ...(row.hairstyle_image && { hairstyleImage: row.hairstyle_image })
        }));
    } catch (err) {
        console.error('[HairstyleService] Error fetching hairstyles:', err);
        return [];
    }
}

/**
 * Get all hairstyles by gender (for Top 10 lists)
 * @param gender - Gender ("male" or "female")
 * @returns Array of HairstyleRow objects with all data
 */
export async function getAllHairstylesByGender(gender: string): Promise<HairstyleRow[]> {
    try {
        const normalizedGender = gender.trim().toLowerCase() === 'male' ? 'Male' : 'Female';

        logger.log(`[HairstyleService] Fetching all hairstyles for gender: ${normalizedGender}`);

        const { data, error } = await supabase
            .from('hairstyles')
            .select('*')
            .ilike('gender', normalizedGender);

        if (error) {
            console.error('[HairstyleService] Database error:', error);
            throw error;
        }

        logger.log(`[HairstyleService] Found ${data?.length || 0} hairstyles for ${normalizedGender}`);
        return (data as HairstyleRow[]) || [];
    } catch (err) {
        console.error('[HairstyleService] Error fetching all hairstyles:', err);
        return [];
    }
}

/**
 * Get a specific hairstyle by name and gender (for popup details)
 * @param name - Hairstyle name to search for
 * @param gender - Gender ("male" or "female") 
 * @returns HairstyleSuggestion or null if not found
 */
export async function getHairstyleByName(name: string, gender: string): Promise<HairstyleSuggestion | null> {
    try {
        const normalizedGender = gender.trim().toLowerCase() === 'male' ? 'Male' : 'Female';

        logger.log(`[HairstyleService] Fetching hairstyle: ${name} for gender: ${normalizedGender}`);

        const { data, error } = await supabase
            .from('hairstyles')
            .select('*')
            .ilike('hairstyle_name', name)
            .ilike('gender', normalizedGender)
            .limit(1);

        if (error) {
            console.error('[HairstyleService] Database error:', error);
            throw error;
        }

        if (!data || data.length === 0) {
            console.warn(`[HairstyleService] Hairstyle not found: ${name}`);
            return null;
        }

        const row = data[0] as HairstyleRow;
        return {
            name: row.hairstyle_name,
            description: row.description || '',
            reason: row.reason || `A popular ${normalizedGender.toLowerCase()} hairstyle.`,
            stylingAdvice: row.styling_advice || 'Consult your stylist for the best results.',
            ...(row.hairstyle_image && { hairstyleImage: row.hairstyle_image })
        };
    } catch (err) {
        console.error('[HairstyleService] Error fetching hairstyle by name:', err);
        return null;
    }
}

/**
 * Get all unique face shapes from the database
 * Useful for validation or dropdown options
 */
export async function getAvailableFaceShapes(): Promise<string[]> {
    try {
        const { data, error } = await supabase
            .from('hairstyles')
            .select('shape')
            .order('shape');

        if (error) throw error;

        // Get unique shapes
        const shapeArray: string[] = data?.map((row: { shape: string }) => row.shape as string) || [];
        const shapes: string[] = [...new Set(shapeArray)];
        return shapes;
    } catch (err) {
        console.error('[HairstyleService] Error fetching face shapes:', err);
        return [];
    }
}
