import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { UserInfoForm } from './components/UserInfoForm';
import { UploadArea } from './components/UploadArea';
import { SuggestionPanel } from './components/SuggestionPanel';
import { ResultView } from './components/ResultView';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ImageConfirmation } from './components/ImageConfirmation';
import { LandingPage } from './components/LandingPage';
import { Footer } from './components/Footer';
import { AuthPage } from './components/AuthPage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { PrivacyPage } from './components/PrivacyPage';
import { TermsPage } from './components/TermsPage';
import { SettingsPage } from './components/SettingsPage';
import { DashboardHome } from './components/DashboardHome';
import { SuccessStoriesPage } from './components/SuccessStoriesPage';
import { HistoryPage } from './components/HistoryPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { FreeFaceShapeTool } from './components/FreeFaceShapeTool';
import { analyzeFaceAndSuggestStyles, generateHairstyleImage } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { checkHasCredits, deductCredit, getCreditBalance } from './services/creditService';
import { saveGenerationToHistory, getUserHistory } from './services/historyService';
import { FaceAnalysis, LoadingState, UserInfo, AppView, AppStage, HistoryItem } from './types';

// Error Banner Component
const ErrorBanner = ({ message, onDismiss }: { message: string, onDismiss: () => void }) => (
  <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[110] w-[90%] max-w-lg animate-fade-in">
    <div className="bg-red-50 dark:bg-red-900/90 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-xl shadow-lg flex items-start gap-3 backdrop-blur-md">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mt-0.5 shrink-0 text-red-600 dark:text-red-400">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
      </svg>
      <div className="flex-1 min-w-0 text-sm font-medium break-words">{message}</div>
      <button onClick={onDismiss} className="text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800 p-1 rounded-lg transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  // Theme Management
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'dark' | 'light' || 'dark';
    }
    return 'dark';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
  }, [theme]);

  // Navigation State
  const [currentView, setCurrentView] = useState<AppView>('LANDING');
  const [appStage, setAppStage] = useState<AppStage>('DASHBOARD');

  // Data State
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [sessionUserInfo, setSessionUserInfo] = useState<UserInfo | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Generation State
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FaceAnalysis | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [error, setError] = useState<string | null>(null);

  const currentViewRef = useRef(currentView);
  const appStageRef = useRef(appStage);

  // Keep refs in sync with state
  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  useEffect(() => {
    appStageRef.current = appStage;
  }, [appStage]);

  // Supabase Auth Listener - Single source of truth
  useEffect(() => {
    let mounted = true;
    console.log('[Auth] Hydrating session and setting up listener');

    let authSubscription: any = null; // To hold the subscription object

    const hydrate = async () => {
      try {
        // 1) immediate getSession to hydrate UI quickly on refresh
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) console.warn('[Auth] getSession error:', sessionErr);
        const session = sessionData?.session;

        if (session?.user && mounted) {
          const u = session.user;
          const userData = {
            id: u.id,
            name: u.user_metadata?.full_name || 'User',
            email: u.email || '',
            gender: u.user_metadata?.gender || 'male',
            mobile: u.user_metadata?.mobile,
            dob: u.user_metadata?.dob,
          };
          setUserInfo(userData);
          setSessionUserInfo(userData);

          // fetch history (defensive)
          try {
            const dbHistory = await getUserHistory(u.id);
            const formattedHistory: HistoryItem[] = dbHistory.map((item: any) => ({
              id: item.id,
              timestamp: new Date(item.created_at).getTime(),
              customerName: u.user_metadata?.full_name || 'User',
              styleName: item.style_name,
              faceShape: item.face_shape || 'Unknown',
              originalImage: '',
              generatedImage: '',
              gender: item.gender || u.user_metadata?.gender || 'male'
            }));
            setHistory(formattedHistory);
          } catch (err) {
            console.error('[Auth] error loading history on hydrate', err);
          }

          // make sure app shows dashboard when hydrated
          // Only redirect if we are on a "public" page that should be dashboard, 
          // or if we want to force dashboard. 
          // For now, respecting the logic to set dashboard if we have a user.
          setAppStage('DASHBOARD');
          setCurrentView('APP');
        }

        // 2) set up listener (single)
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('[Auth] event', event);
          if (event === 'SIGNED_OUT') {
            setUserInfo(null);
            setSessionUserInfo(null);
            setHistory([]);
            setOriginalImage(null);
            setAnalysis(null);
            setGeneratedImage(null);
            // navigate away from protected pages
            const view = currentViewRef.current;
            if (view === 'APP' || view === 'SETTINGS' || view === 'HISTORY') {
              setCurrentView('LANDING');
              setAppStage('DASHBOARD');
            }
            return;
          }

          if (session?.user) {
            const u = session.user;
            const userData = {
              id: u.id,
              name: u.user_metadata?.full_name || 'User',
              email: u.email || '',
              gender: u.user_metadata?.gender || 'male',
              mobile: u.user_metadata?.mobile,
              dob: u.user_metadata?.dob,
            };
            setUserInfo(userData);
            setSessionUserInfo(userData);

            // fetch history on sign in
            try {
              const dbHistory = await getUserHistory(u.id);
              const formattedHistory: HistoryItem[] = dbHistory.map((item: any) => ({
                id: item.id,
                timestamp: new Date(item.created_at).getTime(),
                customerName: u.user_metadata?.full_name || 'User',
                styleName: item.style_name,
                faceShape: item.face_shape || 'Unknown',
                originalImage: '',
                generatedImage: '',
                gender: item.gender || u.user_metadata?.gender || 'male'
              }));
              setHistory(formattedHistory);
            } catch (err) {
              console.error('[Auth] Error fetching history after sign in:', err);
            }

            // nav rules
            if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
              setAppStage('DASHBOARD');
              setCurrentView('APP');
            } else {
              const view = currentViewRef.current;
              if (view === 'LOGIN' || view === 'SIGNUP') {
                setAppStage('DASHBOARD');
                setCurrentView('APP');
              }
            }
          }
        });
        authSubscription = subscription; // Store the subscription
      } catch (err) {
        console.error('[Auth] hydrate failure', err);
      }
    };

    hydrate();

    // clean up subscription on unmount
    return () => {
      mounted = false;
      if (authSubscription) {
        try {
          authSubscription.unsubscribe();
          console.log('[Auth] unsubscribed');
        } catch (err) {
          console.warn('[Auth] subscription cleanup failed', err);
        }
      }
    };
  }, []); // Empty deps - only run once

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    if (view === 'APP' && appStage !== 'DASHBOARD' && !originalImage) {
      // Reset to dashboard if navigating to app without an active session
      setAppStage('DASHBOARD');
    }
    window.scrollTo(0, 0);
  };

  const handleAuthSuccess = () => {
    // Auth success handled by onAuthStateChange, but this ensures navigation logic if needed
    setAppStage('DASHBOARD');
    handleNavigate('APP');
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        // fallback: still clear UI but surface an error
      }
    } catch (err) {
      console.error('Unexpected signOut failure', err);
    } finally {
      // clear local state and (optionally) localStorage tokens
      setUserInfo(null);
      setSessionUserInfo(null);
      setOriginalImage(null);
      setAnalysis(null);
      setGeneratedImage(null);
      setHistory([]);
      // recommended: remove supabase auth tokens (v2 stores in browser automatically, but in edge cases)
      try { localStorage.removeItem('supabase.auth.token'); } catch (e) { }
      handleNavigate('LANDING');
    }
  };

  // --- App Stage Handlers ---

  const handleStartNewSession = () => {
    // Start a new session. DO NOT pre-fill details to allow user to enter fresh info.
    setSessionUserInfo(userInfo); // Reset to logged-in user
    setOriginalImage(null);
    setAnalysis(null);
    setGeneratedImage(null);
    setError(null);
    setAppStage('UPLOAD');
    handleNavigate('APP');
  };

  const handleSessionDetailsSubmit = (data: UserInfo) => {
    setSessionUserInfo(data);
    // If the user updated their own info during session setup, optionally update main profile
    // For now, we keep session info separate unless explicitly syncing
    setAppStage('UPLOAD');
  };

  const handleImageSelect = useCallback((base64Image: string) => {
    setOriginalImage(base64Image);
    setAnalysis(null);
    setGeneratedImage(null);
    setSelectedStyle('');
    setError(null);
    setAppStage('CONFIRM');
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!originalImage || !sessionUserInfo) return;

    setLoadingState(LoadingState.ANALYZING);
    setError(null);

    try {
      const result = await analyzeFaceAndSuggestStyles(originalImage, sessionUserInfo.gender);
      setAnalysis(result);
      setLoadingState(LoadingState.IDLE);
      setAppStage('ANALYSIS');
    } catch (err: any) {
      setError("Could not analyze image. Please ensure the face is clearly visible.");
      setLoadingState(LoadingState.ERROR);
    }
  }, [originalImage, sessionUserInfo]);

  const handleRetake = () => {
    setOriginalImage(null);
    setAnalysis(null);
    setGeneratedImage(null);
    setError(null);
    setAppStage('UPLOAD');
  };

  const handleGenerateStyle = useCallback(async (stylePrompt: string) => {
    if (!originalImage || !sessionUserInfo) return;

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session check:', session?.user ? 'Logged in' : 'Not logged in', session?.user?.id);
    if (!session?.user) {
      setError('Please log in to generate hairstyles.');
      return;
    }

    // Check if user has credits
    console.log('Checking credits for user:', session.user.id);
    // Use local state for immediate check if possible, but double check with DB
    const hasCredits = await checkHasCredits(session.user.id);
    console.log('Has credits?', hasCredits);

    if (!hasCredits) {
      const balance = await getCreditBalance(session.user.id);
      console.log('Credit balance:', balance);
      setError(`Insufficient credits! You have ${balance} credits. Redirecting to purchase...`);
      setLoadingState(LoadingState.IDLE);
      // Navigate to settings after a brief delay
      setTimeout(() => {
        handleNavigate('SETTINGS');
      }, 2000);
      return;
    }

    setSelectedStyle(stylePrompt);
    setLoadingState(LoadingState.GENERATING);
    setError(null);

    try {
      const resultBase64 = await generateHairstyleImage(originalImage, stylePrompt);
      setGeneratedImage(resultBase64);

      // Deduct credit after successful generation
      const deductResult = await deductCredit(
        session.user.id,
        `Generated ${stylePrompt} hairstyle`,
        'style_generation'
      );

      if (!deductResult.success) {
        console.error('Failed to deduct credit:', deductResult.error);
        // Still show the image, but log the error
      }

      setLoadingState(LoadingState.IDLE);
      setAppStage('RESULT');

      // Save to Database History
      await saveGenerationToHistory(
        session.user.id,
        stylePrompt,
        analysis?.faceShape,
        sessionUserInfo.gender
      );

      // Update local history immediately
      const newHistoryItem: HistoryItem = {
        id: crypto.randomUUID(), // Temporary ID for immediate display
        timestamp: Date.now(),
        customerName: sessionUserInfo.name,
        styleName: stylePrompt,
        faceShape: analysis?.faceShape || 'Unknown',
        originalImage: '', // Privacy
        generatedImage: '', // Privacy
        gender: sessionUserInfo.gender
      };
      setHistory(prev => [newHistoryItem, ...prev]);

    } catch (err: any) {
      console.error(err);
      if (err.message === 'SAFETY_VIOLATION') {
        setError("Image blocked by safety filters. Please verify your photo does not violate safety policies (e.g. nudity or sensitive content) and try again.");
      } else {
        setError("Failed to generate hairstyle. Please try again.");
      }
      setLoadingState(LoadingState.IDLE);
    }
  }, [originalImage, analysis, sessionUserInfo, history]);

  const handleDownload = useCallback(() => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `hairstyle-ai-${selectedStyle.toLowerCase().replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [generatedImage, selectedStyle]);

  const handleEmailShare = useCallback(async () => {
    if (!generatedImage) return;

    // 1. Try Web Share API (Support for mobile native sharing)
    if (navigator.share) {
      try {
        const response = await fetch(generatedImage);
        const blob = await response.blob();
        const file = new File([blob], `hairstyle-ai-${selectedStyle.replace(/\s+/g, '-')}.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'My New Hairstyle',
            text: `Check out my new ${selectedStyle} look generated by HairstyleAI!`,
            files: [file],
          });
          return;
        }
      } catch (error) {
        console.warn("Web Share API failed or not fully supported, falling back to mailto.", error);
      }
    }

    // 2. Fallback: Mailto Link
    const targetEmail = sessionUserInfo?.email || userInfo?.email || "";
    const subject = encodeURIComponent("My New Hairstyle Transformation");
    const body = encodeURIComponent(`Check out the new style I generated: ${selectedStyle}.\n\n(Generated with HairstyleAI)`);

    window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
  }, [generatedImage, selectedStyle, sessionUserInfo, userInfo]);

  const handleBackToSuggestions = () => {
    setGeneratedImage(null);
    setSelectedStyle('');
    setError(null);
    setAppStage('ANALYSIS');
  };

  const handleReset = () => {
    handleRetake(); // Go back to upload
    setLoadingState(LoadingState.IDLE);
  };

  const handleExitSession = () => {
    setOriginalImage(null);
    setAnalysis(null);
    setGeneratedImage(null);
    setSessionUserInfo(null);
    setAppStage('DASHBOARD');
  };

  // Handle History Item Selection
  const handleHistorySelect = (item: HistoryItem) => {
    if (item.originalImage && item.generatedImage) {
      // Restore state from history item IF images exist (legacy support)
      setOriginalImage(item.originalImage);
      setGeneratedImage(item.generatedImage);
      setSelectedStyle(item.styleName);
      setAppStage('RESULT');
      setSessionUserInfo({ name: item.customerName || 'User', email: '', gender: item.gender || 'male' });
      handleNavigate('APP');
    } else {
      setError("Images for this session are not stored due to privacy policy.");
    }
  };


  const renderAppContent = () => {
    // Stage 1: Dashboard Home
    if (appStage === 'DASHBOARD') {
      return userInfo ? (
        <DashboardHome
          userInfo={userInfo}
          history={history}
          onStartNew={handleStartNewSession}
          onNavigate={handleNavigate}
        />
      ) : null;
    }

    // Stage 2: Details Form
    if (appStage === 'DETAILS') {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="w-full max-w-4xl">
            <button onClick={handleExitSession} className="mb-6 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-2 px-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back to Dashboard
            </button>
            <UserInfoForm initialData={sessionUserInfo} onSubmit={handleSessionDetailsSubmit} />
          </div>
        </div>
      );
    }

    // Stage 3: Upload
    if (appStage === 'UPLOAD') {
      return (
        <div className="w-full space-y-8 animate-fade-in pt-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-medium mb-4">
              Step 2 of 3
            </div>
            <h2 className="text-4xl font-heading font-bold text-slate-900 dark:text-white mb-4">Upload your Photo</h2>
            <p className="text-slate-600 dark:text-slate-400">Ensure good lighting and a clear view of your face.</p>
          </div>
          <div className="max-w-3xl mx-auto">
            <UploadArea onImageSelected={handleImageSelect} />
          </div>

          {/* Safety Policy Note */}
          <div className="max-w-2xl mx-auto mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-slate-700 dark:text-slate-300 text-left leading-relaxed">
              <span className="font-bold">Safety Policy:</span> The Gemini-2.5-flash-image model is strict about person safety. Please avoid uploading photos with nudity or sensitive content, as the model will refuse to generate results.
            </p>
          </div>

          <div className="text-center">
            <button onClick={() => setAppStage('DETAILS')} className="text-sm text-slate-500 hover:underline mt-4">Back to Details</button>
          </div>
        </div>
      );
    }

    // Stage 4: Confirmation
    if (appStage === 'CONFIRM' && originalImage) {
      return (
        <ImageConfirmation
          imageSrc={originalImage}
          onConfirm={handleAnalyze}
          onRetake={handleRetake}
        />
      );
    }

    // Stage 5: Analysis / Suggestions
    if (appStage === 'ANALYSIS' && originalImage && analysis && sessionUserInfo) {
      return (
        <div className="animate-fade-in">
          {/* Header Section: Flex Col on Mobile, Row on Desktop */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 pb-6 border-b border-slate-200 dark:border-neutral-800 gap-6 lg:gap-0">
            <div className="w-full lg:w-auto">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-slate-900 dark:text-white mb-2 leading-tight">Personalized Suggestions</h2>
              <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">Select a style to view details and try it on.</p>
            </div>
            <div className="flex gap-3 w-full lg:w-auto">
              <button
                onClick={handleReset}
                className="flex-1 lg:flex-none group flex items-center justify-center gap-2 text-sm px-4 py-3 rounded-xl bg-white dark:bg-neutral-800/50 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all border border-slate-200 dark:border-transparent hover:border-slate-300 dark:hover:border-neutral-700 font-bold"
              >
                New Photo
              </button>
              <button
                onClick={handleExitSession}
                className="flex-1 lg:flex-none text-sm px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all font-bold border border-transparent"
              >
                Exit
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Image Column - Sticky ONLY on Large Screens */}
            <div className="w-full lg:w-1/3 shrink-0 lg:sticky lg:top-24">
              <div className="glass-panel p-2 rounded-3xl shadow-xl relative group overflow-hidden">
                <div className="relative rounded-2xl overflow-hidden aspect-[3/4]">
                  <img src={originalImage} alt="User" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-1">Analysis</p>
                    <p className="text-2xl font-heading font-bold text-white">{analysis.faceShape} Face Shape</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Suggestions Column */}
            <div className="w-full lg:w-2/3">
              <SuggestionPanel
                analysis={analysis}
                gender={sessionUserInfo.gender}
                onSelectStyle={handleGenerateStyle}
                onCustomPrompt={handleGenerateStyle}
              />
            </div>
          </div>
        </div>
      );
    }

    // Stage 6: Result
    if (appStage === 'RESULT' && originalImage && generatedImage) {
      return (
        <ResultView
          originalImage={originalImage}
          generatedImage={generatedImage}
          selectedStyle={selectedStyle}
          onBack={handleBackToSuggestions}
          onReset={handleReset}
          onDownload={handleDownload}
          onEmailShare={handleEmailShare}
        />
      );
    }

    return null;
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-brand-500/30 flex flex-col
      ${theme === 'dark'
        ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950 text-slate-100'
        : 'bg-slate-50 text-slate-900'}`
    }>
      {/* Background ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-500/10 dark:bg-brand-500/5 rounded-full blur-[100px] animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 dark:bg-blue-600/5 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <Header
        userInfo={userInfo}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      {/* GLOBAL ERROR BANNER */}
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <main className="relative z-10 flex-grow max-w-full mx-auto w-full">
        {currentView === 'LANDING' && (
          <LandingPage onStart={() => handleNavigate('SIGNUP')} onNavigate={handleNavigate} />
        )}

        {(currentView === 'LOGIN' || currentView === 'SIGNUP') && (
          <AuthPage
            initialView={currentView}
            onSuccess={handleAuthSuccess}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'FORGOT_PASSWORD' && (
          <ForgotPasswordPage onNavigate={handleNavigate} />
        )}

        {currentView === 'ABOUT' && <AboutPage />}
        {currentView === 'CONTACT' && <ContactPage onNavigate={handleNavigate} />}
        {currentView === 'PRIVACY' && <PrivacyPage />}
        {currentView === 'TERMS' && <TermsPage />}
        {currentView === 'SUCCESS_STORIES' && <SuccessStoriesPage />}

        {currentView === 'SETTINGS' && userInfo && (
          <SettingsPage userInfo={userInfo} onNavigate={handleNavigate} />
        )}

        {currentView === 'HISTORY' && (
          <HistoryPage
            history={history}
            onNavigate={handleNavigate}
            onSelect={handleHistorySelect}
          />
        )}

        {currentView === 'FREE_FACE_SHAPE' && (
          <FreeFaceShapeTool onNavigate={handleNavigate} />
        )}

        {currentView === 'APP' && (
          <div className="max-w-6xl mx-auto px-4 pb-20 pt-28 md:pt-40">
            {renderAppContent()}
          </div>
        )}
      </main>

      <Footer onNavigate={handleNavigate} userInfo={userInfo} />

      {/* Loading Overlays */}
      {loadingState === LoadingState.ANALYZING && (
        <LoadingOverlay message="Analyzing facial features..." />
      )}
      {loadingState === LoadingState.GENERATING && (
        <LoadingOverlay message={`Generating ${selectedStyle}...`} />
      )}
      {loadingState === LoadingState.LOGGING_OUT && (
        <LoadingOverlay message="Signing out..." />
      )}
    </div>
  );
};

export default App;