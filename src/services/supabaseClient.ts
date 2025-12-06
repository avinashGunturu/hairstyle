
import { createClient } from '@supabase/supabase-js';

// Configuration using provided VITE environment variables with fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://svuhythvtdbtbleberdz.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dWh5dGh2dGRidGJsZWJlcmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODQ0MDAsImV4cCI6MjA4MDI2MDQwMH0.XCUXBEtX_fNO0nRtQ_AdAS2dpJ_xXAtVEPnHHuZkSbY';

export const supabase = createClient(supabaseUrl, supabaseKey);
