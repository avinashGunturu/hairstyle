import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession } from '../services/sessionService';
import { generateHairstyleImage } from '../services/geminiService'; // Removed invalid import
import { checkHasCredits, deductCredit } from '../services/creditService';
import { saveGenerationToHistory } from '../services/historyService';
import { SuggestionPanel } from './SuggestionPanel';
import { ResultView } from './ResultView';
import { LoadingOverlay } from './LoadingOverlay';
import { UserInfo, HistoryItem, AppView, FaceAnalysis, LoadingState } from '../types';

// We import the correct analysis function used in MainApp
import { analyzeFaceAndSuggestStyles } from '../services/geminiService';

interface AnalysisSessionPageProps {
    userInfo: UserInfo | null;
    setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
    onNavigate: (view: AppView) => void;
}

export const AnalysisSessionPage: React.FC<AnalysisSessionPageProps> = ({ userInfo, setHistory, onNavigate }) => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();

    // State
    const [analysis, setAnalysis] = useState<FaceAnalysis | null>(null);
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);
    const [sessionLoaded, setSessionLoaded] = useState(false);

    // 1. Hydrate Session
    useEffect(() => {
        if (!sessionId) {
            navigate('/app');
            return;
        }

        const session = getSession(sessionId);
        if (!session) {
            navigate('/app');
            return;
        }

        setAnalysis(session.analysis);
        setOriginalImage(session.originalImage);
        setGender(session.gender);
        setSessionLoaded(true);
    }, [sessionId, navigate]);


    // 2. Handle Style Generation
    const handleGenerateStyle = async (styleName: string, customPrompt?: string) => {
        if (!userInfo || !originalImage || !analysis) {
            setError("Missing session data.");
            return;
        }

        const hasCredits = await checkHasCredits(userInfo.id);
        if (!hasCredits) {
            setShowNoCreditsModal(true);
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

            // Deduct credit & notify header to update
            await deductCredit(userInfo.id, `Generated style: ${finalPrompt}`);
            window.dispatchEvent(new CustomEvent('creditsUpdated')); // Update header credits display

            await saveGenerationToHistory(
                userInfo.id,
                finalPrompt,
                analysis.faceShape,
                gender
            );

            // Optimistic History Update
            const newHistoryItem: HistoryItem = {
                id: window.crypto.randomUUID(),
                timestamp: Date.now(),
                customerName: userInfo.name, // Fallback to user name
                styleName: finalPrompt,
                faceShape: analysis.faceShape,
                originalImage: originalImage,
                generatedImage: resultImageUrl,
                gender: gender
            };
            setHistory(prev => [newHistoryItem, ...prev]);

            setLoadingState(LoadingState.IDLE);

        } catch (err: any) {
            console.error("Generation failed", err);
            setLoadingState(LoadingState.IDLE);
            window.dispatchEvent(new CustomEvent('apiError')); // Global modal
        }
    };

    // 3. Render - Wait for session to load
    if (!sessionLoaded) {
        return <LoadingOverlay message="Loading session..." />;
    }

    console.log("Generated Image", generatedImage);
    console.log("Selected Style", selectedStyle);


    // If we have a generated image, show the ResultView
    if (generatedImage && selectedStyle) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-fade-in">
                <ResultView
                    originalImage={originalImage}
                    generatedImage={generatedImage}
                    selectedStyle={selectedStyle}
                    onBack={() => setGeneratedImage(null)} // Go back to suggestions
                    // onBack={() => navigate('/app')}
                    onReset={() => navigate('/app')} // Go back to upload
                    onDownload={() => {
                        const link = document.createElement('a');
                        link.href = generatedImage;
                        link.download = `hairstyle-${selectedStyle.replace(/\s+/g, '-')}.jpg`;
                        link.click();
                    }}
                    onEmailShare={() => {
                        // Placeholder for email share functionality
                        console.log('Email share not implemented');
                    }}
                />
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 my-16 md:py-12">
            {loadingState === LoadingState.GENERATING && (
                <LoadingOverlay message="Generating your new look..." />
            )}

            <div className="mb-8">
                <button
                    onClick={() => navigate('/app')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Back to Upload
                </button>
            </div>

            <SuggestionPanel
                analysis={analysis}
                gender={gender}
                originalImage={originalImage}
                onSelectStyle={(style) => handleGenerateStyle(style)}
                onCustomPrompt={(prompt) => handleGenerateStyle("Custom Style", prompt)}
            />

            {/* No Credits Modal */}
            {showNoCreditsModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
                        onClick={() => setShowNoCreditsModal(false)}
                    />

                    {/* Modal */}
                    <div className="relative z-10 w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                        {/* Header with Icon */}
                        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-center">
                            <div className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-heading font-bold text-white">Out of Credits</h3>
                        </div>

                        {/* Content */}
                        <div className="p-6 text-center">
                            <p className="text-slate-600 dark:text-slate-300 mb-6">
                                You've used all your generation credits. Get more credits to continue creating amazing hairstyle transformations!
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        setShowNoCreditsModal(false);
                                        onNavigate('SETTINGS');
                                    }}
                                    className="w-full py-3 px-6 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold rounded-xl shadow-lg shadow-brand-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Get More Credits
                                </button>

                                <button
                                    onClick={() => setShowNoCreditsModal(false)}
                                    className="w-full py-3 px-6 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
