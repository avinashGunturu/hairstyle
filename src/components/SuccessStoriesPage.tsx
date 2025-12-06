
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Story {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
  date: string;
}

// Mock data generator for Indian context
const generateMockStories = (startId: number, count: number): Story[] => {
  const names = [
    "Aarav Patel", "Diya Sharma", "Vihaan Gupta", "Ananya Singh", "Aditya Kumar", 
    "Saira Khan", "Ishaan Reddy", "Zara Malhotra", "Kabir Joshi", "Myra Kapoor",
    "Arjun Nair", "Riya Verma", "Reyansh Das", "Kavya Iyer", "Sai Krishna"
  ];
  
  const roles = [
    "Software Engineer", "Student", "Marketing Executive", "Home Maker", "Architect",
    "Content Creator", "Doctor", "Small Business Owner", "Freelancer", "HR Manager"
  ];
  
  const comments = [
    "I was skeptical at first, but the face shape detection is spot on! The layer cut suggestion changed my look completely.",
    "Finally found a style that suits my round face. My barber knew exactly what to do after seeing the photo.",
    "The Starter Pack for ₹49 is a steal. I tried 10 styles before my wedding and found the perfect one.",
    "Great tool for visualizing beards. I realized a goatee doesn't suit me before I made the mistake of shaving.",
    "Love that it suggests styles based on Indian hair textures. Very realistic results.",
    "Super easy to use. The 'Before vs After' slider helped me convince my mom to let me get a fade!",
    "Best beauty tech app I've used. No watermarks on the paid plan is great for sharing on Insta.",
    "I used this to find a professional look for my new job. The 'Classic Side Part' recommendation was perfect.",
    "My stylist was impressed with the reference photo I generated. Saved us 20 minutes of discussion.",
    "Highly recommended! I tried the 'Messy Bun' preview and it looked exactly like the real thing."
  ];

  return Array.from({ length: count }).map((_, i) => {
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    const randomComment = comments[Math.floor(Math.random() * comments.length)];
    
    return {
      id: startId + i,
      name: randomName,
      role: randomRole,
      content: randomComment,
      rating: 5,
      date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    };
  });
};

export const SuccessStoriesPage: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    setStories(generateMockStories(1, 12));
  }, []);

  // Infinite scroll handler
  const loadMore = useCallback(() => {
    if (loading) return;
    setLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      setStories(prev => [...prev, ...generateMockStories(prev.length + 1, 8)]);
      setLoading(false);
    }, 800);
  }, [loading]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loadMore]);

  return (
    <div className="animate-fade-in pt-28 md:pt-40 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold uppercase tracking-wider mb-4">
             Wall of Love
          </div>
          <h1 className="text-4xl md:text-6xl font-heading font-extrabold text-slate-900 dark:text-white mb-6">
            Stories from <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-blue-600">Across India</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Join thousands of happy users who found their signature look with HairstyleAI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {stories.map((story) => (
            <div key={story.id} className="glass-panel p-1 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl hover:shadow-brand-900/10 dark:hover:shadow-brand-500/5 group cursor-default">
               <div className="bg-white dark:bg-neutral-900 p-8 rounded-[20px] h-full flex flex-col relative transition-all duration-300 border border-transparent group-hover:border-brand-500/20 group-hover:bg-gradient-to-br from-white to-brand-50/30 dark:from-neutral-900 dark:to-brand-900/10">
                  
                  <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-1 text-yellow-400 drop-shadow-sm">
                        {[1,2,3,4,5].map(star => (
                           <svg key={star} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 transform group-hover:scale-110 transition-transform" style={{ transitionDelay: `${star * 50}ms` }}>
                              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                           </svg>
                        ))}
                     </div>
                     <span className="text-xs text-slate-400 dark:text-slate-600 font-medium group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">{story.date}</span>
                  </div>
                  
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-8 flex-grow font-medium opacity-90 group-hover:opacity-100 transition-opacity">"{story.content}"</p>
                  
                  <div className="mt-auto pt-6 border-t border-slate-100 dark:border-neutral-800 group-hover:border-brand-200 dark:group-hover:border-brand-800/30 transition-colors">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-100 to-blue-100 dark:from-brand-900 dark:to-blue-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                           {story.name.charAt(0)}
                        </div>
                        <div>
                           <p className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{story.name}</p>
                           <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{story.role}</p>
                        </div>
                        <div className="ml-auto transform group-hover:rotate-12 transition-transform duration-500">
                           <img src="https://flagcdn.com/w20/in.png" alt="India" className="w-5 opacity-50 grayscale hover:grayscale-0 transition-all" />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          ))}
        </div>

        {/* Loader / Infinite Scroll Trigger */}
        <div ref={observerTarget} className="py-16 flex justify-center">
          {loading && (
             <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border border-slate-200 dark:border-neutral-700 shadow-sm transition-all animate-fade-in">
                <div className="relative w-10 h-10">
                   {/* Background ring */}
                   <div className="absolute inset-0 border-4 border-slate-200 dark:border-neutral-700 rounded-full"></div>
                   {/* Spinning segment */}
                   <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 animate-pulse">Loading more stories...</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
