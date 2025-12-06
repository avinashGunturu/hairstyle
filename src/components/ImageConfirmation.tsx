import React from 'react';

interface ImageConfirmationProps {
  imageSrc: string;
  onConfirm: () => void;
  onRetake: () => void;
}

export const ImageConfirmation: React.FC<ImageConfirmationProps> = ({ imageSrc, onConfirm, onRetake }) => {
  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in flex flex-col items-center pt-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-2">Is this photo okay?</h2>
        <p className="text-slate-500 dark:text-subtext-color">For best results, ensure your face is clearly visible and well-lit.</p>
      </div>

      <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-slate-200 dark:shadow-black/50 border border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-900 mb-8 group">
        <img src={imageSrc} alt="Uploaded" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
          <button onClick={onRetake} className="text-white underline text-sm hover:text-brand-400 transition-colors">
            Upload a different photo
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onRetake}
          className="px-6 py-3 rounded-xl border border-slate-300 dark:border-neutral-600 text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white transition-all font-medium"
        >
          Retake
        </button>
        <button
          onClick={onConfirm}
          className="px-8 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-lg shadow-brand-500/30 dark:shadow-brand-900/40 hover:shadow-brand-500/20 hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          <span>Analyze Features</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};