
import React, { useState } from 'react';
import { AppView } from '../types';

interface ForgotPasswordPageProps {
  onNavigate: (view: AppView) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 animate-fade-in pt-28 md:pt-40 pb-12">
      <div className="w-full max-w-md">
        <div className="glass-panel rounded-3xl p-1 shadow-2xl shadow-brand-900/10 dark:shadow-black/50">
          <div className="bg-white/90 dark:bg-neutral-900/90 rounded-[20px] p-8 md:p-10 transition-colors backdrop-blur-xl">
            
            <button 
                onClick={() => onNavigate('LOGIN')}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white mb-6 transition-colors group"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:-translate-x-1 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Back to Login
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 dark:text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              <h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-2">
                Forgot Password?
              </h2>
              <p className="text-slate-500 dark:text-subtext-color text-sm">
                No worries, we'll send you reset instructions.
              </p>
            </div>

            {isSubmitted ? (
                <div className="text-center animate-fade-in">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-900/50 mb-6">
                        <p className="text-green-700 dark:text-green-300 font-medium">
                            Check your email! We've sent instructions to <span className="font-bold">{email}</span>.
                        </p>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        Didn't receive the email? Check your spam folder or try again.
                    </p>
                    <button 
                        onClick={() => setIsSubmitted(false)}
                        className="text-brand-600 dark:text-brand-400 font-bold hover:underline"
                    >
                        Click to resend
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 ml-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full bg-slate-50 dark:bg-neutral-800/50 border rounded-xl px-4 py-3.5 text-slate-900 dark:text-white outline-none transition-all placeholder-slate-400 dark:placeholder-neutral-600 text-base ${error ? 'border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-200 dark:border-neutral-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'}`}
                            placeholder="name@company.com"
                        />
                         {error && (
                            <div className="flex items-center gap-2 mt-2 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg animate-fade-in">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-500 shrink-0">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs font-medium text-red-600 dark:text-red-300 leading-tight">{error}</span>
                            </div>
                         )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/20 dark:shadow-brand-900/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                        'Reset Password'
                        )}
                    </button>
                </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
