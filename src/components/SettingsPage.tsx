import React, { useState, useEffect } from 'react';
import { UserInfo, Gender, AppView } from '../types';
import { supabase } from '../services/supabaseClient';
import { getAllPlans, getUserCredits } from '../services/creditService';
import { initiatePurchase } from '../services/razorpayService';

interface SettingsPageProps {
  userInfo: UserInfo;
  onNavigate: (view: AppView) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ userInfo, onNavigate }) => {
  // Profile Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserInfo>(userInfo);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Preferences State
  const [preferences, setPreferences] = useState({
    marketingEmails: true,
    highQualityPreviews: true,
    publicProfile: false,
  });

  // Custom Add-on State
  const [customRenders, setCustomRenders] = useState<number>(10);

  // Credit and Plan State
  const [credits, setCredits] = useState(0);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [topupPlans, setTopupPlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Sync props to state if props change
  useEffect(() => {
    setFormData(userInfo);
  }, [userInfo]);

  // Load preferences from Supabase on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.preferences) {
          setPreferences(prev => ({
            ...prev,
            ...user.user_metadata.preferences
          }));
        }
      } catch (err) {
        console.error('Error loading preferences:', err);
      }
    };
    loadPreferences();
  }, []);

  // Fetch user credits and topup plans
  useEffect(() => {
    fetchCreditsAndPlans();
  }, []);

  const fetchCreditsAndPlans = async () => {
    try {
      if (userInfo?.id) {
        // Fetch user credits
        const userCredits = await getUserCredits(userInfo.id);
        setCredits(userCredits?.credits || 0);
        setCurrentPlan(userCredits?.plan_type || 'free');
      }

      // Fetch topup plans
      const plans = await getAllPlans('topup');
      setTopupPlans(plans);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const handleInputChange = (field: keyof UserInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.name,
          mobile: formData.mobile,
          dob: formData.dob,
          gender: formData.gender
        }
      });

      if (error) throw error;

      setSaveMessage("Profile updated successfully!");
      setIsEditing(false);
      // Timeout to clear message
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setSaveMessage("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePreference = async (key: keyof typeof preferences) => {
    const newValue = !preferences[key];
    setPreferences(prev => ({ ...prev, [key]: newValue }));

    // Save preference to Supabase user_metadata
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          preferences: {
            ...preferences,
            [key]: newValue
          }
        }
      });
      if (error) {
        console.error('Error saving preference:', error);
        // Revert on error
        setPreferences(prev => ({ ...prev, [key]: !newValue }));
      } else {
        console.log(`[Settings] Preference ${String(key)} saved:`, newValue);
      }
    } catch (err) {
      console.error('Error saving preference:', err);
      // Revert on error
      setPreferences(prev => ({ ...prev, [key]: !newValue }));
    }
  };

  const handleBuyAddon = async (planId: string, planName: string) => {
    try {
      await initiatePurchase(
        planId,
        () => {
          // Success callback - show modal and refresh
          setSuccessMessage(`Payment successful! Credits from ${planName} have been added to your account.`);
          setShowSuccessModal(true);
          fetchCreditsAndPlans(); // Refresh credits
          // Dispatch event for Header to refresh
          window.dispatchEvent(new CustomEvent('creditsUpdated'));
        },
        (error) => {
          // Failure callback
          setSuccessMessage(`Payment failed: ${error}`);
          setShowSuccessModal(true);
        }
      );
    } catch (error: any) {
      setSuccessMessage(`Error: ${error.message}`);
      setShowSuccessModal(true);
    }
  };

  const handleUpgradeClick = () => {
    onNavigate('LANDING');
    // Scroll to pricing section after navigation with retry mechanism
    const scrollToPricing = (retryCount = 0) => {
      const element = document.getElementById('pricing');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else if (retryCount < 5) {
        // Retry up to 5 times
        setTimeout(() => scrollToPricing(retryCount + 1), 200);
      }
    };

    // Initial delay to allow rendering
    setTimeout(() => scrollToPricing(), 100);
  };


  const inputClass = "w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-all placeholder-slate-400";
  const labelClass = "text-xs font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-wider ml-1 mb-1.5 block";

  return (
    <div className="max-w-6xl mx-auto px-4 pt-28 md:pt-40 pb-20 animate-fade-in relative">
      <h1 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-8">Account Settings</h1>

      {/* Success/Error Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-neutral-800 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${successMessage.includes('failed') || successMessage.includes('Error') ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
              {successMessage.includes('failed') || successMessage.includes('Error') ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-red-600 dark:text-red-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-green-600 dark:text-green-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {successMessage.includes('failed') || successMessage.includes('Error') ? 'Payment Failed' : 'Payment Successful!'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8">{successMessage}</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3.5 rounded-xl transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {saveMessage && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-2 ${saveMessage.includes('Failed') ? 'bg-red-50 dark:bg-red-900/20 border-red-200 text-red-600' : 'bg-green-50 dark:bg-green-900/20 border-green-200 text-green-600'}`}>
          <span className="font-bold">{saveMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: Profile & Preferences */}
        <div className="lg:col-span-2 space-y-8">

          {/* Personal Information */}
          <section className="glass-panel rounded-3xl p-1">
            <div className="bg-white dark:bg-neutral-900 rounded-[20px] p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-brand-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  Personal Information
                </h2>
                <button
                  onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isEditing
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20 hover:bg-brand-500'
                    : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-neutral-700'
                    }`}
                >
                  {isSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                  {isEditing ? (isSaving ? 'Saving...' : 'Save Changes') : 'Edit Details'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={inputClass}
                    />
                  ) : (
                    <div className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white truncate">
                      {formData.name}
                    </div>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Email Address</label>
                  {/* Email is typically read-only or requires re-auth flow, keeping read-only here for simplicity */}
                  <div className="w-full bg-slate-100 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-3.5 text-slate-500 dark:text-slate-400 truncate cursor-not-allowed">
                    {formData.email}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Mobile Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.mobile || ''}
                      onChange={(e) => handleInputChange('mobile', e.target.value)}
                      className={inputClass}
                      placeholder="+91"
                    />
                  ) : (
                    <div className={`w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-3.5 truncate ${!formData.mobile ? 'text-slate-400 italic' : 'text-slate-900 dark:text-white'}`}>
                      {formData.mobile || 'Not provided'}
                    </div>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.dob || ''}
                      onChange={(e) => handleInputChange('dob', e.target.value)}
                      className={inputClass}
                    />
                  ) : (
                    <div className={`w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-3.5 truncate ${!formData.dob ? 'text-slate-400 italic' : 'text-slate-900 dark:text-white'}`}>
                      {formData.dob || 'Not provided'}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Gender</label>
                  {isEditing ? (
                    <div className="flex gap-4">
                      {['male', 'female'].map((g) => (
                        <label key={g} className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${formData.gender === g ? 'bg-brand-50 border-brand-500 dark:bg-brand-900/20' : 'bg-slate-50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700'}`}>
                          <input
                            type="radio"
                            name="gender"
                            className="hidden"
                            checked={formData.gender === g}
                            onChange={() => setFormData(prev => ({ ...prev, gender: g as Gender }))}
                          />
                          <span className="capitalize font-bold text-slate-700 dark:text-slate-200">{g}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white capitalize">
                      {formData.gender}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Preferences */}
          <section className="glass-panel rounded-3xl p-1">
            <div className="bg-white dark:bg-neutral-900 rounded-[20px] p-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-brand-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                App Preferences
              </h2>
              <div className="space-y-4">
                {[
                  { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Receive updates about new styles and exclusive offers.' },
                  // { key: 'highQualityPreviews', label: 'High Quality Previews', desc: 'Always generate maximum resolution previews (uses more data).' },
                  // { key: 'publicProfile', label: 'Public Profile', desc: 'Allow others to see your shared transformation results.' }
                ].map((pref) => (
                  <div key={pref.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{pref.label}</p>
                      <p className="text-xs text-slate-500 dark:text-neutral-400">{pref.desc}</p>
                    </div>
                    <button
                      onClick={() => togglePreference(pref.key as keyof typeof preferences)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${preferences[pref.key as keyof typeof preferences] ? 'bg-brand-500' : 'bg-slate-300 dark:bg-neutral-600'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${preferences[pref.key as keyof typeof preferences] ? 'right-1' : 'left-1'}`}></span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Subscription & Add-ons */}
        <div className="lg:col-span-1 space-y-8">

          {/* Subscription Panel */}
          <section className="glass-panel rounded-3xl p-1 relative overflow-hidden">
            <div className="bg-white dark:bg-neutral-900 rounded-[20px] p-8 relative z-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-yellow-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                Subscription
              </h2>

              <div className="mb-6">
                <p className="text-sm text-slate-500 dark:text-neutral-400 mb-1">Current Plan</p>
                <p className="text-2xl font-heading font-bold text-slate-900 dark:text-white capitalize">{currentPlan} Plan</p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Credits remaining</span>
                  <span className="font-bold text-slate-900 dark:text-white">{credits}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min((credits / 100) * 100, 100)}%` }}></div>
                </div>
              </div>

              <button
                onClick={handleUpgradeClick}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 text-white font-bold shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 hover:-translate-y-0.5 transition-all"
              >
                Upgrade Plan
              </button>
            </div>
          </section>

          {/* Add-on Packs Panel */}
          <section className="glass-panel rounded-3xl p-1">
            <div className="bg-white dark:bg-neutral-900 rounded-[20px] p-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-brand-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                </svg>
                Add-on Packs
                {/* Tooltip */}
                <div className="relative group ml-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400 hover:text-brand-500 cursor-help">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                  </svg>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="font-bold mb-1">How Add-ons Work</div>
                    <p>Top-up credits will be added to your current plan balance. Credits do not expire and can be used for any hairstyle generation.</p>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-slate-900 dark:border-t-white"></div>
                  </div>
                </div>
              </h2>

              {/* Pre-defined Packs */}
              <div className="space-y-4 mb-8">
                {isLoadingPlans ? (
                  <div className="text-center text-slate-500 py-4">Loading plans...</div>
                ) : topupPlans.length > 0 ? (
                  topupPlans.map((pack) => (
                    <div key={pack.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-neutral-800 hover:border-brand-500/30 transition-all bg-slate-50/50 dark:bg-neutral-800/50">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{pack.display_name}</p>
                        <p className="text-xs mt-0.5 font-medium text-brand-600 dark:text-brand-400">{pack.credits} Credits</p>
                      </div>
                      <button
                        onClick={() => handleBuyAddon(pack.id, pack.display_name)}
                        className="px-4 py-2 rounded-lg text-sm font-bold bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-neutral-800 hover:border-brand-500 dark:hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-all shadow-sm active:scale-95"
                      >
                        Buy ₹{pack.price}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-500 py-4">No top-up packs available</div>
                )}
              </div>

              {/* Custom Pack Calculator */}
              <div className="border-t border-slate-200 dark:border-neutral-800 pt-6">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Custom Top-Up</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Renders</label>
                    <input
                      type="number"
                      min="1"
                      value={customRenders}
                      onChange={(e) => setCustomRenders(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-center font-bold outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Price</label>
                    <div className="w-full bg-slate-100 dark:bg-neutral-800 border border-transparent rounded-lg px-3 py-2 text-center font-bold text-slate-500 dark:text-slate-400">
                      ₹{customRenders * 8}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleBuyAddon('Custom Pack', `₹${customRenders * 8}`)}
                  className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity text-sm"
                >
                  Buy Custom Pack
                </button>
                <p className="text-center text-[10px] text-slate-400 mt-2">₹8 per render</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};