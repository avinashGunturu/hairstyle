/**
 * Gemini Service - Secure Version
 * 
 * This service calls Supabase Edge Functions instead of directly using the Gemini API.
 * The API key is stored securely server-side and never exposed to the browser.
 */

import { FaceAnalysis, Gender, FaceShapeResult } from "../types";
import { supabase } from "./supabaseClient";

// Get the Supabase project URL for edge function calls
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Helper to get the current user's JWT token for authenticated edge function calls
 */
async function getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        throw new Error("User not authenticated");
    }
    return session.access_token;
}

/**
 * Analyzes the user's face shape and suggest hairstyles using the secure edge function.
 */
export const analyzeFaceAndSuggestStyles = async (base64Image: string, gender: Gender): Promise<FaceAnalysis> => {
    const token = await getAuthToken();

    const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-face`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base64Image, gender }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Face analysis failed');
    }

    return response.json();
};

/**
 * Free Tool: Detects only the face shape without styling advice.
 * Uses edge function for secure API access.
 */
export const detectFaceShape = async (base64Image: string, gender: Gender, age?: string): Promise<FaceShapeResult> => {
    // For free tool, we might allow unauthenticated access or use a different approach
    // For now, try to get token but fall back to public access
    let headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    try {
        const token = await getAuthToken();
        headers['Authorization'] = `Bearer ${token}`;
    } catch {
        // User not logged in - edge function should handle this case
        // You may want to add a separate public endpoint for the free tool
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/detect-face-shape`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ base64Image, gender, age }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Face shape detection failed');
    }

    return response.json();
};

/**
 * Generates a hairstyle image using the secure edge function.
 */
export const generateHairstyleImage = async (base64Image: string, stylePrompt: string): Promise<string> => {
    const token = await getAuthToken();

    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-hairstyle`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base64Image, stylePrompt }),
    });

    if (!response.ok) {
        const error = await response.json();
        if (error.error === 'SAFETY_VIOLATION') {
            throw new Error('SAFETY_VIOLATION');
        }
        throw new Error(error.error || 'Image generation failed');
    }

    const result = await response.json();
    return result.image;
};

/**
 * Generates a preview image of the hairstyle on a generic model.
 * Note: This currently still uses direct API call - should be migrated to edge function
 * if you want to use this feature in production.
 */
export const generateHairstylePreview = async (styleName: string, description: string, gender: Gender): Promise<string | null> => {
    // This function is less critical and can be migrated later
    // For now, returning null to indicate feature not available via edge function
    console.warn('generateHairstylePreview: Not yet migrated to edge function');
    return null;
};
