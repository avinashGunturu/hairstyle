import React, { useState } from 'react';

interface ResultViewProps {
  originalImage: string;
  generatedImage: string;
  selectedStyle: string;
  onBack: () => void;
  onReset: () => void;
  onDownload: () => void;
  onEmailShare: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ originalImage, generatedImage, selectedStyle, onBack, onReset, onDownload, onEmailShare }) => {
  const [sliderValue, setSliderValue] = useState(50);

  return (
    <div className="w-full flex flex-col items-center gap-4 animate-fade-in max-w-5xl mx-auto">
      
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 relative py-4 border-b border-slate-200 dark:border-neutral-800 mb-4">
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-sm text-slate-500 dark:text-subtext-color hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </div>
          <span className="font-medium">Back to suggestions</span>
        </button>

        <div className="text-center">
          <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Transformation Complete</h3>
          <p className="text-xs text-slate-500 dark:text-subtext-color">Drag the slider to compare results</p>
        </div>
        
        <div className="w-[140px] hidden md:block"></div> {/* Spacer for centering */}
      </div>

      {/* Prominent Style Name */}
      <div className="text-center pb-2 z-10">
        <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-blue-600 dark:from-brand-400 dark:to-blue-400 drop-shadow-sm mb-2">
            {selectedStyle}
        </h1>
        <div className="h-1 w-24 bg-brand-500/30 rounded-full mx-auto"></div>
      </div>

      {/* Comparison Viewer Container - Scaled to Fit Viewport */}
      <div className="relative h-[60vh] md:h-[65vh] w-auto max-w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-slate-300 dark:shadow-black/50 border border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-900 select-none group touch-none mx-auto">
        
        {/* Background: Original (Visible on the Right) */}
        <img 
          src={originalImage} 
          alt="Original" 
          className="absolute inset-0 w-full h-full object-cover" 
          draggable={false}
        />
        
        {/* Foreground: Generated (Visible on the Left) with Soft Mask */}
        <img 
          src={generatedImage} 
          alt={selectedStyle} 
          className="absolute inset-0 w-full h-full object-cover will-change-[mask-image] transform-gpu"
          style={{ 
            maskImage: `linear-gradient(to right, black ${sliderValue - 10}%, transparent ${sliderValue + 10}%)`,
            WebkitMaskImage: `linear-gradient(to right, black ${sliderValue - 10}%, transparent ${sliderValue + 10}%)`
          }}
          draggable={false}
        />
        
        {/* Overlay Labels - Simplified without style name */}
        <div className="absolute top-6 right-6 px-4 py-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 shadow-lg pointer-events-none transition-opacity duration-300 group-hover:opacity-100 opacity-60 z-10">
          <span className="text-xs font-bold text-white uppercase tracking-widest">Original</span>
        </div>
        <div className="absolute top-6 left-6 px-4 py-2 rounded-lg bg-brand-600/80 backdrop-blur-md border border-white/20 shadow-lg pointer-events-none transition-opacity duration-300 group-hover:opacity-100 opacity-80 z-10">
          <span className="text-xs font-bold text-white uppercase tracking-widest">New </span>
        </div>

        {/* Slider Handle Line */}
        <div 
          className="absolute inset-y-0 w-0.5 bg-gradient-to-b from-transparent via-white/80 to-transparent pointer-events-none z-20 will-change-[left]"
          style={{ left: `${sliderValue}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full shadow-[0_0_15px_rgba(0,0,0,0.3)] flex items-center justify-center ring-1 ring-white/50 cursor-ew-resize transition-all duration-200 group-active:scale-110 group-active:bg-white/30">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-white drop-shadow-md">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" className="rotate-90" />
            </svg>
          </div>
        </div>

        {/* Range Input */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={(e) => setSliderValue(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
          aria-label="Comparison slider"
        />
      </div>

      {/* Action Buttons */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap justify-center gap-4 w-full max-w-2xl mt-2">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-700/50 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-neutral-500 transition-all font-medium flex-1 md:flex-none whitespace-nowrap order-3 md:order-1"
        >
          Try Another Style
        </button>
        
        <div className="flex gap-3 flex-1 md:flex-none w-full md:w-auto order-1 md:order-2">
            <button
              onClick={onDownload}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold shadow-xl shadow-brand-500/40 dark:shadow-brand-900/40 hover:shadow-2xl hover:shadow-brand-500/30 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2 flex-1 whitespace-nowrap w-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75l-3-3m0 0l3-3m-3 3h7.5" />
              </svg>
              Download Result
            </button>
        </div>
        
        <button
          onClick={onReset}
          className="px-6 py-3 rounded-xl text-sm text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all order-2 md:order-3"
        >
          New Photo
        </button>
      </div>
    </div>
  );
};