
import React from 'react';

export const AboutPage: React.FC = () => {
  return (
    <div className="animate-fade-in pt-28 md:pt-40 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 mb-24 text-center z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[120px] -z-10"></div>
        
        <span className="inline-block px-4 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-sm font-bold uppercase tracking-wider mb-6 border border-brand-100 dark:border-brand-500/20">
          Our Story
        </span>
        <h1 className="text-5xl md:text-7xl font-heading font-extrabold text-slate-900 dark:text-white mb-8 leading-tight">
          Redefining Personal <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-blue-600">Style with AI</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed font-light">
          We combine state-of-the-art generative AI with professional styling principles to eliminate "bad haircut" anxiety forever.
        </p>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 mb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
                { label: "Active Users", value: "50K+", icon: "👥" },
                { label: "Styles Generated", value: "1M+", icon: "✨" },
                { label: "Hairstyle Database", value: "500+", icon: "💇‍♂️" },
                { label: "Accuracy Rate", value: "98%", icon: "🎯" }
            ].map((stat, i) => (
                <div key={i} className="glass-panel p-6 rounded-2xl text-center hover:scale-105 transition-transform duration-300">
                     <div className="text-4xl mb-2">{stat.icon}</div>
                     <div className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-1">{stat.value}</div>
                     <div className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold">{stat.label}</div>
                </div>
            ))}
        </div>
      </section>

      {/* Mission & Vision Split */}
      <section className="bg-slate-50 dark:bg-neutral-900/50 py-24 border-y border-slate-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-16">
                <div className="w-full lg:w-1/2 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-brand-500 to-blue-600 rounded-3xl rotate-3 opacity-20 blur-lg transform scale-105"></div>
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                        <img 
                            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                            alt="Team brainstorming" 
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                        />
                    </div>
                </div>
                <div className="w-full lg:w-1/2 space-y-8">
                    <div>
                        <h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-4">The Problem</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                            For decades, getting a haircut was a gamble. You'd show a picture of a celebrity to a stylist, only to realize too late that their face shape, hair texture, and volume were completely different from yours.
                        </p>
                    </div>
                    <div>
                        <h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-4">Our Solution</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                            HairstyleAI changes the game. By mapping 400+ facial landmarks, we understand your geometry first. Then, using Gemini 2.5 Flash Image models, we generate hyper-realistic previews that respect your actual features.
                        </p>
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                        <div className="flex -space-x-4">
                            {[1,2,3,4].map(i => (
                                <div key={i} className="w-12 h-12 rounded-full border-4 border-white dark:border-neutral-900 bg-slate-200 overflow-hidden">
                                    <img src={`https://i.pravatar.cc/150?img=${i + 10}`} alt="User" />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col justify-center">
                             <span className="font-bold text-slate-900 dark:text-white">Join 50,000+ others</span>
                             <span className="text-sm text-slate-500 dark:text-slate-400">Finding their perfect look</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
           <h2 className="text-4xl font-heading font-bold text-slate-900 dark:text-white mb-4">Our DNA</h2>
           <p className="text-slate-600 dark:text-slate-400">The principles that guide every feature we build.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { 
                 title: "Innovation First", 
                 desc: "We don't just use AI; we push it to its limits to solve real human problems.",
                 color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
                 icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
             },
             { 
                 title: "Radical Inclusivity", 
                 desc: "Beauty technology has historically ignored diverse features. We train our models on everyone.",
                 color: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
                 icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
             },
             { 
                 title: "Privacy by Design", 
                 desc: "Your face is your identity. We treat it with the highest level of security and ephemeral processing.",
                 color: "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
                 icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
             }
           ].map((val, i) => (
             <div key={i} className="group p-8 rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
               <div className={`w-12 h-12 rounded-2xl ${val.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {val.icon}
               </div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{val.title}</h3>
               <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{val.desc}</p>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
};
