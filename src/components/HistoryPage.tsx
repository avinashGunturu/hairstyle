
import React, { useState, useEffect, useCallback } from 'react';
import { HistoryItem, AppView, UserInfo } from '../types';
import { getUserHistoryPaginated } from '../services/historyService';

interface HistoryPageProps {
  userInfo: UserInfo | null;
  onNavigate: (view: AppView) => void;
  onSelect: (item: HistoryItem) => void;
}

// View Details Modal Component
const ViewDetailsModal: React.FC<{
  item: HistoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ item, isOpen, onClose }) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ top: '80px' }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden max-h-[calc(100vh-120px)] flex flex-col">
        {/* Header - Sticky */}
        <div style={{ backgroundColor: '#1e293b' }} className="px-4 py-3 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-white">Session Details</h3>
            <p className="text-xs text-slate-300">{new Date(item.timestamp).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* Info Grid - Compact */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</p>
              <p className="font-medium text-slate-900 dark:text-white truncate">{item.customerName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
              <p className="font-medium text-slate-900 dark:text-white truncate">{item.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile</p>
              <p className="font-medium text-slate-900 dark:text-white">{item.mobile || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DOB</p>
              <p className="font-medium text-slate-900 dark:text-white">{item.dob || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</p>
              <p className="font-medium text-slate-900 dark:text-white capitalize">{item.gender}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Face Shape</p>
              <p className="font-medium text-slate-900 dark:text-white">{item.faceShape}</p>
            </div>
          </div>

          {/* Style & Status - Horizontal Row */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-neutral-800">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Style</p>
              {item.styleName ? (
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/30 truncate max-w-[150px]" title={item.styleName}>
                  {item.styleName}
                </span>
              ) : (
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
                  Pending
                </span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${item.status === 'generation_complete'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30'
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30'
                }`}>
                {item.status === 'generation_complete' ? '✓ Done' : '◐ Partial'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer - Sticky */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-neutral-800 border-t border-slate-100 dark:border-neutral-700 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-xl hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const PAGE_SIZE = 10;

export const HistoryPage: React.FC<HistoryPageProps> = ({ userInfo, onNavigate, onSelect }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Filter states (for input fields)
  const [searchInput, setSearchInput] = useState('');
  const [faceShapeInput, setFaceShapeInput] = useState('all');
  const [genderInput, setGenderInput] = useState('all');

  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState<{
    searchQuery?: string;
    faceShape?: string;
    gender?: string;
  }>({});

  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  // Fetch paginated data from API
  const fetchHistory = useCallback(async (page: number, filters?: typeof appliedFilters) => {
    if (!userInfo?.id) return;

    setIsLoading(true);
    try {
      const result = await getUserHistoryPaginated(userInfo.id, page, PAGE_SIZE, filters);

      // Map API data to HistoryItem format
      const mappedData: HistoryItem[] = result.data.map((item: any) => ({
        id: item.id,
        timestamp: new Date(item.created_at).getTime(),
        customerName: item.customer_name,
        email: item.email,
        mobile: item.mobile,
        dob: item.dob,
        styleName: item.style_name,
        faceShape: item.face_shape || 'Unknown',
        originalImage: '',
        generatedImage: '',
        gender: item.gender,
        status: item.status,
      }));

      setHistory(mappedData);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
      setCurrentPage(result.currentPage);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userInfo?.id]);

  // Initial fetch only - run once on mount
  useEffect(() => {
    fetchHistory(1, {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle search button click
  const handleSearch = () => {
    const newFilters = {
      searchQuery: searchInput || undefined,
      faceShape: faceShapeInput,
      gender: genderInput,
    };
    setAppliedFilters(newFilters);
    setCurrentPage(1);
    fetchHistory(1, newFilters);
  };

  // Handle clear button click
  const handleClear = () => {
    setSearchInput('');
    setFaceShapeInput('all');
    setGenderInput('all');
    setAppliedFilters({});
    setCurrentPage(1);
    fetchHistory(1, {});
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchHistory(page, appliedFilters);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pt-20 pb-20 animate-fade-in">
      {/* Header - Improved Layout */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <button
          onClick={() => onNavigate('APP')}
          className="text-sm font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Dashboard
        </button>

        <div className="text-right">
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-slate-900 dark:text-white">Style Log</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            <span className="text-brand-600 dark:text-brand-400 font-semibold">{totalCount}</span> total records
          </p>
        </div>
      </div>

      {/* Filters Section - Compact */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-slate-200 dark:border-neutral-800 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search name or style..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl pl-9 pr-4 py-2 focus:border-brand-500 outline-none text-slate-900 dark:text-white transition-all text-sm"
            />
          </div>

          {/* Face Shape Filter */}
          <div>
            <select
              value={faceShapeInput}
              onChange={(e) => setFaceShapeInput(e.target.value)}
              className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-3 py-2 focus:border-brand-500 outline-none text-slate-900 dark:text-white transition-all text-sm appearance-none cursor-pointer"
            >
              <option value="all">All Shapes</option>
              <option value="oval">Oval</option>
              <option value="round">Round</option>
              <option value="square">Square</option>
              <option value="heart">Heart</option>
              <option value="oblong">Oblong</option>
              <option value="diamond">Diamond</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <select
              value={genderInput}
              onChange={(e) => setGenderInput(e.target.value)}
              className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-3 py-2 focus:border-brand-500 outline-none text-slate-900 dark:text-white transition-all text-sm appearance-none cursor-pointer"
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            Search
          </button>

          {/* Clear Button */}
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-slate-200 dark:border-neutral-700 border-t-brand-500 rounded-full animate-spin mb-3"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading records...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl bg-slate-50/50 dark:bg-neutral-900/50">
          <div className="w-14 h-14 bg-slate-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-slate-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium text-sm">No records found matching your filters.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-neutral-800 border-b border-slate-100 dark:border-neutral-800">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Date</th>
                  <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Customer</th>
                  <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Style</th>
                  <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Face Shape</th>
                  <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Gender</th>
                  <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      <div className="font-medium text-slate-900 dark:text-white text-xs">
                        {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-xs">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap text-xs">
                      {item.customerName || 'N/A'}
                    </td>
                    <td className="px-4 py-3 max-w-[120px]">
                      {item.styleName ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border border-brand-100 dark:border-brand-900/30 truncate max-w-full" title={item.styleName}>
                          {item.styleName}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">
                      {item.faceShape}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-300 text-xs">
                      {item.gender}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="px-3 py-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Showing info */}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing <span className="font-medium text-slate-900 dark:text-white">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
            <span className="font-medium text-slate-900 dark:text-white">{Math.min(currentPage * PAGE_SIZE, totalCount)}</span> of{' '}
            <span className="font-medium text-slate-900 dark:text-white">{totalCount}</span>
          </p>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {/* Previous button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* Page numbers */}
            {getPageNumbers().map((page, idx) => (
              <button
                key={idx}
                onClick={() => typeof page === 'number' && handlePageChange(page)}
                disabled={page === '...'}
                className={`min-w-[32px] px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${page === currentPage
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
                  : page === '...'
                    ? 'text-slate-400 cursor-default'
                    : 'border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800'
                  }`}
              >
                {page}
              </button>
            ))}

            {/* Next button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      <ViewDetailsModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
};
