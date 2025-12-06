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
    <div className="w-full flex flex-col items-center gap-6 animate-fade-in mt-8">

      {/* Header Section - Full width like main header */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 border-b border-slate-200 dark:border-neutral-800">
          <button
            onClick={onBack}
            className="group flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-all shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </div>
            <span className="font-medium text-base">Back to suggestions</span>
          </button>

          <div className="text-center">
            <h3 className="text-xl md:text-2xl font-heading font-bold text-slate-900 dark:text-white">Transformation Complete</h3>
            {/* <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Drag the slider to compare results</p> */}
          </div>

          {/* <div className="w-[180px] hidden md:block"></div> Spacer for centering */}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-5xl mx-auto px-4 flex flex-col items-center gap-6">

        {/* Prominent Style Name */}
        <div className="text-center z-10">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-blue-600 dark:from-brand-400 dark:to-blue-400 drop-shadow-sm mb-3">
            {selectedStyle}
          </h1>
          <div className="h-1 w-24 bg-brand-500/30 rounded-full mx-auto"></div>
        </div>

        {/* Comparison Viewer Container */}
        <div className="relative h-[55vh] sm:h-[60vh] md:h-[65vh] w-auto max-w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-slate-300/50 dark:shadow-black/50 border border-slate-200 dark:border-neutral-700 bg-slate-100 dark:bg-neutral-900 select-none group touch-none mx-auto">

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

          {/* Overlay Labels - Moved to BOTTOM so they don't cover hairstyle */}
          <div className="absolute bottom-6 right-6 px-4 py-2 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 shadow-lg pointer-events-none z-10">
            <span className="text-xs font-bold text-white uppercase tracking-widest">Original</span>
          </div>
          <div className="absolute bottom-6 left-6 px-4 py-2 rounded-lg bg-brand-600/90 backdrop-blur-md border border-white/20 shadow-lg pointer-events-none z-10">
            <span className="text-xs font-bold text-white uppercase tracking-widest">New</span>
          </div>

          {/* Slider Handle Line */}
          <div
            className="absolute inset-y-0 w-0.5 bg-gradient-to-b from-transparent via-white/90 to-transparent pointer-events-none z-20 will-change-[left]"
            style={{ left: `${sliderValue}%` }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/30 backdrop-blur-md rounded-full shadow-[0_0_20px_rgba(0,0,0,0.3)] flex items-center justify-center ring-2 ring-white/60 cursor-ew-resize transition-all duration-200 group-active:scale-110 group-active:bg-white/40">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white drop-shadow-lg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5M15.75 4.5l-7.5 7.5 7.5 7.5" />
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
        <div className="glass-panel p-5 rounded-2xl flex flex-wrap justify-center gap-4 w-full max-w-2xl">
          <button
            onClick={onBack}
            className="px-6 py-3.5 rounded-xl border border-slate-300 dark:border-neutral-600 text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-700/50 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-neutral-500 transition-all font-medium flex-1 md:flex-none whitespace-nowrap order-3 md:order-1"
          >
            Try Another Style
          </button>

          <div className="flex gap-3 flex-1 md:flex-none w-full md:w-auto order-1 md:order-2">
            <button
              onClick={onDownload}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold shadow-xl shadow-brand-500/40 dark:shadow-brand-900/40 hover:shadow-2xl hover:shadow-brand-500/30 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2.5 flex-1 whitespace-nowrap w-full"
            >
              {/* Fixed Download Icon - Arrow pointing DOWN */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download Result
            </button>
          </div>

          <button
            onClick={onReset}
            className="px-6 py-3.5 rounded-xl text-sm text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all order-2 md:order-3 font-medium"
          >
            New Photo
          </button>
        </div>
      </div>
    </div>
  );
};