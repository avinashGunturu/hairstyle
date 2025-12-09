/**
 * Centralized Constants File
 * All hardcoded values used across the application
 */

// ============================================
// STORAGE KEYS
// ============================================
export const STORAGE_KEYS = {
    GENDER_PREFERENCE: 'landing_gender_preference',
    SESSIONS: 'hairstyle_app_sessions',
    FREE_TOOL_USAGE_COUNT: 'free_tool_usage_count',
} as const;

// ============================================
// IMAGE CONFIGURATION
// ============================================
export const IMAGE_CONFIG = {
    SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'] as const,
    SUPPORTED_EXTENSIONS: ['JPG', 'JPEG', 'PNG', 'WebP', 'HEIC'] as const,
    MAX_FILE_SIZE_MB: 20,
    MAX_FILE_SIZE_BYTES: 20 * 1024 * 1024,
    DEFAULT_MAX_DIMENSION: 1024,
    DEFAULT_QUALITY: 0.8,
    OUTPUT_MIME_TYPE: 'image/jpeg' as const,
} as const;

// ============================================
// PAGINATION & LIMITS
// ============================================
export const PAGINATION = {
    HISTORY_PAGE_SIZE: 10,
    MAX_SESSIONS_STORED: 5,
    DEFAULT_HAIRSTYLE_LIMIT: 5,
    DEFAULT_HISTORY_LIMIT: 50,
} as const;

// ============================================
// HAIRSTYLE LISTS
// ============================================
export const HAIRSTYLES = {
    MALE_INTERNATIONAL: [
        "Pompadour", "Undercut", "Quiff", "Buzz Cut", "Crew Cut",
        "High Fade", "Side Part", "Slick Back", "Man Bun", "Faux Hawk"
    ],
    MALE_INDIAN: [
        "Classic Side Part", "Low Fade", "Textured Crop", "Medium Length Waves", "Short Back & Sides",
        "Bollywood Quiff", "Taper Fade", "Spiky Top", "Messy Fringe", "Modern Indian Cut"
    ],
    FEMALE_INTERNATIONAL: [
        "Classic Bob", "Pixie Cut", "Long Bob (Lob)", "Beach Waves", "Long Layers",
        "Curtain Bangs", "Shag Cut", "Blunt Cut", "Asymmetrical Bob", "Wolf Cut"
    ],
    FEMALE_INDIAN: [
        "Long Layered Cut", "U-Cut with Layers", "Step Cut", "Front Bangs", "Side Swept Layers",
        "Feather Cut", "Indian Bob", "Bollywood Waves", "Face Framing Layers", "Straight Blunt Cut"
    ],
} as const;

// ============================================
// FACE SHAPES
// ============================================
export const FACE_SHAPES = [
    'oval', 'round', 'square', 'heart', 'oblong', 'diamond'
] as const;

// ============================================
// API CONFIGURATION
// ============================================
export const API_CONFIG = {
    GEMINI_MODEL_FLASH: 'gemini-2.5-flash',
    GEMINI_MODEL_IMAGE: 'gemini-2.5-flash-image',
    RAZORPAY_SCRIPT_URL: 'https://checkout.razorpay.com/v1/checkout.js',
} as const;

// ============================================
// SUPABASE TABLE NAMES
// ============================================
export const SUPABASE_TABLES = {
    USER_CREDITS: 'user_credits',
    CREDIT_TRANSACTIONS: 'credit_transactions',
    SUBSCRIPTION_PLANS: 'subscription_plans',
    PAYMENT_TRANSACTIONS: 'payment_transactions',
    GENERATION_HISTORY: 'generation_history',
    HAIRSTYLES: 'hairstyles',
    FACE_ANALYSIS_LOGS: 'face_analysis_logs',
} as const;

// ============================================
// TRANSACTION TYPES
// ============================================
export const TRANSACTION_TYPES = {
    USAGE: 'usage',
    PURCHASE: 'purchase',
} as const;

// ============================================
// PLAN TYPES
// ============================================
export const PLAN_TYPES = {
    FREE: 'free',
    SUBSCRIPTION: 'subscription',
    TOPUP: 'topup',
} as const;

// ============================================
// PAYMENT STATUS
// ============================================
export const PAYMENT_STATUS = {
    PENDING: 'pending',
    SUCCESS: 'success',
    FAILED: 'failed',
} as const;

// ============================================
// HISTORY STATUS
// ============================================
export const HISTORY_STATUS = {
    ANALYSIS_STARTED: 'analysis_started',
    ANALYSIS_COMPLETE: 'analysis_complete',
    GENERATION_COMPLETE: 'generation_complete',
} as const;

// ============================================
// BRANDING
// ============================================
export const BRANDING = {
    APP_NAME: 'HairstyleAI',
    PRIMARY_COLOR: '#FF6B00',
    LOGO_PLACEHOLDER: 'https://placehold.co/256x256?text=H',
    CURRENCY: 'INR',
} as const;

// ============================================
// FREE TOOL LIMITS
// ============================================
export const FREE_TOOL_CONFIG = {
    MAX_FREE_USES: 5,
} as const;

// ============================================
// LANDING PAGE CONTENT
// ============================================
export const LANDING_PAGE_CONTENT = {
    TYPEWRITER_PHRASES: ["True Confidence", "Perfect Look", "Inner Glow", "Signature Style"],
} as const;

// ============================================
// CREDIT DEFAULTS
// ============================================
export const CREDIT_DEFAULTS = {
    INITIAL_CREDITS: 0,
    CREDIT_DEDUCTION_PER_USE: 1,
    DEFAULT_DURATION_DAYS: 30,
    CUSTOM_TOPUP_PRICE_PER_RENDER: 8,
} as const;

// ============================================
// GENDERS
// ============================================
export const GENDERS = {
    MALE: 'male',
    FEMALE: 'female',
    NON_BINARY: 'non-binary',
} as const;

// ============================================
// THEMES
// ============================================
export const THEMES = {
    DARK: 'dark',
    LIGHT: 'light',
} as const;

// ============================================
// ROUTES
// ============================================
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    SIGNUP: '/signup',
    FORGOT_PASSWORD: '/forgot-password',
    APP: '/app',
    SETTINGS: '/settings',
    HISTORY: '/history',
    ABOUT: '/about',
    CONTACT: '/contact',
    PRIVACY: '/privacy',
    TERMS: '/terms',
    SUCCESS_STORIES: '/success-stories',
    FACE_SHAPE_TOOL: '/face-shape-tool',
} as const;
