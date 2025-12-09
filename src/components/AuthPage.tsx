
import React, { useState, useEffect } from 'react';
import { AppView } from '../types';
import { supabase } from '../services/supabaseClient';

interface AuthPageProps {
  initialView: 'LOGIN' | 'SIGNUP';
  onSuccess: () => void;
  onNavigate: (view: AppView) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialView, onSuccess, onNavigate }) => {
  const [isLogin, setIsLogin] = useState(initialView === 'LOGIN');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');

  // Visibility State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // UI State
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    setIsLogin(initialView === 'LOGIN');
    setErrors({}); // Clear errors on view switch
    setAuthError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowConfirmation(false);
  }, [initialView]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email Validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password Validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!isLogin) {
      // Signup specific validations
      if (!name.trim()) {
        newErrors.name = "Full name is required";
      }

      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Supabase Login - auth listener in App.tsx will handle redirect
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Don't call onSuccess() - App.tsx auth listener will redirect to /app
        // Just stop loading, the onAuthStateChange will handle navigation
      } else {
        // Supabase Signup
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              mobile: mobile,
            },
          },
        });
        if (error) throw error;
        // Show confirmation modal for email verification
        setShowConfirmation(true);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setAuthError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setAuthError(err.message || "Failed to initiate Google Login");
    }
  };

  const toggleMode = () => {
    const newMode = !isLogin;
    setIsLogin(newMode);
    setErrors({});
    setAuthError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowConfirmation(false);
    // Reset fields that aren't shared
    if (newMode) { // Switching to Login
      setName('');
      setMobile('');
      setConfirmPassword('');
    }
    onNavigate(newMode ? 'LOGIN' : 'SIGNUP');
  };

  const getInputClass = (fieldName: string) => `
    w-full bg-slate-50 dark:bg-neutral-800/50 border rounded-xl px-4 py-3.5 text-slate-900 dark:text-white outline-none 
    transition-all placeholder-slate-400 dark:placeholder-neutral-600 text-base
    ${errors[fieldName]
      ? 'border-red-500 focus:ring-4 focus:ring-red-500/10'
      : 'border-slate-200 dark:border-neutral-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
    }
  `;

  const labelClass = "block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 ml-1";

  const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex items-center gap-2 mt-2 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg animate-fade-in">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-500 shrink-0">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
      <span className="text-xs font-medium text-red-600 dark:text-red-300 leading-tight">{message}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 animate-fade-in pt-28 md:pt-40 pb-12">
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-neutral-800 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-green-600 dark:text-green-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Check your inbox</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              We've sent a confirmation link to <span className="font-semibold text-slate-900 dark:text-white">{email}</span>. Please verify your email to continue.
            </p>
            <button
              onClick={() => {
                setShowConfirmation(false);
                toggleMode(); // Switch to login
              }}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3.5 rounded-xl transition-all"
            >
              Back to Login
            </button>
          </div>
        </div>
      )}

      <div className={`w-full transition-all duration-300 ${isLogin ? 'max-w-md' : 'max-w-md md:max-w-2xl'}`}>
        <div className="glass-panel rounded-3xl p-1 shadow-2xl shadow-brand-900/10 dark:shadow-black/50">
          <div className="bg-white/90 dark:bg-neutral-900/90 rounded-[20px] p-8 md:p-10 transition-colors backdrop-blur-xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-slate-500 dark:text-subtext-color text-sm">
                {isLogin ? 'Enter your credentials to access your account.' : 'Get started with your free transformation journey.'}
              </p>
            </div>

            {/* Social Auth Buttons */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl py-3.5 text-slate-700 dark:text-white font-medium hover:bg-slate-50 dark:hover:bg-neutral-750 transition-colors mb-6 shadow-sm hover:shadow-md"
              onClick={handleGoogleLogin}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-neutral-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-neutral-900 px-4 text-slate-500 dark:text-neutral-500">Or continue with email</span>
              </div>
            </div>

            {authError && <ErrorMessage message={authError} />}

            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              {isLogin ? (
                // Login Form
                <div className="space-y-5">
                  <div>
                    <label className={labelClass}>Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={getInputClass('email')}
                      placeholder="name@company.com"
                    />
                    {errors.email && <ErrorMessage message={errors.email} />}
                  </div>
                  <div>
                    <label className={labelClass}>Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={getInputClass('password')}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors p-1"
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.password && <ErrorMessage message={errors.password} />}

                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={() => onNavigate('FORGOT_PASSWORD')}
                        className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 hover:underline transition-all"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Signup Form
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={getInputClass('name')}
                      placeholder="e.g. John Doe"
                    />
                    {errors.name && <ErrorMessage message={errors.name} />}
                  </div>

                  <div>
                    <label className={labelClass}>Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={getInputClass('email')}
                      placeholder="name@company.com"
                    />
                    {errors.email && <ErrorMessage message={errors.email} />}
                  </div>

                  <div>
                    <label className={labelClass}>Mobile Number</label>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className={getInputClass('mobile')}
                      placeholder="e.g. 98765 43210"
                    />
                    {errors.mobile && <ErrorMessage message={errors.mobile} />}
                  </div>

                  <div>
                    <label className={labelClass}>Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={getInputClass('password')}
                        placeholder="Min. 8 chars"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors p-1"
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.password && <ErrorMessage message={errors.password} />}
                  </div>

                  <div>
                    <label className={labelClass}>Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={getInputClass('confirmPassword')}
                        placeholder="Re-enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors p-1"
                      >
                        {showConfirmPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && <ErrorMessage message={errors.confirmPassword} />}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/20 dark:shadow-brand-900/20 transition-all transform hover:-translate-y-0.5 mt-4 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <button
                  onClick={toggleMode}
                  className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  {isLogin ? 'Sign up' : 'Log in'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
