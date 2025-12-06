import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
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
import { supabase } from './services/supabaseClient';
import { getUserHistory } from './services/historyService';
import { UserInfo, HistoryItem, AppView } from './types';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ErrorBanner } from './components/ErrorBanner';

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

  // Map Routes to AppView for Header highlighting
  const getCurrentView = (): AppView => {
    const path = location.pathname;
    if (path === '/') return 'LANDING';
    if (path === '/login') return 'LOGIN';
    if (path === '/signup') return 'SIGNUP';
    if (path === '/app') return 'APP';
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

  // Supabase Auth Listener - Single source of truth
  useEffect(() => {
    let mounted = true;
    console.log('[Auth] Hydrating session and setting up listener');

    let authSubscription: any = null;

    const hydrate = async () => {
      try {
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
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('[Auth] event', event);
          if (event === 'SIGNED_OUT') {
            setUserInfo(null);
            setHistory([]);
            // Redirect if on protected route
            console.log('[Auth] location.pathname', location.pathname);
            if (['/app', '/settings', '/history', '/'].includes(location.pathname)) {
              navigate('/login');
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

            // Redirect logic for auth events
            if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
              // If on login/signup, go to app
              if (['/login', '/signup'].includes(location.pathname)) {
                navigate('/app');
              }
            }
          }
        });
        authSubscription = subscription;
      } catch (err) {
        console.error('[Auth] hydrate failure', err);
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };

    hydrate();

    return () => {
      mounted = false;
      if (authSubscription) {
        try {
          authSubscription.unsubscribe();
        } catch (err) {
          console.warn('[Auth] subscription cleanup failed', err);
        }
      }
    };
  }, [navigate, location.pathname]);

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

  const handleLogout = async () => {
    setLoadingState('LOGGING_OUT');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
    } catch (err) {
      console.error('Unexpected signOut failure', err);
    } finally {
      setUserInfo(null);
      setHistory([]);
      try { localStorage.removeItem('supabase.auth.token'); } catch (e) { }
      setLoadingState('IDLE');
      navigate('/');
    }
  };

  // Protected Route Wrapper
  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    if (isInitializing) {
      return <LoadingOverlay message="Loading..." />;
    }
    if (!userInfo) {
      return <Navigate to="/login" replace />;
    }
    return children;
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
        <Routes>
          <Route path="/" element={<LandingPage onStart={() => navigate('/signup')} onNavigate={handleNavigate} />} />
          <Route path="/login" element={<AuthPage initialView="LOGIN" onSuccess={() => navigate('/app')} onNavigate={handleNavigate} />} />
          <Route path="/signup" element={<AuthPage initialView="SIGNUP" onSuccess={() => navigate('/app')} onNavigate={handleNavigate} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage onNavigate={handleNavigate} />} />

          <Route path="/app/*" element={
            <ProtectedRoute>
              <MainApp
                userInfo={userInfo}
                history={history}
                onNavigate={handleNavigate}
                setHistory={setHistory}
              />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage userInfo={userInfo!} onNavigate={handleNavigate} />
            </ProtectedRoute>
          } />

          <Route path="/history" element={
            <ProtectedRoute>
              <HistoryPage
                history={history}
                onNavigate={handleNavigate}
                onSelect={(item) => {
                  // Handle history selection (might need to pass state to MainApp via location state or context)
                  // For now, redirect to app
                  navigate('/app');
                }}
              />
            </ProtectedRoute>
          } />

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
  );
};

export default App;