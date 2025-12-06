
import React, { useState, useMemo } from 'react';
import { HistoryItem, AppView } from '../types';

interface HistoryPageProps {
  history: HistoryItem[];
  onNavigate: (view: AppView) => void;
  onSelect: (item: HistoryItem) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ history, onNavigate, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFaceShape, setFilterFaceShape] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [visibleCount, setVisibleCount] = useState(20);
  const [loadingMore, setLoadingMore] = useState(false);

  // Extract unique face shapes for filter dropdown
  const uniqueFaceShapes = useMemo(() => {
     const shapes = new Set(history.map(h => h.faceShape));
     return Array.from(shapes);
  }, [history]);

  // Filter logic
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = 
        searchQuery === '' ||
        item.styleName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.customerName && item.customerName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFace = filterFaceShape === 'all' || item.faceShape === filterFaceShape;
      const matchesGender = filterGender === 'all' || item.gender === filterGender;

      return matchesSearch && matchesFace && matchesGender;
    });
  }, [history, searchQuery, filterFaceShape, filterGender]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 20);
      setLoadingMore(false);
    }, 500);
  };

  const visibleItems = filteredHistory.slice(0, visibleCount);

  return (
    <div className="max-w-7xl mx-auto px-4 pt-28 md:pt-40 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
        <div>
          <button 
            onClick={() => onNavigate('APP')}
            className="text-sm font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 mb-2 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-heading font-bold text-slate-900 dark:text-white">Style Log</h1>
          <p className="text-slate-600 dark:text-slate-400">Complete record of your styling sessions.</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-slate-200 dark:border-neutral-800 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             {/* Search */}
             <div className="md:col-span-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Search style or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 focus:border-brand-500 outline-none text-slate-900 dark:text-white transition-all text-sm"
                />
             </div>

             {/* Face Shape Filter */}
             <div>
                 <select 
                    value={filterFaceShape}
                    onChange={(e) => setFilterFaceShape(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 focus:border-brand-500 outline-none text-slate-900 dark:text-white transition-all text-sm appearance-none cursor-pointer"
                 >
                     <option value="all">All Face Shapes</option>
                     {uniqueFaceShapes.map(shape => (
                         <option key={shape} value={shape}>{shape}</option>
                     ))}
                 </select>
             </div>

             {/* Gender Filter */}
             <div>
                 <select 
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 focus:border-brand-500 outline-none text-slate-900 dark:text-white transition-all text-sm appearance-none cursor-pointer"
                 >
                     <option value="all">All Genders</option>
                     <option value="male">Male</option>
                     <option value="female">Female</option>
                 </select>
             </div>
          </div>
      </div>

      {visibleItems.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-3xl bg-slate-50/50 dark:bg-neutral-900/50">
            <div className="w-16 h-16 bg-slate-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">No records found matching your filters.</p>
         </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 dark:bg-neutral-800 border-b border-slate-100 dark:border-neutral-800">
                    <tr>
                      <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Date & Time</th>
                      <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Customer Name</th>
                      <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Style Generated</th>
                      <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Face Shape</th>
                      <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Gender</th>
                      <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                    {visibleItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                           <div className="font-medium text-slate-900 dark:text-white">
                              {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                           </div>
                           <div className="text-xs mt-0.5">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                           {item.customerName || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border border-brand-100 dark:border-brand-900/30">
                              {item.styleName}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                           {item.faceShape}
                        </td>
                        <td className="px-6 py-4 capitalize text-slate-600 dark:text-slate-300">
                           {item.gender}
                        </td>
                        <td className="px-6 py-4 text-right">
                            {/* Disabled View Button to reflect privacy policy */}
                            <button 
                                disabled
                                className="text-xs font-medium text-slate-400 cursor-not-allowed"
                                title="Image data is not stored for privacy."
                            >
                                View Unavailable
                            </button>
                        </td>
                      </tr>
                    ))}
                 </tbody>
             </table>
           </div>
        </div>
      )}

      {/* Infinite Scroll Trigger / Load More */}
      {visibleItems.length < filteredHistory.length && (
        <div className="mt-8 text-center">
           <button 
             onClick={handleLoadMore}
             disabled={loadingMore}
             className="px-8 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-neutral-700 transition-all shadow-sm flex items-center gap-2 mx-auto disabled:opacity-50"
           >
             {loadingMore ? (
               <>
                 <div className="w-4 h-4 border-2 border-slate-400 border-t-brand-500 rounded-full animate-spin"></div>
                 Loading more records...
               </>
             ) : (
               'Load More'
             )}
           </button>
        </div>
      )}
    </div>
  );
};
