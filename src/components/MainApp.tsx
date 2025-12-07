import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardHome } from './DashboardHome';
import { UserInfoForm } from './UserInfoForm';
import { UploadArea } from './UploadArea';
import { LoadingOverlay } from './LoadingOverlay';
import { ErrorBanner } from './ErrorBanner';
import { UserInfo, HistoryItem, AppView, FaceAnalysis } from '../types';
import { detectFaceShape } from '../services/geminiService';
import { getHairstylesByFaceShape } from '../services/hairstyleService';
import { saveSession } from '../services/sessionService';

interface MainAppProps {
    userInfo: UserInfo | null;
    history: HistoryItem[];
    onNavigate: (view: AppView) => void;
}

type AppStage = 'DASHBOARD' | 'DETAILS' | 'UPLOAD' | 'PREVIEW' | 'ANALYSIS' | 'RESULT';

enum LoadingState {
    IDLE,
    ANALYZING,
    // GENERATING, // Removed as per instruction
}

export const MainApp: React.FC<MainAppProps> = ({ userInfo, history, onNavigate }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [appStage, setAppStage] = useState<AppStage>('DASHBOARD');
    const [sessionUserInfo, setSessionUserInfo] = useState<UserInfo | null>(null);
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<FaceAnalysis | null>(null);
    // const [generatedImage, setGeneratedImage] = useState<string | null>(null); // Removed as per instruction
    // const [selectedStyle, setSelectedStyle] = useState<string | null>(null); // Removed as per instruction
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [shouldNavigateToSuggestions, setShouldNavigateToSuggestions] = useState(false);

    // Loading States
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
    const [error, setError] = useState<string | null>(null);

    // Navigate to suggestions after analysis is complete
    useEffect(() => {
        if (shouldNavigateToSuggestions && analysis && originalImage) {
            setAppStage('ANALYSIS');
            navigate('/app/suggestions'); // This will likely be intercepted by the analyzeImage logic directly navigating, but keeping as backup
            setShouldNavigateToSuggestions(false);
        }
    }, [shouldNavigateToSuggestions, analysis, originalImage, navigate]);

    // Sync URL with AppStage - ONLY redirect from truly invalid states
    useEffect(() => {
        // 1. Don't interfere during loading or active navigation
        if (loadingState !== LoadingState.IDLE || shouldNavigateToSuggestions) {
            return;
        }

        const path = location.pathname;

        // 2. Handle Dashboard route
        if (appStage === 'DASHBOARD' && path !== '/app') {
            console.log("Dashboard stage mismatch, ensuring /app");
            navigate('/app');
        }
    }, [appStage, loadingState, location.pathname, shouldNavigateToSuggestions, navigate]);

    // Reset state when starting fresh
    const handleStartNewSession = () => {
        setSessionUserInfo(userInfo); // Pre-fill with account info
        setOriginalImage(null);
        setAnalysis(null);
        // setGeneratedImage(null); // Removed as per instruction
        // setSelectedStyle(null); // Removed as per instruction
        setSelectedFile(null);
        setAppStage('DETAILS');
    };

    // State Validation - Relaxed to prevent premature resets
    // Removed as per instruction

    // Handlers
    const handleDetailsSubmit = (data: UserInfo) => {
        setSessionUserInfo(data);
        setAppStage('UPLOAD');
    };

    const handleImageSelect = async (file: File) => {
        try {
            const reader = new FileReader();
            reader.onload = () => {
                setOriginalImage(reader.result as string);
                setSelectedFile(file);
                setAppStage('PREVIEW');
            };
            reader.onerror = (e) => {
                setError("Failed to read image file.");
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setError("Failed to process image. Please try again.");
        }
    };

    const analyzeImage = async (file: File) => {
        setLoadingState(LoadingState.ANALYZING);

        try {
            // Convert file to base64 using Promise wrapper
            const base64Image = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error("Failed to read image file"));
                reader.readAsDataURL(file);
            });

            const gender = sessionUserInfo?.gender || 'male';

            // Step 1: Detect face shape using Gemini AI
            console.log('[MainApp] Detecting face shape...');
            const faceShapeResult = await detectFaceShape(base64Image, gender);
            console.log('[MainApp] Detected face shape:', faceShapeResult.shape);

            // Step 2: Query database for hairstyles matching face shape and gender
            console.log('[MainApp] Fetching hairstyles from database...');
            const genderForDb = gender === 'male' ? 'Male' : 'Female';
            const suggestions = await getHairstylesByFaceShape(faceShapeResult.shape, genderForDb, 5);
            console.log('[MainApp] Found', suggestions.length, 'hairstyles');

            // Step 3: Build FaceAnalysis object
            const result: FaceAnalysis = {
                faceShape: faceShapeResult.shape,
                suggestions: suggestions
            };

            // Save session to local storage for persistence
            const sessionId = saveSession(result, base64Image, gender);

            setAnalysis(result);
            setLoadingState(LoadingState.IDLE);

            // Navigate to the specific session URL
            setAppStage('ANALYSIS');
            navigate(`/app/suggestions/${sessionId}`);
            setShouldNavigateToSuggestions(false);
        } catch (err: any) {
            console.error("Analysis failed:", err);
            setLoadingState(LoadingState.IDLE);
            setError(err.message || "Failed to analyze image. Please try another photo.");
            window.dispatchEvent(new CustomEvent('apiError'));
            setAppStage('UPLOAD');
        }
    };

    const handleExitSession = () => {
        setOriginalImage(null);
        setSelectedFile(null);
        setAnalysis(null);
        // setGeneratedImage(null); // Removed as per instruction
        setSessionUserInfo(null);
        setAppStage('DASHBOARD');
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

            {loadingState === LoadingState.ANALYZING && <LoadingOverlay message="Analyzing face structure..." />}

            {appStage === 'DASHBOARD' && (
                <DashboardHome
                    userInfo={userInfo}
                    history={history}

                    onNavigate={onNavigate}
                    onStartNew={handleStartNewSession}
                />
            )}

            {appStage === 'DETAILS' && (
                <div className="animate-fade-in max-w-2xl mx-auto pt-20">
                    <button onClick={handleExitSession} className="mb-4 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                        Back to Dashboard
                    </button>

                    <UserInfoForm
                        initialData={sessionUserInfo}
                        onSubmit={handleDetailsSubmit}
                    />

                </div>
            )}

            {appStage === 'UPLOAD' && (
                <div className="animate-fade-in max-w-2xl mx-auto pt-20">
                    <button onClick={() => setAppStage('DETAILS')} className="mb-4 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                        Back to Details
                    </button>
                    <UploadArea onImageSelected={handleImageSelect} />
                </div>
            )}

            {appStage === 'PREVIEW' && originalImage && (
                <div className="animate-fade-in max-w-2xl mx-auto pt-20 text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Preview Your Photo</h2>

                    <div className="relative w-full max-w-md mx-auto aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-neutral-800 mb-8">
                        <img
                            src={originalImage}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={() => {
                                setOriginalImage(null);
                                setSelectedFile(null);
                                setAppStage('UPLOAD');
                            }}
                            className="px-6 py-3 rounded-xl border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800 font-bold transition-all"
                        >
                            Retake Photo
                        </button>

                        <button
                            onClick={() => {
                                if (selectedFile) {
                                    setAppStage('ANALYSIS');
                                    analyzeImage(selectedFile);
                                }
                            }}
                            className="px-8 py-3 rounded-xl bg-brand-600 text-white font-bold shadow-lg hover:bg-brand-700 hover:shadow-brand-500/25 transition-all flex items-center gap-2"
                        >
                            <span>Generate Styles</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {appStage === 'ANALYSIS' && (
                <div className="animate-fade-in pt-8 flex flex-col items-center justify-center min-h-[60vh]">
                    {/* Placeholder while redirecting */}
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
                    <p className="mt-4 text-slate-500">Redirecting to session...</p>
                </div>
            )}
        </div>
    );
};
