
import React, { useState, useEffect } from 'react';
import { UserInfo, HistoryItem, AppView } from '../types';
import { getUserCredits } from '../services/creditService';

interface DashboardHomeProps {
  userInfo: UserInfo;
  history: HistoryItem[];
  onStartNew: () => void;
  onNavigate: (view: AppView) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ userInfo, history, onStartNew, onNavigate }) => {
  const recentItems = history.slice(0, 5);
  const [credits, setCredits] = useState<number>(0);
  const [planType, setPlanType] = useState<string>('free');
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);

  // Fetch credits on mount
  useEffect(() => {
    const fetchCredits = async () => {
      if (userInfo?.id) {
        try {
          const userCredits = await getUserCredits(userInfo.id);
          setCredits(userCredits?.credits ?? 0);
          setPlanType(userCredits?.plan_type ?? 'free');
        } catch (err) {
          console.error('Error fetching credits:', err);
        } finally {
          setIsLoadingCredits(false);
        }
      }
    };
    const timeout = setTimeout(fetchCredits, 100);
    return () => clearTimeout(timeout);
  }, [userInfo?.id]);

  // Listen for credit updates
  useEffect(() => {
    const handleCreditsUpdated = async () => {
      if (userInfo?.id) {
        const userCredits = await getUserCredits(userInfo.id);
        setCredits(userCredits?.credits ?? 0);
        setPlanType(userCredits?.plan_type ?? 'free');
      }
    };
    window.addEventListener('creditsUpdated', handleCreditsUpdated);
    return () => window.removeEventListener('creditsUpdated', handleCreditsUpdated);
  }, [userInfo?.id]);

  return (
    <div className="w-full max-w-6xl mx-auto my-16 animate-fade-in pt-8">
      {/* Welcome Banner */}
      <div className="mb-12 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-slate-900 dark:text-white mb-4">
          Welcome back, <span className="text-brand-600 dark:text-brand-400">{userInfo.name.split(' ')[0]}</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
          Ready to explore a new look today? Your AI stylist is ready.
        </p>
      </div>

      {/* Main Actions Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        {/* Start Card */}
        <div className="lg:col-span-2">
          <div className="glass-panel h-full rounded-3xl p-1 relative overflow-hidden group cursor-pointer" onClick={onStartNew}>
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="bg-white dark:bg-neutral-900 h-full rounded-[20px] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10 transition-transform duration-500">
              <div className="space-y-6 flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-bold uppercase tracking-wider">
                  New Session
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Start a New Transformation</h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Upload a new photo to get personalized hairstyle suggestions tailored to your face shape.
                </p>
                <button className="px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2 group-hover:translate-x-2">
                  <span>Begin Styling</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
              {/* Decorative Element */}
              <div className="w-40 h-40 relative hidden md:block">
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-400 to-blue-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                <div className="absolute inset-0 border-4 border-dashed border-slate-200 dark:border-neutral-700 rounded-full flex items-center justify-center group-hover:border-brand-500/50 transition-colors duration-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-slate-300 dark:text-neutral-600 group-hover:text-brand-500 transition-colors duration-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats / Info Card */}
        <div className="lg:col-span-1">
          <div className="glass-panel h-full rounded-3xl p-1">
            <div className="bg-white dark:bg-neutral-900 h-full rounded-[20px] p-8 flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Your Dashboard</h3>

              <div className="space-y-6 flex-1">
                <div
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-neutral-700/50 transition-colors group"
                  onClick={() => onNavigate('HISTORY')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">History</p>
                      <p className="text-xs text-slate-500">{history.length} Styles generated</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-md bg-slate-200 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300 group-hover:bg-brand-500 group-hover:text-white transition-colors">View</span>
                </div>

                <div
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-neutral-700/50 transition-colors"
                  onClick={() => onNavigate('SETTINGS')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${credits > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Credits</p>
                      <p className="text-xs text-slate-500">
                        {isLoadingCredits ? 'Loading...' : `${credits} available`}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-md capitalize ${credits > 0 ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'}`}>
                    {planType}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Styles List */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Recent Activity</h3>
          {history.length > 0 && (
            <button
              onClick={() => onNavigate('HISTORY')}
              className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              View Full Log
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}
        </div>

        {recentItems.length === 0 ? (
          <div className="w-full py-16 border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-3xl flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-neutral-900/20">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No activity yet</h4>
            <p className="text-slate-500 dark:text-slate-500 text-sm">Your styling sessions will appear here.</p>
          </div>
        ) : (
          <div className="overflow-hidden bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-neutral-800 border-b border-slate-100 dark:border-neutral-800">
                  <tr>
                    <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Date</th>
                    <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Customer Name</th>
                    <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Style Generated</th>
                    <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Face Shape</th>
                    <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider text-right">Gender</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                  {recentItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        <span className="block text-[10px] opacity-70">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                        {item.customerName || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400">
                          {item.styleName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {item.faceShape}
                      </td>
                      <td className="px-6 py-4 text-right capitalize text-slate-600 dark:text-slate-300">
                        {item.gender}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
