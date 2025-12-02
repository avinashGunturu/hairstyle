
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaceAnalysis, HairstyleSuggestion, Gender } from '../types';
import { generateHairstylePreview } from '../services/geminiService';

interface SuggestionPanelProps {
  analysis: FaceAnalysis;
  gender: Gender;
  onSelectStyle: (style: string) => void;
  onCustomPrompt: (prompt: string) => void;
}

const MALE_STYLES = [
  "Pompadour", "Undercut", "Quiff", "Buzz Cut", "Crew Cut", 
  "High Fade", "Side Part", "Slick Back", "Man Bun", "Faux Hawk",
  "Caesar Cut", "French Crop", "Textured Fringe", "Ivy League", "Comb Over",
  "Modern Mullet", "Dreadlocks", "Short Afro", "Top Knot", "Spiky Texture"
];

const FEMALE_STYLES = [
  "Classic Bob", "Pixie Cut", "Long Bob (Lob)", "Beach Waves", "Long Layers",
  "Curtain Bangs", "Shag Cut", "Blunt Cut", "Asymmetrical Bob", "Wolf Cut",
  "French Bob", "Feathered Layers", "Sleek Straight", "Curly Shag", "Box Braids",
  "High Ponytail", "Messy Bun", "Half-Up Half-Down", "Side Swept Bangs", "Boyfriend Bob"
];

interface ExtendedSuggestion extends HairstyleSuggestion {
  previewUrl?: string;
  isCustom?: boolean;
}

// --- Modal Component ---
const SuggestionModal: React.FC<{
  suggestion: ExtendedSuggestion | null;
  gender: Gender;
  isOpen: boolean;
  onClose: () => void;
  onSelect: () => void;
}> = ({ suggestion, gender, isOpen, onClose, onSelect }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && suggestion) {
      // Reset state
      if (suggestion.previewUrl) {
        setPreviewUrl(suggestion.previewUrl);
        setLoading(false);
      } else {
        // If no preview URL passed (e.g. from Top 20), load it now
        setPreviewUrl(null);
        setLoading(true);
        generateHairstylePreview(suggestion.name, suggestion.description, gender)
          .then((url) => {
            setPreviewUrl(url);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      }
    }
  }, [isOpen, suggestion, gender]);

  if (!isOpen || !suggestion) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/95 backdrop-blur-md transition-opacity duration-300 animate-fade-in" 
        onClick={onClose}
      ></div>
      
      {/* Modal Content - Full Width & Height Optimized */}
      <div className="relative z-10 w-full h-full md:w-[95vw] md:h-[90vh] md:max-w-7xl bg-white dark:bg-neutral-900 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row animate-[fadeIn_0.3s_ease-out] border-none md:border border-white/10 ring-1 ring-black/5">
        
        {/* Close Button - Floating */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-all hover:rotate-90 hover:scale-110 shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 
           Left/Top Side: Visual Preview 
           Mobile: Fixed height (35vh) at top
           Desktop: Full height (100%) on left
        */}
        <div className="w-full h-[35vh] lg:w-1/2 lg:h-full relative bg-neutral-100 dark:bg-black shrink-0">
          {loading ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 bg-neutral-900">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-[6px] border-neutral-800 rounded-full"></div>
                    <div className="absolute inset-0 border-[6px] border-brand-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div className="text-center z-10">
                    <p className="text-xl font-bold text-white mb-2 animate-pulse">Generating preview...</p>
                    <div className="flex items-center gap-2 justify-center text-brand-400/80 text-sm font-medium bg-brand-900/20 px-4 py-1.5 rounded-full border border-brand-500/10">
                        <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping"></span>
                        Generating High-Definition Preview
                    </div>
                </div>
                {/* Subtle Grid Background */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
             </div>
          ) : previewUrl ? (
             <img src={previewUrl} alt={suggestion.name} className="w-full h-full object-cover" />
          ) : (
             <div className="absolute inset-0 flex items-center justify-center bg-neutral-200 dark:bg-neutral-800">
               <span className="text-slate-400">Preview unavailable</span>
             </div>
          )}
          
          {/* Overlay Text Gradient - Desktop/Tablet Only (to save space on mobile) */}
          <div className="absolute bottom-0 left-0 right-0 pt-24 pb-8 px-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent hidden lg:block">
             <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-2 drop-shadow-lg">{suggestion.name}</h2>
             <p className="text-lg text-slate-200 line-clamp-2 font-light">{suggestion.description}</p>
          </div>
        </div>

        {/* 
           Right/Bottom Side: Details & Actions 
           Mobile: Takes remaining height, contains scrollable content + fixed footer
        */}
        <div className="w-full flex-1 min-h-0 lg:w-1/2 lg:h-full flex flex-col bg-white dark:bg-neutral-900 relative">
           
           {/* Mobile Header (Name displayed here since it's hidden on image) */}
           <div className="lg:hidden px-6 pt-6 pb-2 shrink-0 bg-white dark:bg-neutral-900">
              <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-1">{suggestion.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{suggestion.description}</p>
           </div>

           {/* Scrollable Content Area */}
           <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
              <div className="space-y-8 max-w-2xl mx-auto pb-4">
                {/* Reason */}
                <div className="animate-[fadeIn_0.5s_ease-out_0.1s] fill-mode-backwards">
                   <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Analysis Match</h3>
                   </div>
                   <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300 leading-relaxed pl-3 border-l-2 border-brand-500/50">
                     {suggestion.reason}
                   </p>
                </div>

                {/* Advice */}
                <div className="animate-[fadeIn_0.5s_ease-out_0.2s] fill-mode-backwards">
                   <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                         {gender === 'male' ? 'Beard & Facial Hair' : 'Eyebrow & Lash Styling'}
                      </h3>
                   </div>
                   <div className="bg-slate-50 dark:bg-neutral-800 p-6 rounded-2xl border border-slate-100 dark:border-neutral-700 shadow-sm">
                     <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                       {suggestion.stylingAdvice}
                     </p>
                   </div>
                </div>
              </div>
           </div>

           {/* Actions - Sticky Footer (Pinned to bottom of right container) */}
           <div className="shrink-0 p-4 md:p-8 border-t border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 z-20 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-none">
              <button 
                onClick={onSelect}
                className="w-full py-4 md:py-5 bg-slate-900 dark:bg-white hover:bg-brand-600 dark:hover:bg-brand-400 text-white dark:text-slate-900 font-bold text-xl rounded-2xl shadow-xl shadow-brand-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3"
              >
                 <span>Try this Hairstyle</span>
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                 </svg>
              </button>
              <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" /></svg>
                 Generates an AI preview on your uploaded photo
              </p>
           </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// --- Card Component ---
const SuggestionCard: React.FC<{
  suggestion: ExtendedSuggestion;
  onClick: () => void;
}> = ({ suggestion, onClick }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Lazy load the visual preview for the card background
  useEffect(() => {
     if (!previewUrl && !loading) {
        setLoading(true);
        generateHairstylePreview(suggestion.name, "Hairstyle concept", 'male')
           .then(url => {
             setPreviewUrl(url);
             setLoading(false);
           })
           .catch(() => setLoading(false));
     }
  }, [suggestion.name]);

  return (
    <div 
      onClick={onClick}
      className="group relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-brand-500/50"
    >
      {/* Image / Placeholder with Zoom Effect */}
      <div className="w-full h-full relative overflow-hidden">
        {loading ? (
           <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-neutral-800">
             <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
           </div>
        ) : previewUrl ? (
           <img 
            src={previewUrl} 
            alt={suggestion.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
           />
        ) : (
           <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center">
              <span className="text-4xl opacity-20">✨</span>
           </div>
        )}
      </div>

      {/* Text Overlay - Always visible at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10">
         <h3 className="text-white font-bold text-xl leading-tight">{suggestion.name}</h3>
         <p className="text-slate-300 text-sm mt-1 line-clamp-1 opacity-80 group-hover:opacity-100 transition-opacity">{suggestion.description}</p>
      </div>

      {/* Full Cover Hover Overlay with CTA */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
         <button className="px-6 py-3 bg-white text-slate-900 font-bold rounded-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-lg hover:bg-brand-50 hover:text-brand-600">
            View Details
         </button>
      </div>
    </div>
  );
};


export const SuggestionPanel: React.FC<SuggestionPanelProps> = ({ analysis, gender, onSelectStyle, onCustomPrompt }) => {
  const [selectedModalSuggestion, setSelectedModalSuggestion] = useState<ExtendedSuggestion | null>(null);
  const [customText, setCustomText] = useState('');
  
  const suggestions: ExtendedSuggestion[] = analysis.suggestions.map(s => ({ ...s, isCustom: false }));
  const trendingStyles = gender === 'male' ? MALE_STYLES : FEMALE_STYLES;

  const handleCardClick = (suggestion: ExtendedSuggestion) => {
    setSelectedModalSuggestion(suggestion);
  };

  const handleTop20Click = (styleName: string) => {
     const pseudoSuggestion: ExtendedSuggestion = {
        name: styleName,
        description: `Trending ${gender} hairstyle.`,
        reason: "Selected from Top 20 Trending list.",
        stylingAdvice: "Consult your stylist for this popular cut.",
        isCustom: false
     };
     setSelectedModalSuggestion(pseudoSuggestion);
  };

  return (
    <div className="space-y-12 animate-fade-in pb-24">
      
      {/* Main Suggestions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {suggestions.map((suggestion, idx) => (
           <SuggestionCard 
             key={idx} 
             suggestion={suggestion} 
             onClick={() => handleCardClick(suggestion)} 
           />
        ))}
        
        {/* "Design Your Own" Card */}
        <div className="aspect-[3/4] rounded-3xl border-2 border-dashed border-slate-300 dark:border-neutral-700 bg-slate-50/50 dark:bg-neutral-900/50 flex flex-col items-center justify-center p-6 text-center hover:bg-brand-50 dark:hover:bg-brand-900/10 hover:border-brand-400 transition-colors group">
           <div className="w-16 h-16 rounded-full bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-brand-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
           </div>
           <h3 className="font-bold text-slate-900 dark:text-white mb-2">Custom Style</h3>
           <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Have a specific idea? Describe it below.</p>
           <div className="w-full relative">
             <input 
                type="text" 
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="e.g. Pink Mohawk" 
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-700 focus:border-brand-500 outline-none text-sm shadow-sm"
                onKeyDown={(e) => {
                    if(e.key === 'Enter' && customText) onCustomPrompt(customText);
                }}
             />
             <button 
                onClick={() => customText && onCustomPrompt(customText)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
             >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
             </button>
           </div>
        </div>
      </div>

      {/* Top 20 Section */}
      <div className="border-t border-slate-200 dark:border-neutral-800 pt-12">
        <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-grow bg-gradient-to-r from-transparent via-slate-200 dark:via-neutral-700 to-transparent"></div>
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white text-center">
                Top 20 Trending {gender === 'male' ? 'Men\'s' : 'Women\'s'} Styles
            </h2>
            <div className="h-px flex-grow bg-gradient-to-r from-transparent via-slate-200 dark:via-neutral-700 to-transparent"></div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3">
            {trendingStyles.map((style, i) => (
                <button
                    key={i}
                    onClick={() => handleTop20Click(style)}
                    className="px-5 py-2.5 rounded-full bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all active:scale-95"
                >
                    {style}
                </button>
            ))}
        </div>
      </div>

      {/* Details Modal via Portal */}
      <SuggestionModal 
        isOpen={!!selectedModalSuggestion}
        suggestion={selectedModalSuggestion}
        gender={gender}
        onClose={() => setSelectedModalSuggestion(null)}
        onSelect={() => {
            if(selectedModalSuggestion) onSelectStyle(selectedModalSuggestion.name);
            setSelectedModalSuggestion(null);
        }}
      />
    </div>
  );
};
