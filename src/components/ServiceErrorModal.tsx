import React from 'react';

interface ServiceErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRetry?: () => void;
    errorType?: 'api' | 'network' | 'auth' | 'general';
    message?: string;
}

export const ServiceErrorModal: React.FC<ServiceErrorModalProps> = ({
    isOpen,
    onClose,
    onRetry,
    errorType = 'general',
    message
}) => {
    if (!isOpen) return null;

    const errorConfig = {
        api: {
            icon: '🤖',
            title: 'AI Service Unavailable',
            description: 'Our AI is temporarily taking a break. This usually resolves in a few moments.',
        },
        network: {
            icon: '🌐',
            title: 'Connection Issue',
            description: 'Having trouble connecting to our servers. Please check your internet connection.',
        },
        auth: {
            icon: '🔐',
            title: 'Session Expired',
            description: 'Your session has expired. Please sign in again to continue.',
        },
        general: {
            icon: '⚠️',
            title: 'Something Went Wrong',
            description: 'An unexpected error occurred. Our team has been notified.',
        },
    };

    const config = errorConfig[errorType];

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 md:p-10 max-w-md w-full shadow-2xl border border-slate-200 dark:border-neutral-800 text-center relative overflow-hidden">
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

                {/* Icon */}
                <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-orange-500 rounded-full opacity-20 animate-pulse"></div>
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center">
                        <span className="text-4xl">{config.icon}</span>
                    </div>
                </div>

                {/* Message */}
                <h3 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-3">
                    {config.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    {config.description}
                </p>

                {message && (
                    <div className="bg-slate-100 dark:bg-neutral-800 rounded-lg p-3 mb-6 text-sm text-slate-500 dark:text-slate-400 font-mono break-all">
                        {message}
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            Try Again
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                    >
                        {onRetry ? 'Close' : 'Got It'}
                    </button>
                </div>

                {/* Reassuring footer */}
                <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
                    💪 Don't worry, your data is safe
                </p>
            </div>
        </div>
    );
};
