import React from 'react';

interface GlobalErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGoHome: () => void;
}

export const GlobalErrorModal: React.FC<GlobalErrorModalProps> = ({ isOpen, onClose, onGoHome }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 md:p-10 max-w-md w-full shadow-2xl border border-slate-200 dark:border-neutral-800 text-center relative overflow-hidden">
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-brand-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

                {/* Icon */}
                <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-400 to-blue-500 rounded-full opacity-20 animate-pulse"></div>
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-brand-50 to-blue-50 dark:from-brand-900/30 dark:to-blue-900/30 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-brand-600 dark:text-brand-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                        </svg>
                    </div>
                </div>

                {/* Message */}
                <h3 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-3">
                    We Hit a Small Bump! 🌟
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                    No worries at all! Sometimes our AI needs a quick breather.
                    Your perfect hairstyle is just around the corner — let's give it another go!
                </p>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={onGoHome}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                        </svg>
                        Back to Home
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                    >
                        Let's Try Again ✨
                    </button>
                </div>

                {/* Encouraging footer */}
                <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
                    💇 Your stunning new look awaits
                </p>
            </div>
        </div>
    );
};
