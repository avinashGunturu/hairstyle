import { FaceAnalysis } from '../types';

export interface SessionData {
    id: string;
    timestamp: number;
    analysis: FaceAnalysis;
    originalImage: string; // Base64
    gender: 'male' | 'female';
}

const STORAGE_KEY = 'hairstyle_app_sessions';

/**
 * Save a new session to localStorage
 * Returns the session ID
 */
export const saveSession = (
    analysis: FaceAnalysis,
    originalImage: string,
    gender: 'male' | 'female'
): string => {
    try {
        const id = crypto.randomUUID();
        const newSession: SessionData = {
            id,
            timestamp: Date.now(),
            analysis,
            originalImage,
            gender
        };

        // Get existing sessions
        const existingData = localStorage.getItem(STORAGE_KEY);
        const sessions: Record<string, SessionData> = existingData ? JSON.parse(existingData) : {};

        // Add new session
        sessions[id] = newSession;

        // Cleanup old sessions (keep last 5 to avoid quota limits)
        const sortedIds = Object.keys(sessions).sort((a, b) => sessions[b].timestamp - sessions[a].timestamp);
        if (sortedIds.length > 5) {
            const idsToDelete = sortedIds.slice(5);
            idsToDelete.forEach(deleteId => delete sessions[deleteId]);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        return id;
    } catch (error) {
        console.error('Failed to save session to localStorage:', error);
        // Fallback: If quota exceeded, try clearing all old sessions and retry once
        try {
            localStorage.removeItem(STORAGE_KEY);
            const id = crypto.randomUUID();
            const newSession: SessionData = {
                id,
                timestamp: Date.now(),
                analysis,
                originalImage,
                gender
            };
            const sessions = { [id]: newSession };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
            return id;
        } catch (retryError) {
            console.error('Critical storage error:', retryError);
            throw new Error('Failed to save session data locally. Your browser storage might be full.');
        }
    }
};

/**
 * Retrieve a session by ID
 */
export const getSession = (id: string): SessionData | null => {
    try {
        const existingData = localStorage.getItem(STORAGE_KEY);
        if (!existingData) return null;

        const sessions: Record<string, SessionData> = JSON.parse(existingData);
        return sessions[id] || null;
    } catch (error) {
        console.error('Error retrieving session:', error);
        return null;
    }
};

/**
 * Clear all sessions manually
 */
export const clearAllSessions = () => {
    localStorage.removeItem(STORAGE_KEY);
};
