import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation, Outlet } from 'react-router-dom';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { Footer } from './components/Footer';
import { AuthPage } from './components/AuthPage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { PrivacyPage } from './components/PrivacyPage';
import { TermsPage } from './components/TermsPage';
import { SettingsPage } from './components/SettingsPage';
import { SuccessStoriesPage } from './components/SuccessStoriesPage';
import { HistoryPage } from './components/HistoryPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { FreeFaceShapeTool } from './components/FreeFaceShapeTool';
import { MainApp } from './components/MainApp';
import { AnalysisSessionPage } from './components/AnalysisSessionPage';
import { supabase } from './services/supabaseClient';
import { getUserHistory } from './services/historyService';
import { UserInfo, HistoryItem, AppView } from './types';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ErrorBanner } from './components/ErrorBanner';
import { GlobalErrorModal } from './components/GlobalErrorModal';
import { ToastProvider } from './components/Toast';
import { logger } from './utils/logger';

// --- Auth Context (defined OUTSIDE App to prevent remounts) ---
interface AuthContextType {
  userInfo: UserInfo | null;
  isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType>({ userInfo: null, isInitializing: true });

// --- Protected Route (defined OUTSIDE App to prevent remounts) ---
const ProtectedRoute: React.FC = () => {
  const { userInfo, isInitializing } = useContext(AuthContext);

  if (isInitializing) {
    return <LoadingOverlay message="Loading..." />;
  }
  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

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

  // Data State
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingState, setLoadingState] = useState<'IDLE' | 'LOGGING_OUT'>('IDLE');
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGlobalErrorModal, setShowGlobalErrorModal] = useState(false);

  // Map Routes to AppView for Header highlighting
  const getCurrentView = (): AppView => {
    const path = location.pathname;
    if (path === '/') return 'LANDING';
    if (path === '/login') return 'LOGIN';
    if (path === '/signup') return 'SIGNUP';
    if (path.startsWith('/app')) return 'APP'; // Use startsWith to handle /app/suggestions/* etc.
    if (path === '/settings') return 'SETTINGS';
    if (path === '/history') return 'HISTORY';
    if (path === '/about') return 'ABOUT';
    if (path === '/contact') return 'CONTACT';
    if (path === '/privacy') return 'PRIVACY';
    if (path === '/terms') return 'TERMS';
    if (path === '/success-stories') return 'SUCCESS_STORIES';
    if (path === '/face-shape-tool') return 'FREE_FACE_SHAPE';
    if (path === '/forgot-password') return 'FORGOT_PASSWORD';
    return 'LANDING';
  };

  const currentView = getCurrentView();

  // Listen for global API errors from anywhere in the app
  useEffect(() => {
    const handleApiError = () => {
      setShowGlobalErrorModal(true);
    };
    window.addEventListener('apiError', handleApiError);
    return () => window.removeEventListener('apiError', handleApiError);
  }, []);

  // Supabase Auth Listener - Single source of truth (clean + stable)
  useEffect(() => {
    let mounted = true;
    logger.log("[Auth] Setting up auth listener");

    // --- 1) Check OAuth errors in URL ---
    const url = new URL(window.location.href);
    const error = url.searchParams.get("error") || url.hash.includes("error");
    const errorDescription =
      url.searchParams.get("error_description") ||
      url.hash.includes("error_description");

    if (error === "access_denied") {
      setError(
        errorDescription ||
        "Access was denied. Please try again or use a different sign-in method."
      );
      window.history.replaceState({}, document.title, window.location.pathname);
      setIsInitializing(false);
      return;
    }

    // --- 2) Main Auth Listener (only this is needed) ---
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.log("[Auth Event]:", event, session ? "session exists" : "no session", session);

        // --- SIGNED OUT ---
        if (event === "SIGNED_OUT") {
          if (!mounted) return;

          setUserInfo(null);
          setHistory([]);
          setIsInitializing(false);

          // Use window.location for current path (not stale)
          const currentPath = window.location.pathname;
          if (["/app", "/settings", "/history"].some(p => currentPath.startsWith(p))) {
            navigate("/login");
          }
          return;
        }

        // --- SIGNED IN or SESSION RESTORED ---
        if (session?.user) {
          const u = session.user;
          const userData = {
            id: u?.id,
            name: u?.user_metadata?.full_name || "User",
            email: u?.email || "",
            gender: u?.user_metadata?.gender || "male",
            mobile: u?.user_metadata?.mobile,
            dob: u?.user_metadata?.dob,
          };

          logger.log("[Auth] User signed in:", userData.email);

          if (mounted) {
            setUserInfo(userData);
            setIsInitializing(false);
          }

          // REDIRECT FIRST before loading history (so user doesn't wait)
          const currentPath = window.location.pathname;
          logger.log("[Auth] Current path:", currentPath);
          if (["/login", "/signup"].includes(currentPath)) {
            logger.log("[Auth] Redirecting to /app");
            navigate("/app");
          }

          // Load History in background (don't block redirect)
          getUserHistory(u?.id).then(dbHistory => {
            if (mounted) {
              setHistory(
                dbHistory && dbHistory?.length > 0 ? dbHistory?.map((item: any) => ({
                  id: item.id,
                  timestamp: new Date(item.created_at).getTime(),
                  customerName: item.customer_name || userData.name, // Use DB customer_name, fallback to user name
                  email: item.email,
                  mobile: item.mobile,
                  dob: item.dob,
                  styleName: item.style_name,
                  faceShape: item.face_shape || "Unknown",
                  originalImage: "",
                  generatedImage: "",
                  gender: item.gender || userData.gender,
                  status: item.status,
                })) : []
              );
            }
          }).catch(err => {
            console.error("[Auth] Error fetching history:", err);
          });

          return;
        }

        // --- INITIAL LOAD BUT NO SESSION ---
        if (event === "INITIAL_SESSION" && !session) {
          if (mounted) setIsInitializing(false);
        }
      }
    );

    return () => {
      mounted = false;
      try {
        subscription.unsubscribe();
      } catch { }
    };
  }, [navigate]); // Only depend on navigate, not location


  // Handle Navigation Wrapper for legacy components
  const handleNavigate = (view: AppView) => {
    switch (view) {
      case 'LANDING': navigate('/'); break;
      case 'LOGIN': navigate('/login'); break;
      case 'SIGNUP': navigate('/signup'); break;
      case 'APP': navigate('/app'); break;
      case 'SETTINGS': navigate('/settings'); break;
      case 'HISTORY': navigate('/history'); break;
      case 'ABOUT': navigate('/about'); break;
      case 'CONTACT': navigate('/contact'); break;
      case 'PRIVACY': navigate('/privacy'); break;
      case 'TERMS': navigate('/terms'); break;
      case 'SUCCESS_STORIES': navigate('/success-stories'); break;
      case 'FREE_FACE_SHAPE': navigate('/face-shape-tool'); break;
      case 'FORGOT_PASSWORD': navigate('/forgot-password'); break;
      default: navigate('/');
    }
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    setLoadingState('LOGGING_OUT');

    // 1. Capture current preferences to preserve
    const currentTheme = localStorage.getItem('theme');

    // 2. Clear Local Storage entirely
    try {
      localStorage.clear();
      // Restore theme
      if (currentTheme) {
        localStorage.setItem('theme', currentTheme);
      }
    } catch (e) {
      console.warn('Error clearing localStorage', e);
    }

    // 3. Clear Session Storage entirely
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn('Error clearing sessionStorage', e);
    }

    // 4. Clear Cookies
    try {
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    } catch (e) {
      console.warn('Error clearing cookies', e);
    }

    // 5. Fire-and-forget signOut - DO NOT AWAIT to avoid hanging
    supabase.auth.signOut().catch((err) => {
      console.warn('Supabase signOut error (ignored):', err);
    });

    // 6. Reset State & Navigate
    setUserInfo(null);
    setHistory([]);
    setLoadingState('IDLE');
    navigate('/');
  };

  return (
    <ToastProvider>
      <AuthContext.Provider value={{ userInfo, isInitializing }}>
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

          {/* GLOBAL ERROR BANNER (for minor errors) */}
          {error && !showGlobalErrorModal && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

          {/* GLOBAL ERROR MODAL (for API failures) */}
          <GlobalErrorModal
            isOpen={showGlobalErrorModal}
            onClose={() => {
              setShowGlobalErrorModal(false);
              setError(null);
            }}
            onGoHome={() => {
              setShowGlobalErrorModal(false);
              setError(null);
              navigate('/');
            }}
          />

          <main className="relative z-10 flex-grow max-w-full mx-auto w-full">
            <Routes>
              <Route path="/" element={<LandingPage onStart={() => navigate('/signup')} onNavigate={handleNavigate} />} />
              <Route path="/login" element={<AuthPage initialView="LOGIN" onSuccess={() => navigate('/app')} onNavigate={handleNavigate} />} />
              <Route path="/signup" element={<AuthPage initialView="SIGNUP" onSuccess={() => navigate('/app')} onNavigate={handleNavigate} />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage onNavigate={handleNavigate} />} />

              <Route path="/app" element={<ProtectedRoute />}>
                <Route index element={
                  <MainApp
                    userInfo={userInfo}
                    history={history}
                    onNavigate={handleNavigate}
                    setHistory={setHistory}
                  />
                } />
                {/* Note the relative path here, since it is nested under /app */}
                <Route
                  path="suggestions/:sessionId"
                  element={
                    <AnalysisSessionPage userInfo={userInfo} setHistory={setHistory} onNavigate={handleNavigate} />
                  }
                />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route path="/settings" element={
                  <SettingsPage userInfo={userInfo!} onNavigate={handleNavigate} />
                } />

                <Route path="/history" element={
                  <HistoryPage
                    userInfo={userInfo}
                    onNavigate={handleNavigate}
                    onSelect={(item) => {
                      // Handle history selection (might need to pass state to MainApp via location state or context)
                      // For now, redirect to app
                      navigate('/app');
                    }}
                  />
                } />
              </Route>

              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage onNavigate={handleNavigate} />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/success-stories" element={<SuccessStoriesPage />} />
              <Route path="/face-shape-tool" element={<FreeFaceShapeTool onNavigate={handleNavigate} />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer onNavigate={handleNavigate} userInfo={userInfo} />

          {/* Loading Overlays */}
          {loadingState === 'LOGGING_OUT' && (
            <LoadingOverlay message="Signing out..." />
          )}
        </div>
      </AuthContext.Provider>
    </ToastProvider>
  );
};

export default App;