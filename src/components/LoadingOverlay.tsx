
import React, { useState, useEffect } from 'react';

interface LoadingOverlayProps {
  message: string;
}

const loadingMessages = [
  "Analyzing facial geometry...",
  "Calculating optimal proportions...",
  "Adjusting lighting & shadows...",
  "Applying style textures...",
  "Refining final details..."
];

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000); // Change message every 2 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="relative w-24 h-24 mb-8">
        {/* Background ring - subtle */}
        <div className="absolute inset-0 border-4 border-slate-100 dark:border-neutral-800 rounded-full"></div>
        
        {/* Spinning outer ring - brand color */}
        <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
        
        {/* Inner Ring - reverse spin for complexity */}
        <div className="absolute inset-2 border-4 border-blue-500/20 dark:border-blue-400/20 rounded-full border-b-transparent animate-[spin_2s_linear_infinite_reverse]"></div>

        {/* Center Icon: Spinning Scissors */}
        <div className="absolute inset-0 flex items-center justify-center">
           <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-8 h-8 text-brand-600 dark:text-brand-400 animate-[spin_3s_linear_infinite]"
          >
            <circle cx="6" cy="6" r="3"></circle>
            <circle cx="6" cy="18" r="3"></circle>
            <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
            <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
            <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
          </svg>
        </div>
      </div>
      
      <h3 className="text-3xl font-heading font-bold text-slate-900 dark:text-white text-center animate-pulse drop-shadow-sm mb-4">
        {message}
      </h3>
      
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 shadow-sm transition-all duration-300">
         <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
         </span>
         <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 min-w-[180px] text-center">
            {loadingMessages[msgIndex]}
         </p>
      </div>
    </div>
  );
};
