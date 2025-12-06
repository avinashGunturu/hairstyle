import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardHome } from './DashboardHome';
import { UserInfoForm } from './UserInfoForm';
import { UploadArea } from './UploadArea';
import { SuggestionPanel } from './SuggestionPanel';
import { ResultView } from './ResultView';
import { LoadingOverlay } from './LoadingOverlay';
import { ErrorBanner } from './ErrorBanner';
import { UserInfo, HistoryItem, AppView, FaceAnalysis } from '../types';
import { analyzeFaceAndSuggestStyles, generateHairstyleImage } from '../services/geminiService';
import { checkHasCredits, deductCredit } from '../services/creditService';
import { saveGenerationToHistory } from '../services/historyService';

interface MainAppProps {
    userInfo: UserInfo | null;
    history: HistoryItem[];
    onNavigate: (view: AppView) => void;
    setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
}

type AppStage = 'DASHBOARD' | 'DETAILS' | 'UPLOAD' | 'PREVIEW' | 'ANALYSIS' | 'RESULT';

enum LoadingState {
    IDLE,
    ANALYZING,
    GENERATING,
}

export const MainApp: React.FC<MainAppProps> = ({ userInfo, history, onNavigate, setHistory }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [appStage, setAppStage] = useState<AppStage>('DASHBOARD');
    const [sessionUserInfo, setSessionUserInfo] = useState<UserInfo | null>(null);
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<FaceAnalysis | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [shouldNavigateToSuggestions, setShouldNavigateToSuggestions] = useState(false);

    // Loading States
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
    const [error, setError] = useState<string | null>(null);

    // Navigate to suggestions after analysis is complete
    useEffect(() => {
        if (shouldNavigateToSuggestions) {
            console.log("shouldNavigateToSuggestions is true. Checking dependencies...");
            console.log("Analysis:", !!analysis);
            console.log("OriginalImage:", !!originalImage);

            if (analysis && originalImage) {
                console.log("All conditions met. Navigating to suggestions...");
                setAppStage('ANALYSIS');
                navigate('/app/suggestions');
                setShouldNavigateToSuggestions(false);
            } else {
                console.warn("Waiting for state updates to complete...");
            }
        }
    }, [shouldNavigateToSuggestions, analysis, originalImage, navigate]);

    // Sync URL with AppStage (only for DASHBOARD)
    useEffect(() => {
        console.log("AppStage changed to:", appStage);
        console.log("Location pathname:", location.pathname);

        // Only redirect to dashboard if we are in DASHBOARD stage and not already there
        // AND we are not in a valid sub-route flow like suggestions
        if (appStage === 'DASHBOARD' && (location.pathname !== '/app' || location.pathname !== '/app/suggestions')) {
            console.log("Redirecting to /app because stage is DASHBOARD");
            navigate('/app');
        }
    }, [appStage, navigate, location.pathname]);

    // Handle direct access to /app/suggestions
    useEffect(() => {
        if (location.pathname === '/app/suggestions') {
            if (!analysis || !originalImage) {
                // Redirect to dashboard if data is missing
                console.log("Missing data on suggestions route (analysis or originalImage missing), redirecting to dashboard");
                setAppStage('DASHBOARD');
                navigate('/app', { replace: true });
            } else if (appStage !== 'ANALYSIS' && appStage !== 'RESULT') {
                console.log("Setting stage to ANALYSIS from URL");
                setAppStage('ANALYSIS');
            }
        }
    }, [location.pathname, analysis, originalImage, navigate, appStage]);

    // Reset state when starting fresh
    const handleStartNewSession = () => {
        setSessionUserInfo(userInfo); // Pre-fill with account info
        setOriginalImage(null);
        setAnalysis(null);
        setGeneratedImage(null);
        setSelectedStyle(null);
        setSelectedFile(null);
        setAppStage('DETAILS');
    };

    // State Validation - Relaxed to prevent premature resets
    useEffect(() => {
        // Only reset if we are deep in the flow and missing critical data, 
        // but allow some grace period or rely on component-level checks.
        // For now, we'll remove the aggressive auto-reset to fix the "not working" issue.
        // The components (SuggestionPanel, ResultView) handle missing data gracefully or we can check in render.
    }, [appStage, sessionUserInfo, originalImage]);


    // Handlers
    const handleDetailsSubmit = (data: UserInfo) => {
        setSessionUserInfo(data);
        setAppStage('UPLOAD');
    };

    const handleImageSelect = async (file: File) => {
        console.log("Image selected:", file.name, file.type, file.size);
        try {
            const reader = new FileReader();
            reader.onload = () => {
                console.log("File read successfully, showing preview...");
                setOriginalImage(reader.result as string);
                setSelectedFile(file);
                setAppStage('PREVIEW');
            };
            reader.onerror = (e) => {
                console.error("FileReader error:", e);
                setError("Failed to read image file.");
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error("handleImageSelect error:", err);
            setError("Failed to process image. Please try again.");
        }
    };

    const analyzeImage = async (file: File) => {
        console.log("Starting analyzeImage with file:", file.name);
        setLoadingState(LoadingState.ANALYZING);
        try {
            // Convert file to base64 for API
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = async () => {
                const base64Image = reader.result as string;
                console.log("Image converted to base64, calling API...");
                try {
                    const result = await analyzeFaceAndSuggestStyles(base64Image, sessionUserInfo?.gender || 'male');
                    console.log("Analysis result:", result);
                    setAnalysis(result);
                    setLoadingState(LoadingState.IDLE);
                    // Set flag to trigger navigation in useEffect after state updates
                    console.log("Analysis complete, setting navigation flag...");
                    setShouldNavigateToSuggestions(true);
                } catch (apiError: any) {
                    console.error("API Error during analysis:", apiError);
                    throw apiError;
                }
            };
        } catch (err: any) {
            console.error("Analysis failed:", err);
            setError(err.message || "Failed to analyze image. Please try another photo.");
            setLoadingState(LoadingState.IDLE);
            setAppStage('UPLOAD'); // Go back on failure
        }
    };

    const handleGenerateStyle = async (styleName: string, customPrompt?: string) => {
        // Explicit check before starting generation
        if (!userInfo || !originalImage || !sessionUserInfo || !analysis) {
            setError("Missing session data. Please start over.");
            setAppStage('DASHBOARD');
            return;
        }

        const hasCredits = await checkHasCredits(userInfo.id);
        if (!hasCredits) {
            setError("Insufficient credits. Please upgrade your plan.");
            // Optionally redirect to settings/pricing
            setTimeout(() => onNavigate('SETTINGS'), 2000);
            return;
        }

        setLoadingState(LoadingState.GENERATING);
        const finalPrompt = customPrompt || styleName;
        setSelectedStyle(finalPrompt);

        try {
            const resultImageUrl = await generateHairstyleImage(
                originalImage,
                finalPrompt
            );

            setGeneratedImage(resultImageUrl);

            // Deduct credit & Save history
            await deductCredit(userInfo.id);

            await saveGenerationToHistory(
                userInfo.id,
                finalPrompt,
                analysis.faceShape,
                sessionUserInfo.gender
            );

            const newHistoryItem: HistoryItem = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                customerName: sessionUserInfo.name,
                styleName: finalPrompt,
                faceShape: analysis.faceShape,
                originalImage: originalImage, // In a real app, we might not have the URL yet if it's base64, or we use the base64
                generatedImage: resultImageUrl,
                gender: sessionUserInfo.gender || 'male'
            };

            setHistory(prev => [newHistoryItem, ...prev]);

            setAppStage('RESULT');
        } catch (err: any) {
            console.error("Generation failed", err);
            setError(err.message || "Failed to generate hairstyle. Please try again.");
        } finally {
            setLoadingState(LoadingState.IDLE);
        }
    };

    const handleDownload = () => {
        if (generatedImage) {
            const link = document.createElement('a');
            link.href = generatedImage;
            link.download = `hairstyle-transformation-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleExitSession = () => {
        setOriginalImage(null);
        setSelectedFile(null);
        setAnalysis(null);
        setGeneratedImage(null);
        setSessionUserInfo(null);
        setAppStage('DASHBOARD');
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

            {loadingState === LoadingState.GENERATING && <LoadingOverlay message="Generating your new look..." />}
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
                <div className="animate-fade-in pt-8">
                    {loadingState === LoadingState.ANALYZING ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh]">
                            {/* Loading overlay handles this, but we can keep a placeholder if needed */}
                        </div>
                    ) : (
                        analysis && sessionUserInfo && (
                            <SuggestionPanel
                                analysis={analysis}
                                gender={sessionUserInfo.gender || 'male'}
                                originalImage={originalImage || ''}
                                onSelectStyle={(style) => handleGenerateStyle(style)}
                                onCustomPrompt={(prompt) => handleGenerateStyle('Custom Style', prompt)}
                            />
                        )
                    )}
                </div>
            )}

            {appStage === 'RESULT' && generatedImage && originalImage && (
                <ResultView
                    originalImage={originalImage}
                    generatedImage={generatedImage}
                    selectedStyle={selectedStyle || 'New Style'}
                    onBack={() => setAppStage('ANALYSIS')}
                    onReset={() => setAppStage('DASHBOARD')}
                    onDownload={handleDownload}
                    onEmailShare={() => { }}
                />
            )}
        </div>
    );
};
