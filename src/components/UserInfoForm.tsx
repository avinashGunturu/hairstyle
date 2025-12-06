
import React, { useState, useEffect } from 'react';
import { Gender, UserInfo } from '../types';

interface UserInfoFormProps {
  initialData?: Partial<UserInfo> | null;
  onSubmit: (info: UserInfo) => void;
}

export const UserInfoForm: React.FC<UserInfoFormProps> = ({ initialData, onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Removed prefill useEffect as per user request to not prefill data

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\+?[\d\s-]{10,}$/.test(mobile)) {
      newErrors.mobile = "Please enter a valid mobile number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({ name, email, mobile, dob, gender });
    }
  };

  const getInputClass = (fieldName: string) => `
    w-full bg-slate-50 dark:bg-neutral-900 border rounded-xl px-4 py-3.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-600 outline-none text-base transition-all
    ${errors[fieldName]
      ? 'border-red-500 focus:ring-4 focus:ring-red-500/10'
      : 'border-slate-200 dark:border-neutral-700 focus:border-brand-500 dark:focus:border-brand-500 focus:bg-white dark:focus:bg-black focus:ring-4 focus:ring-brand-500/10'
    }
  `;

  const labelClass = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";

  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="flex items-center gap-1.5 mt-1.5 animate-fade-in text-red-500 dark:text-red-400">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
      <span className="text-xs font-medium">{message}</span>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in px-4 md:px-0">
      <div className="glass-panel rounded-3xl p-1 shadow-2xl shadow-brand-900/10 dark:shadow-black/40">
        <div className="bg-white/90 dark:bg-neutral-900/95 rounded-[20px] p-6 md:p-12 backdrop-blur-xl">
          <div className="text-center mb-10">
            <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-500/30 rotate-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white">Styling Session</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-base">Tell us about yourself to personalize the AI.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Gender Selection */}
            <div>
              <span className={labelClass}>Select Style Preference</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${gender === 'male'
                      ? 'bg-brand-50 border-brand-500 dark:bg-brand-900/20 dark:border-brand-500'
                      : 'bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 hover:border-brand-300 dark:hover:border-neutral-600'
                    }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${gender === 'male' ? 'bg-brand-200 dark:bg-brand-800 text-brand-800 dark:text-brand-100' : 'bg-slate-100 dark:bg-neutral-700 text-slate-500'}`}>
                    👨
                  </div>
                  <div className="text-left">
                    <span className={`block font-bold ${gender === 'male' ? 'text-brand-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>Male Style</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Beards & Cuts</span>
                  </div>
                  {gender === 'male' && (
                    <div className="absolute top-4 right-4 text-brand-600 dark:text-brand-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${gender === 'female'
                      ? 'bg-brand-50 border-brand-500 dark:bg-brand-900/20 dark:border-brand-500'
                      : 'bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 hover:border-brand-300 dark:hover:border-neutral-600'
                    }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${gender === 'female' ? 'bg-brand-200 dark:bg-brand-800 text-brand-800 dark:text-brand-100' : 'bg-slate-100 dark:bg-neutral-700 text-slate-500'}`}>
                    👩
                  </div>
                  <div className="text-left">
                    <span className={`block font-bold ${gender === 'female' ? 'text-brand-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>Female Style</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Brows & Styling</span>
                  </div>
                  {gender === 'female' && (
                    <div className="absolute top-4 right-4 text-brand-600 dark:text-brand-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="w-full">
                <label htmlFor="name" className={labelClass}>Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearError('name');
                  }}
                  className={getInputClass('name')}
                  placeholder="e.g. Alex Smith"
                />
                {errors.name && <ErrorMessage message={errors.name} />}
              </div>

              <div className="w-full">
                <label htmlFor="mobile" className={labelClass}>Mobile Number</label>
                <input
                  id="mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value);
                    clearError('mobile');
                  }}
                  className={getInputClass('mobile')}
                  placeholder="98765 43210"
                />
                {errors.mobile && <ErrorMessage message={errors.mobile} />}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="w-full">
                <label htmlFor="email" className={labelClass}>Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError('email');
                  }}
                  className={getInputClass('email')}
                  placeholder="name@example.com"
                />
                {errors.email && <ErrorMessage message={errors.email} />}
              </div>

              <div className="w-full">
                <label htmlFor="dob" className={labelClass}>
                  Date of Birth <span className="text-slate-400 dark:text-slate-500 font-normal ml-1 text-xs">(Optional)</span>
                </label>
                <input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className={getInputClass('dob')}
                  placeholder="Select date"
                />
              </div>
            </div>

            <div className="pt-4">
              {/* Marketing Consent Checkbox - Square Style */}
              <div className="flex items-start gap-3 mb-6 p-4 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700">
                <div className="relative flex items-center h-5 mt-0.5">
                  <input
                    type="checkbox"
                    id="marketing-consent"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-sm border-2 border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 checked:bg-brand-600 checked:border-brand-600 transition-all shadow-sm"
                  />
                  <svg
                    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <label htmlFor="marketing-consent" className="text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer select-none leading-tight block mb-1">
                    Keep me updated
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                    We will use your information to send you product-related updates and styling tips.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/25 dark:shadow-brand-900/30 transition-all transform hover:-translate-y-0.5 text-lg flex items-center justify-center gap-3 group"
              >
                <span>Continue</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
