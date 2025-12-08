
export enum LoadingState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING',
  ERROR = 'ERROR',
  LOGGING_OUT = 'LOGGING_OUT',
}

export type Gender = 'male' | 'female' | 'non-binary';

export type AppView = 'LANDING' | 'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD' | 'APP' | 'SETTINGS' | 'ABOUT' | 'CONTACT' | 'PRIVACY' | 'TERMS' | 'SUCCESS_STORIES' | 'HISTORY' | 'FREE_FACE_SHAPE';

export type AppStage = 'DASHBOARD' | 'DETAILS' | 'UPLOAD' | 'CONFIRM' | 'ANALYSIS' | 'RESULT';

export interface UserInfo {
  id?: string;
  name: string;
  email: string;
  mobile?: string;
  dob?: string;
  gender: Gender;
}

export interface HairstyleSuggestion {
  name: string;
  description: string;
  reason: string;
  stylingAdvice: string; // Beard for men, Brows/Lashes for women
  hairstyleImage?: string; // Optional: Image URL from database
}

export interface FaceAnalysis {
  faceShape: string;
  suggestions: HairstyleSuggestion[];
}

export interface FaceShapeResult {
  shape: string;
  confidence: number;
  description: string;
  keyFeatures: string[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export interface GeneratedImage {
  id: string;
  originalUrl: string;
  generatedUrl: string;
  prompt: string;
  timestamp: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  customerName?: string;
  email?: string;
  mobile?: string;
  dob?: string;
  styleName: string | null;
  faceShape: string;
  originalImage: string; // Deprecated: No longer stored for privacy
  generatedImage: string; // Deprecated: No longer stored for privacy
  gender: Gender;
  status?: 'analysis_started' | 'analysis_complete' | 'generation_complete';
}
