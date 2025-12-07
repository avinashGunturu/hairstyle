import { supabase } from './supabaseClient';
import { HairstyleSuggestion } from '../types';

/**
 * Database row structure from hairstyles table
 */
interface HairstyleRow {
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

        console.log(`[HairstyleService] Fetching hairstyles for shape: ${normalizedShape}, gender: ${normalizedGender}`);

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

        console.log(`[HairstyleService] Found ${data.length} hairstyles`);

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
