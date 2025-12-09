
import React, { useState, useRef, useEffect } from 'react';
import { UserInfo, AppView } from '../types';
import { getUserCredits } from '../services/creditService';
import { supabase } from '../services/supabaseClient';
import { logger } from '../utils/logger';

interface HeaderProps {
  userInfo?: UserInfo | null;
  onLogout?: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

const HeaderComponent: React.FC<HeaderProps> = ({ userInfo, onLogout, theme, toggleTheme, currentView, onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [credits, setCredits] = useState(0);
  const [planType, setPlanType] = useState('free');
  const menuRef = useRef<HTMLDivElement>(null);

  logger.log('[Header Render] UserInfo:', userInfo?.email, 'Credits:', credits);

  const isActive = (view: AppView) => currentView === view;

  // Handle scroll effect for dynamic background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch user credits and plan
  const fetchUserCredits = async () => {
    try {
      if (!userInfo?.id) {
        setCredits(0);
        setPlanType('free');
        return;
      }
      const userCredits = await getUserCredits(userInfo.id);
      logger.log('[Header] Credits fetched:', userCredits?.credits, 'Plan:', userCredits?.plan_type);
      setCredits(userCredits?.credits ?? 0);
      setPlanType(userCredits?.plan_type ?? 'free');
    } catch (err) {
      console.error('Error fetching credits:', err);
      setCredits(0);
      setPlanType('free');
    }
  };

  // Debounced credit fetching - prevents multiple rapid calls
  useEffect(() => {
    if (!userInfo?.id) {
      setCredits(0);
      setPlanType('free');
      return;
    }
    const timeout = setTimeout(fetchUserCredits, 200);
    return () => clearTimeout(timeout);
  }, [userInfo?.id]);

  // Listen for credit updates (after purchases)
  useEffect(() => {
    const handleCreditsUpdated = () => {
      logger.log('[Header] Credits updated event received');
      // Debounce the refresh as well
      setTimeout(fetchUserCredits, 100);
    };
    window.addEventListener('creditsUpdated', handleCreditsUpdated);
    return () => window.removeEventListener('creditsUpdated', handleCreditsUpdated);
  }, [userInfo?.id]);

  return (
    <header
      className={`w-full fixed top-0 z-50 transition-all duration-300 border-b py-4
        ${scrolled
          ? 'bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-slate-200/50 dark:border-white/5 shadow-sm'
          : 'bg-transparent border-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Logo Area */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onNavigate(userInfo ? 'APP' : 'LANDING')}
        >
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 bg-brand-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/20 transform transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-white tracking-tight hidden sm:block group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            Hairstyle<span className="text-brand-500 dark:text-brand-400">AI</span>
          </h1>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 mr-2">
            {['LANDING', 'ABOUT', 'CONTACT'].map((item) => (
              <button
                key={item}
                onClick={() => onNavigate(item as AppView)}
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 group ${isActive(item as AppView)
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400'
                  }`}
              >
                {item.charAt(0) + item.slice(1).toLowerCase()}
                <span className={`absolute bottom-1 left-1/2 h-0.5 bg-brand-500 rounded-full transform -translate-x-1/2 transition-all duration-300 ${isActive(item as AppView) ? 'w-4' : 'w-0 group-hover:w-4'}`}></span>
              </button>
            ))}

            {userInfo && (
              <button
                onClick={() => onNavigate('APP')}
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 group ${currentView === 'APP'
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400'
                  }`}
              >
                Dashboard
                <span className={`absolute bottom-1 left-1/2 h-0.5 bg-brand-500 rounded-full transform -translate-x-1/2 transition-all duration-300 ${currentView === 'APP' ? 'w-4' : 'w-0 group-hover:w-4'}`}></span>
              </button>
            )}
          </nav>

          {/* Status Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-brand-500/30 transition-colors cursor-default group">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 duration-1000"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 group-hover:bg-green-400 transition-colors"></span>
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-neutral-400 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">AI System Online</span>
          </div>

          {/* Credits Badge (for logged in users) */}
          {userInfo && (
            <button
              onClick={() => { onNavigate('SETTINGS'); }}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-brand-50 to-blue-50 dark:from-brand-900/20 dark:to-blue-900/20 border border-brand-200 dark:border-brand-800/30 hover:border-brand-400 transition-all cursor-pointer group"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-white">
                  <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.202.592.037.051.08.102.128.152z" />
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a.75.75 0 01.75.75v.316a3.78 3.78 0 011.653.713c.426.33.744.74.925 1.2a.75.75 0 01-1.395.55 1.35 1.35 0 00-.447-.563 2.187 2.187 0 00-.736-.363V9.3c.698.093 1.383.32 1.959.696.787.514 1.29 1.27 1.29 2.13 0 .86-.504 1.616-1.29 2.13-.576.377-1.261.603-1.96.696v.299a.75.75 0 11-1.5 0v-.3c-.697-.092-1.382-.318-1.958-.695-.482-.315-.857-.717-1.078-1.188a.75.75 0 111.359-.636c.08.173.245.376.54.569.313.205.706.353 1.138.432v-2.748a3.782 3.782 0 01-1.653-.713C6.9 9.433 6.5 8.681 6.5 7.875c0-.805.4-1.558 1.097-2.096a3.78 3.78 0 011.653-.713V4.75A.75.75 0 0110 4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className={`text-sm font-bold transition-colors ${credits < 10 ? 'text-red-600 dark:text-red-400' :
                credits < 30 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                {credits}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">credits</span>
            </button>
          )}

          <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden md:block"></div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-white/10 transition-all hover:rotate-12 active:scale-90"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>

          {userInfo ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-3 pl-2 md:pl-4 md:border-l border-slate-200 dark:border-white/10 group"
              >
                <div className="text-right hidden sm:block group-hover:opacity-80 transition-opacity">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{userInfo.name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 capitalize">{planType} Plan</p>
                </div>
                <div className="relative w-9 h-9">
                  <div className="absolute inset-0 bg-gradient-to-tr from-brand-400 to-brand-600 rounded-full blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-neutral-700 dark:to-neutral-600 border border-white/10 flex items-center justify-center text-slate-700 dark:text-white font-bold text-sm shadow-sm">
                    {userInfo.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              </button>

              {/* Dropdown Menu */}
              <div className={`absolute right-0 top-full mt-4 w-64 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-2xl shadow-black/20 p-2 origin-top-right transition-all duration-200 ${isMenuOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                <div className="px-4 py-3 border-b border-slate-100 dark:border-neutral-800 mb-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-1">Signed in as</p>
                  <p className="font-bold text-slate-900 dark:text-white truncate">{userInfo.email}</p>
                </div>

                <div className="space-y-1">


                  <div className="h-px bg-slate-100 dark:bg-neutral-800 my-2"></div>
                  <button
                    onClick={() => { onNavigate('APP'); setIsMenuOpen(false); }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-3 group"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-500 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 group-hover:text-brand-600 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                      </svg>
                    </div>
                    Dashboard
                  </button>

                  <button
                    onClick={() => { onNavigate('SETTINGS'); setIsMenuOpen(false); }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-3 group"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-500 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 group-hover:text-brand-600 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.212 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.581-.495.644-.869l.214-1.281z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    Settings
                  </button>
                </div>

                <div className="h-px bg-slate-100 dark:bg-neutral-800 my-2"></div>

                <button
                  onClick={() => { onLogout && onLogout(); setIsMenuOpen(false); }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 group"
                >
                  <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/10 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                  </div>
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-white/10">
              <button
                onClick={() => onNavigate('LOGIN')}
                className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => onNavigate('SIGNUP')}
                className="group relative px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-0.5 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative">Get Started</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// Memoize Header to prevent unnecessary re-renders
export const Header = React.memo(HeaderComponent);
