
import { createClient } from '@supabase/supabase-js';

// Configuration using VITE environment variables (no hardcoded fallbacks for security)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail explicitly if environment variables are missing
if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        'Missing Supabase environment configuration. ' +
        'Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local'
    );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
