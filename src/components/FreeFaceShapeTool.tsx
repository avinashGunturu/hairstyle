
import React, { useState, useEffect } from 'react';
import { detectFaceShape } from '../services/geminiService';
import { FaceShapeResult, Gender, AppView } from '../types';
import { UploadArea } from './UploadArea';
import { supabase } from '../services/supabaseClient';
import { FREE_TOOL_CONFIG, STORAGE_KEYS } from '../constants';

interface FreeFaceShapeToolProps {
    onNavigate: (view: AppView) => void;
}

export const FreeFaceShapeTool: React.FC<FreeFaceShapeToolProps> = ({ onNavigate }) => {
    const MAX_FREE_USES = FREE_TOOL_CONFIG.MAX_FREE_USES;
    const [step, setStep] = useState<'FORM' | 'UPLOAD' | 'ANALYZING' | 'RESULT'>('FORM');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        dob: '',
        gender: 'male' as Gender
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [image, setImage] = useState<string | null>(null);
    const [result, setResult] = useState<FaceShapeResult | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);
    const [currentLogId, setCurrentLogId] = useState<string | null>(null);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [isUser, setIsUser] = useState<boolean | null>(null);
    const [session, setSession] = useState(null);


    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => listener.subscription.unsubscribe();
    }, []);

    const calculateAge = (dobString: string): string => {
        if (!dobString) return '';
        const today = new Date();
        const birthDate = new Date(dobString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age.toString();
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = "Full name is required";

        if (!formData.email.trim()) {
            newErrors.email = "Email address is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("validateForm", validateForm());

        if (validateForm()) {
            // Check usage limit before proceeding
            const usageCount = parseInt(localStorage.getItem(STORAGE_KEYS.FREE_TOOL_USAGE_COUNT) || '0', 10);
            console.log("usageCount", usageCount);
            // const { data: { session } } = await supabase.auth.getSession();
            console.log("session", session, !session);

            // if (!session && usageCount >= MAX_FREE_USES) {
            //     setShowLimitModal(true);
            //     return;
            // }

            if (!session) {
                if (usageCount >= MAX_FREE_USES) {
                    setShowLimitModal(true);
                    return;
                }
            }

            // Create initial log entry
            try {
                const age = formData.dob ? calculateAge(formData.dob) : undefined;
                const user = session?.user;
                setIsUser(user ? true : false);
                console.log("User:", user);

                const initialLog = {
                    created_by: user ? user?.user_metadata?.full_name : 'user',
                    user_id: user ? user.id : null,
                    user_name: formData.name,
                    user_email: formData.email,
                    user_gender: formData.gender,
                    user_age: age,
                };

                const { data, error } = await supabase
                    .from('face_analysis_logs')
                    .insert([initialLog])
                    .select()
                    .single();

                if (error) throw error;
                if (data) setCurrentLogId(data.id);

            } catch (err) {
                console.error("Failed to create initial log:", err);
                // We continue to next step even if logging fails to not block the user
            }

            setStep('UPLOAD');
        }
    };

    const handleImageSelect = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                const base64 = e.target.result as string;
                setImage(base64);
                analyzeImage(base64);
            }
        };
        reader.readAsDataURL(file);
    };

    const analyzeImage = async (base64: string) => {
        setStep('ANALYZING');

        // Calculate age from DOB if present
        const age = formData.dob ? calculateAge(formData.dob) : undefined;

        try {
            const data = await detectFaceShape(base64, formData.gender, age);
            setResult(data);
            setStep('RESULT');

            // Log/Update Supabase
            if (currentLogId) {
                await supabase
                    .from('face_analysis_logs')
                    .update({
                        face_shape: data.shape,
                        confidence: data.confidence,
                        api_response: data,
                        usage_info: data.usageMetadata
                    })
                    .eq('id', currentLogId);
            } else {
                // Fallback: Insert full record if initial log failed
                const { data: { session } } = await supabase.auth.getSession();
                const user = session?.user;

                const logEntry = {
                    created_by: user ? 'authenticated' : 'user',
                    user_id: user ? user.id : null,
                    user_name: formData.name,
                    user_email: formData.email,
                    user_gender: formData.gender,
                    user_age: age,
                    face_shape: data.shape,
                    confidence: data.confidence,
                    api_response: data,
                    usage_info: data.usageMetadata
                };

                const { data: newLog } = await supabase.from('face_analysis_logs').insert([logEntry]).select().single();
                if (newLog) setCurrentLogId(newLog.id);
            }

            // Increment usage count in localStorage
            const currentCount = parseInt(localStorage.getItem(STORAGE_KEYS.FREE_TOOL_USAGE_COUNT) || '0', 10);
            localStorage.setItem(STORAGE_KEYS.FREE_TOOL_USAGE_COUNT, (currentCount + 1).toString());

            // Clear legacy key if it exists to switch to new system
            localStorage.removeItem('has_used_free_tool');

        } catch (err) {
            console.error("Analysis failed:", err);
            setApiError("We couldn't analyze this image. Please ensure your face is clearly visible.");
            setStep('UPLOAD');
        }
    };

    const inputClass = (error: boolean) => `
    w-full bg-slate-50 dark:bg-neutral-800 border rounded-xl px-4 py-3.5 text-slate-900 dark:text-white outline-none transition-all placeholder-slate-400
    ${error
            ? 'border-red-500 focus:ring-4 focus:ring-red-500/10'
            : 'border-slate-200 dark:border-neutral-700 focus:border-brand-500'
        }
  `;

    const labelClass = "text-xs font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-wider ml-1 mb-1.5 block";

    // Reusable Error Message Component
    const ErrorMessage = ({ message }: { message: string }) => (
        <div className="flex items-center gap-1.5 mt-1.5 animate-fade-in text-red-500 dark:text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium">{message}</span>
        </div>
    );

    return (
        <div className="pt-28 md:pt-40 pb-20 animate-fade-in min-h-screen">
            <div className="max-w-4xl mx-auto px-4">

                {/* Header */}
                <div className="text-center mb-12">
                    <span className="inline-block px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-xs font-bold uppercase tracking-wider mb-4 border border-brand-200 dark:border-brand-500/20">
                        Free AI Tool
                    </span>
                    <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-slate-900 dark:text-white mb-4">
                        Face Shape <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-blue-600">Detector</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Understanding your geometry is the first step to style mastery. Get a scientific analysis of your facial structure in seconds.
                    </p>
                </div>

                {/* Content Container - Increased width for better desktop/tablet layout */}
                <div className="max-w-4xl mx-auto bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl shadow-brand-900/10 dark:shadow-black/50 border border-slate-200 dark:border-neutral-800 overflow-hidden relative">

                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -z-10"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>

                    <div className="p-8 md:p-12 lg:p-16">

                        {/* Limit Reached Modal */}
                        {showLimitModal && (
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-neutral-800 animate-scale-in">
                                    <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                        🎯
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 text-center">Free Limit Reached</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
                                        You've used your free analysis ({MAX_FREE_USES}/{MAX_FREE_USES}). Create a free account to unlock unlimited analyses!
                                    </p>
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => onNavigate('SIGNUP')}
                                            className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all"
                                        >
                                            Create Free Account
                                        </button>
                                        <button
                                            onClick={() => onNavigate('LOGIN')}
                                            className="w-full py-3 bg-white dark:bg-neutral-800 text-slate-900 dark:text-white font-bold rounded-xl border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-700 transition-all"
                                        >
                                            Log In
                                        </button>
                                        <button
                                            onClick={() => setShowLimitModal(false)}
                                            className="w-full py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm transition-colors"
                                        >
                                            Go Back
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 'FORM' && (
                            <form onSubmit={handleFormSubmit} className="space-y-8 animate-fade-in max-w-3xl mx-auto">
                                <div className="text-center mb-10">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tell us about you</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">We need these details to calibrate the AI model accurately.</p>
                                </div>

                                {/* Name Field - Row 1 */}
                                <div>
                                    <label className={labelClass}>Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => {
                                            setFormData({ ...formData, name: e.target.value });
                                            if (errors.name) setErrors({ ...errors, name: '' });
                                        }}
                                        className={inputClass(!!errors.name)}
                                        placeholder="e.g. Aryan Sharma"
                                    />
                                    {errors.name && <ErrorMessage message={errors.name} />}
                                </div>

                                {/* Email Field - Row 2 */}
                                <div>
                                    <label className={labelClass}>Email Address</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => {
                                            setFormData({ ...formData, email: e.target.value });
                                            if (errors.email) setErrors({ ...errors, email: '' });
                                        }}
                                        className={inputClass(!!errors.email)}
                                        placeholder="name@example.com"
                                    />
                                    {errors.email && <ErrorMessage message={errors.email} />}
                                    <p className="text-[10px] text-slate-400 mt-2 ml-1">We'll send your detailed report here.</p>
                                </div>

                                {/* Gender & DOB - Row 3 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className={labelClass}>Gender</label>
                                        <div className="relative">
                                            <select
                                                value={formData.gender}
                                                onChange={e => setFormData({ ...formData, gender: e.target.value as Gender })}
                                                className={`${inputClass(false)} appearance-none cursor-pointer`}
                                            >
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="non-binary">Non-Binary</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Date of Birth <span className="text-slate-400 normal-case font-normal">(Optional)</span></label>
                                        <input
                                            type="date"
                                            value={formData.dob}
                                            onChange={e => setFormData({ ...formData, dob: e.target.value })}
                                            className={`${inputClass(false)} [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 dark:[color-scheme:dark]`}
                                            placeholder="Select date"
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-6 text-lg">
                                    Next Step
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </form>
                        )}

                        {step === 'UPLOAD' && (
                            <div className="animate-fade-in space-y-8 max-w-3xl mx-auto">
                                <div className="text-center mb-6">
                                    <button onClick={() => setStep('FORM')} className="text-sm text-slate-500 hover:text-brand-500 mb-6 flex items-center justify-center gap-1 mx-auto transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                        </svg>
                                        Back to details
                                    </button>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Upload Your Photo</h2>
                                    <p className="text-slate-500 dark:text-slate-400">Ensure your face is clearly visible, facing forward.</p>
                                </div>
                                {apiError && (
                                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-4 rounded-xl text-sm text-center border border-red-100 dark:border-red-900/30 flex items-center justify-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                        </svg>
                                        {apiError}
                                    </div>
                                )}
                                <UploadArea onImageSelected={handleImageSelect} />
                                <p className="text-xs text-center text-slate-400 mt-4">
                                    Photos are processed in temporary memory and deleted immediately after analysis.
                                </p>
                            </div>
                        )}

                        {step === 'ANALYZING' && (
                            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                                <div className="relative w-28 h-28 mb-8">
                                    <div className="absolute inset-0 border-4 border-slate-200 dark:border-neutral-700 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center text-4xl">📐</div>
                                </div>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 animate-pulse">Measuring Geometry</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-lg">Analyzing facial landmarks...</p>
                            </div>
                        )}

                        {step === 'RESULT' && result && image && (
                            <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
                                {/* Left: Image & Badge */}
                                <div className="relative mx-auto lg:mx-0 max-w-sm lg:max-w-none w-full">
                                    <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-neutral-800">
                                        <img src={image} alt="User" className="w-full h-auto" />
                                    </div>
                                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-full font-bold shadow-xl border border-white/20 whitespace-nowrap z-10 text-lg">
                                        {result.shape} Shape
                                    </div>
                                </div>

                                {/* Right: Analysis */}
                                <div className="space-y-8 pt-4">
                                    <div>
                                        <h2 className="text-4xl font-heading font-bold text-slate-900 dark:text-white mb-3">Analysis Complete</h2>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-brand-600 dark:text-brand-400 bg-brand-100 dark:bg-brand-900/20 px-3 py-1.5 rounded-full border border-brand-200 dark:border-brand-500/20">
                                                {result.confidence}% Confidence Match
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
                                        {result.description}
                                    </p>

                                    <div className="bg-slate-50 dark:bg-neutral-800 p-8 rounded-3xl border border-slate-100 dark:border-neutral-700">
                                        <h4 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 text-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-brand-500">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                            </svg>
                                            Key Landmarks Detected
                                        </h4>
                                        <ul className="space-y-3">
                                            {result.keyFeatures.map((feat, i) => (
                                                <li key={i} className="flex items-start gap-3 text-base text-slate-600 dark:text-slate-400">
                                                    <span className="mt-2 w-1.5 h-1.5 bg-brand-500 rounded-full flex-shrink-0"></span>
                                                    {feat}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="border-t border-slate-200 dark:border-neutral-800 pt-8">
                                        <p className="text-base text-slate-500 dark:text-slate-400 mb-6">
                                            Knowing your shape is just the start. See how you look with the perfect haircut designed for <span className="font-bold text-slate-900 dark:text-white">{result.shape}</span> faces.
                                        </p>
                                        <button
                                            onClick={() => isUser ? onNavigate('APP') : onNavigate('SIGNUP')}
                                            className="w-full py-4 px-8 bg-gradient-to-r from-brand-600 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 text-lg h-auto min-h-[3.5rem] whitespace-normal leading-tight"
                                        >
                                            <span className="flex-1">Visualize Hairstyles for {result.shape} Face</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 shrink-0">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};
