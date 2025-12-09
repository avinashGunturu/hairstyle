
import React, { useState, useEffect, useRef } from 'react';
import { AppView } from '../types';
import { supabase } from '../services/supabaseClient';
import { initiatePurchase } from '../services/razorpayService';
import { getUserCredits } from '../services/creditService';
import { STORAGE_KEYS } from '../constants';

interface LandingPageProps {
  onStart: () => void;
  onNavigate: (view: AppView) => void;
}

// --- Micro-interaction: Scroll Reveal Component ---
const RevealOnScroll: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        } ${className}`}
    >
      {children}
    </div>
  );
};

// --- Gender Selection Popup Component ---
const GENDER_STORAGE_KEY = STORAGE_KEYS.GENDER_PREFERENCE;

interface GenderSelectionPopupProps {
  onSelect: (gender: 'male' | 'female') => void;
}

const GenderSelectionPopup: React.FC<GenderSelectionPopupProps> = ({ onSelect }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative bg-white dark:bg-neutral-900 rounded-3xl p-8 md:p-12 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-neutral-800 text-center overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-pink-500/20 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-blue-500/20 to-transparent rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>

        <h2 className="text-2xl md:text-3xl font-heading font-bold text-slate-900 dark:text-white mb-3">
          Personalize Your Experience
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 text-base md:text-lg">
          Help us show you the most relevant hairstyle transformations
        </p>

        {/* Gender Options */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Male Option */}
          <button
            onClick={() => onSelect('male')}
            className="group relative p-6 rounded-2xl border-2 border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-blue-600 dark:text-blue-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Male</span>
          </button>

          {/* Female Option */}
          <button
            onClick={() => onSelect('female')}
            className="group relative p-6 rounded-2xl border-2 border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-pink-600 dark:text-pink-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">Female</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          You can change this anytime in settings
        </p>
      </div>
    </div>
  );
};

// --- Before/After Demo Slider Component ---
interface BeforeAfterDemoProps {
  gender: 'male' | 'female';
}

const BeforeAfterDemo: React.FC<BeforeAfterDemoProps> = ({ gender }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [hasInteracted, setHasInteracted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-oscillation effect
  useEffect(() => {
    if (hasInteracted) return;

    let animationFrame: number;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      // Sine wave oscillation between 30% and 70%
      const newPos = 50 + 25 * Math.sin(elapsed * 0.002);
      setSliderPos(newPos);
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [hasInteracted]);

  const handleInteraction = (clientX: number) => {
    setHasInteracted(true);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
      setSliderPos(percentage);
    }
  };

  // Gender-specific images
  const images = {
    male: {
      before: "https://svuhythvtdbtbleberdz.supabase.co/storage/v1/object/public/hairStyles/men_before.png",
      after: "https://svuhythvtdbtbleberdz.supabase.co/storage/v1/object/public/hairStyles/men_after.png"
    },
    female: {
      before: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80",
      after: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80"
    }
  };

  const beforeImage = images[gender].before;
  const afterImage = images[gender].after;

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Decorative Glow */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-brand-500/20 to-blue-600/20 rounded-[2rem] blur-2xl opacity-75 animate-pulse pointer-events-none"></div>

      <div
        ref={containerRef}
        className="relative w-full aspect-[4/5] md:aspect-[3/4] rounded-2xl overflow-hidden cursor-ew-resize shadow-2xl border-4 border-white dark:border-neutral-800 select-none group touch-none bg-neutral-100 dark:bg-neutral-900"
        onMouseDown={(e) => handleInteraction(e.clientX)}
        onMouseMove={(e) => { if (hasInteracted && e.buttons === 1) handleInteraction(e.clientX); }}
        onTouchStart={(e) => handleInteraction(e.touches[0].clientX)}
        onTouchMove={(e) => handleInteraction(e.touches[0].clientX)}
      >
        {/* Image 1: Before (Background) */}
        <img
          src={beforeImage}
          alt="Original Hairstyle"
          className="absolute inset-0 w-full h-full object-cover object-top"
          draggable={false}
        />
        <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-wider pointer-events-none z-10">
          Original
        </div>

        {/* Image 2: After (Clipped on top) */}
        <div
          className="absolute inset-0 overflow-hidden will-change-[width]"
          style={{ width: `${sliderPos}%` }}
        >
          <img
            src={afterImage}
            alt="New Hairstyle"
            className="absolute inset-0 w-full h-full object-cover object-top max-w-none"
            style={{ width: containerRef.current?.getBoundingClientRect().width || '100%' }}
            draggable={false}
          />
          <div className="absolute top-4 left-4 px-3 py-1 bg-brand-600/90 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-wider pointer-events-none shadow-lg">
            New Look
          </div>
        </div>

        {/* Slider Handle */}
        <div
          className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.3)] z-20"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-brand-600 ring-4 ring-black/10">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" className="rotate-90" />
            </svg>
          </div>
        </div>

        {/* Instruction Overlay (Disappears on interaction) */}
        {!hasInteracted && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm font-medium pointer-events-none transition-opacity duration-500 opacity-80">
            Drag to compare
          </div>
        )}
      </div>
    </div>
  );
};

// --- Data for Pricing ---
// Helper to parse price string to number
const parsePrice = (str: string) => parseInt(str.replace(/[^0-9]/g, ''));

const pricingPlans = [
  {
    id: 'basic',
    name: "Basic",
    tag: "Affordable Starter",
    highlight: false,
    monthly: { price: "₹49", mrp: "₹69", renders: "10" },
    yearly: { price: "₹499", savings: "₹119", renders: "120" },
    subCopy: "Try the experience before haircut shopping.",
    features: ["Full hairstyle library", "Unlimited face shape checks", "Download and share freely", "No Watermark", "Standard Support"]
  },
  {
    id: 'starter',
    name: "Starter",
    tag: "Great Value",
    highlight: false,
    monthly: { price: "₹249", mrp: "₹349", renders: "50" },
    yearly: { price: "₹2,699", savings: "₹589", renders: "600" },
    features: ["Full hairstyle library", "Unlimited face shape checks", "Download and share freely", "No Watermark", "All Styles Access", "Priority Support"]
  },
  {
    id: 'popular',
    name: "Popular",
    tag: "⭐ Best Seller ⭐",
    highlight: true,
    monthly: { price: "₹499", mrp: "₹699", renders: "80" },
    yearly: { price: "₹4,799", savings: "₹1,189", renders: "960" },
    features: ["Full hairstyle library", "Unlimited face shape checks", "Download and share freely", "No Watermark", "Priority Processing", "New Styles First"]
  },
  {
    id: 'pro',
    name: "Pro",
    tag: "Advanced Users",
    highlight: false,
    monthly: { price: "₹899", mrp: "₹1,299", renders: "150" },
    yearly: { price: "₹8,599", savings: "₹2,189", renders: "1,800" },
    features: ["Full hairstyle library", "Unlimited face shape checks", "Download and share freely", "No Watermark", "Priority Processing", "Dedicated Support"]
  },
  {
    id: 'ultra',
    name: "Ultra",
    tag: "Premium Experience",
    highlight: false,
    monthly: { price: "₹1,499", mrp: "₹1,999", renders: "250" },
    yearly: { price: "₹14,399", savings: "₹3,589", renders: "3,000" },
    features: ["Full hairstyle library", "Unlimited face shape checks", "Download and share freely", "No Watermark", "Instant Processing", "VIP Support"]
  }
];

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [user, setUser] = useState<any>(null);

  // Payment result modal state
  const [paymentModal, setPaymentModal] = useState<{ show: boolean; success: boolean; message: string }>({ show: false, success: false, message: '' });

  // Gender preference state
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [showGenderPopup, setShowGenderPopup] = useState(false);

  // Check for saved gender preference on mount
  useEffect(() => {
    const savedGender = localStorage.getItem(GENDER_STORAGE_KEY);
    if (savedGender === 'male' || savedGender === 'female') {
      setSelectedGender(savedGender);
    } else {
      // No preference saved, show popup
      setShowGenderPopup(true);
    }
  }, []);

  // Handle gender selection from popup
  const handleGenderSelect = (gender: 'male' | 'female') => {
    setSelectedGender(gender);
    localStorage.setItem(GENDER_STORAGE_KEY, gender);
    setShowGenderPopup(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // User's current plan state
  const [userPlan, setUserPlan] = useState<string | null>(null);

  // Fetch user's current plan when user changes
  useEffect(() => {
    const fetchUserPlan = async () => {
      if (user?.id) {
        const credits = await getUserCredits(user.id);
        setUserPlan(credits?.plan_type || 'free');
      } else {
        setUserPlan(null);
      }
    };
    fetchUserPlan();
  }, [user]);

  const handlePlanSelect = async (planId: string) => {
    if (!user) {
      onStart(); // Redirect to login/signup
      return;
    }

    // Trigger Razorpay
    await initiatePurchase(planId, async () => {
      // Success callback - show modal
      setPaymentModal({ show: true, success: true, message: 'Your credits have been added successfully!' });
    }, (error) => {
      // Failure callback - show modal
      setPaymentModal({ show: true, success: false, message: error || 'Payment was cancelled or failed.' });
    });
  };

  // Handle payment modal close
  const handlePaymentModalClose = () => {
    const wasSuccess = paymentModal.success;
    setPaymentModal({ show: false, success: false, message: '' });
    if (wasSuccess) {
      window.location.reload();
    }
  };

  // --- Typewriter Effect State ---
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);

  const toRotate = ["True Confidence", "Perfect Look", "Inner Glow", "Signature Style"];

  useEffect(() => {
    const ticker = setTimeout(() => {
      tick();
    }, typingSpeed);

    return () => clearTimeout(ticker);
  }, [text]);

  const tick = () => {
    let i = loopNum % toRotate.length;
    let fullText = toRotate[i];
    let updatedText = isDeleting
      ? fullText.substring(0, text.length - 1)
      : fullText.substring(0, text.length + 1);

    setText(updatedText);

    // Randomized smooth typing speed
    let delta = 100 - Math.random() * 40;

    if (isDeleting) {
      delta /= 2; // Deleting is faster
    }

    if (!isDeleting && updatedText === fullText) {
      setIsDeleting(true);
      setTypingSpeed(2000); // Pause at end of word
    } else if (isDeleting && updatedText === '') {
      setIsDeleting(false);
      setLoopNum(loopNum + 1);
      setTypingSpeed(500); // Short pause before new word
    } else {
      setTypingSpeed(delta);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  };

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Digital Marketer, Mumbai",
      content: "I was terrified of cutting my hair short. This app showed me exactly how a bob cut would frame my face. I did it, and I've never felt more confident!"
    },
    {
      name: "Rahul Verma",
      role: "Software Engineer, Bangalore",
      content: "The beard styling advice for my jawline was a game changer. It's not just about the hair on top, the whole package matters. Highly recommend."
    },
    {
      name: "Ananya Patel",
      role: "Student, Delhi",
      content: "Used this before my cousin's wedding to decide on a style. The visualization is so realistic, my stylist knew exactly what to do."
    }
  ];

  const faqs = [
    {
      q: "How accurate is the AI analysis?",
      a: "We use Gemini 2.5 Flash, Google's state-of-the-art vision model. It maps 400+ facial landmarks to determine your face shape to define suggestions with >98% accuracy compared to professional stylists."
    },
    {
      q: "I have long hair. Can I really visualize short styles?",
      a: "Absolutely! Our AI is specifically trained for female styling transformations. It can digitally 'tuck' or remove length to show you exactly how a Bob, Pixie, or Shoulder-length cut would look on you, without you actually cutting a single strand."
    },
    {
      q: "Can I cancel my subscription anytime?",
      a: "Yes, our plans are monthly subscriptions. You can cancel anytime from your account settings, and your credits will remain valid until the end of the billing cycle."
    },
    {
      q: "Is my photo stored on your servers?",
      a: "Privacy is paramount. Your photos are processed in ephemeral memory for the duration of your session and are automatically deleted. We do not use your photos to train our models."
    },
    {
      q: "Can I try it for free?",
      a: "Yes! Face shape analysis is always free. You only pay for the HD hairstyle renders you want to generate."
    },
    {
      q: "Do you support men's styles?",
      a: "Absolutely. We have a dedicated model for men's grooming that includes hairstyles, beard types, and facial hair integration."
    }
  ];

  return (
    <div className="overflow-x-hidden">
      {/* Gender Selection Popup */}
      {showGenderPopup && <GenderSelectionPopup onSelect={handleGenderSelect} />}

      {/* Payment Result Modal */}
      {paymentModal.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handlePaymentModalClose}></div>
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-800 p-8 animate-scale-in">
            {/* Icon */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${paymentModal.success
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-red-100 dark:bg-red-900/30'}`}>
              {paymentModal.success ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-green-600 dark:text-green-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-red-600 dark:text-red-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            {/* Title */}
            <h3 className={`text-2xl font-bold text-center mb-3 ${paymentModal.success
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'}`}>
              {paymentModal.success ? 'Payment Successful!' : 'Payment Failed'}
            </h3>

            {/* Message */}
            <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
              {paymentModal.message}
            </p>

            {/* Button */}
            <button
              onClick={handlePaymentModalClose}
              className={`w-full py-3 font-bold rounded-xl transition-all ${paymentModal.success
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900'}`}
            >
              {paymentModal.success ? 'Great, Refresh Now!' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* --- HERO SECTION --- */}
      <section
        className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-slate-50 dark:bg-neutral-950 transition-colors duration-500"
        onMouseMove={handleHeroMouseMove}
      >
        {/* Spotlight Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] bg-brand-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-float opacity-60"></div>
          <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-float opacity-60" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-0 left-0 w-full h-[50%] bg-gradient-to-t from-brand-900/10 to-transparent"></div>

          {/* Grid Overlay with Spotlight */}
          <div
            className="absolute inset-0 opacity-30 dark:opacity-20 transition-opacity duration-300"
            style={{
              backgroundImage: `linear-gradient(to right, #80808012 1px, transparent 1px), linear-gradient(to bottom, #80808012 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
              maskImage: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, black, transparent)`
            }}
          ></div>
        </div>

        {/* Main Hero Content (Centered) */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 flex flex-col items-center text-center flex-grow justify-start md:justify-center pt-32 pb-12 md:py-32">

          {/* Launch Offer Badge */}
          <div
            onClick={() => user ? onNavigate('APP') : onStart()}
            className="group cursor-pointer mb-8 md:mb-10 animate-fade-in hover:-translate-y-1 transition-transform duration-300 max-w-full"
          >
            {/* Glowing Pill Wrapper */}
            <div className="relative p-[2px] rounded-full overflow-hidden">
              {/* Animated Gradient Border */}
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400 via-purple-500 to-brand-400 bg-[length:200%_100%] animate-gradient-x"></div>

              {/* Inner Content - ENHANCED SPACIOUS LAYOUT (Mobile Adjusted) */}
              <div className="relative bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-full px-2 py-1 md:pl-2 md:pr-6 md:py-2 flex items-center gap-2 md:gap-4 shadow-xl border border-white/20">

                {/* Badge */}
                <div className="bg-gradient-to-br from-brand-500 to-purple-600 text-white text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 md:px-4 md:py-1.5 rounded-full shadow-lg flex items-center gap-1.5 shrink-0">
                  <span className="animate-pulse text-yellow-300">⚡</span>
                  Limited Offer
                </div>

                {/* Text Content */}
                <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                  <span className="hidden md:inline text-slate-600 dark:text-slate-300 font-semibold">Get Premium Access</span>

                  {/* Separator */}
                  <div className="hidden md:block w-px h-4 bg-slate-200 dark:bg-neutral-700"></div>

                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-slate-400 line-through text-[10px] md:text-xs font-medium">₹69</span>
                      <span className="text-brand-600 dark:text-brand-400 font-bold text-lg md:text-xl">₹49</span>
                    </div>
                    <span className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 text-[10px] font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-md border border-green-200 dark:border-green-500/30">
                      SAVE 30%
                    </span>
                  </div>
                </div>

                {/* Arrow Divider */}
                <div className="hidden sm:block pl-2 border-l border-slate-200 dark:border-neutral-700 h-5"></div>

                {/* Arrow */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5 text-brand-500 group-hover:translate-x-1 transition-transform hidden sm:block">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </div>
          </div>

          {/* Main Headline with Smoother Typewriter - Layout Fixed for Mobile Jitter */}
          <h1 className="animate-fade-in text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 sm:mb-8 leading-tight sm:leading-[1.1] drop-shadow-sm px-2 flex flex-col items-center">
            <span className="block mb-1 sm:mb-0">Don't Just Change Hair.</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-blue-600 min-h-[1.1em] sm:min-h-0">
              Reveal Your <br className="sm:hidden" />
              <span className="inline-block">
                {text}<span className="animate-pulse text-brand-500 ml-1">|</span>
              </span>
            </span>
          </h1>

          <p className="animate-fade-in text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10 md:mb-12 leading-relaxed font-light px-4">
            A bad haircut takes months to fix. A perfect style changes how the world sees you instantly.
            Unlock the best version of yourself with AI-powered precision, risk-free.
          </p>

          <div className="animate-fade-in flex flex-col sm:flex-row items-center gap-4 w-full justify-center px-4 mb-8 md:mb-0">
            <button
              onClick={() => user ? onNavigate('APP') : onStart()}
              className="px-8 py-4 md:px-10 md:py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-lg font-bold rounded-xl shadow-xl shadow-brand-500/20 hover:shadow-brand-500/40 transition-all hover:-translate-y-1 flex items-center gap-3 w-full sm:w-auto justify-center min-w-[240px]"
            >
              {user ? 'Go to Dashboard' : 'Start Your Transformation'}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Social Proof Bar - Centered & Unified */}
        <div className="relative z-10 w-full border-t border-slate-200 dark:border-white/10 bg-white/30 dark:bg-black/30 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 flex justify-center">
            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 justify-center transform transition-transform">
              <div className="flex -space-x-4">
                {(selectedGender === 'female'
                  ? [25, 26, 27, 28] // Women avatar IDs
                  : [11, 12, 13, 14] // Men avatar IDs
                ).map((avatarId, i) => (
                  <img key={i} src={`https://i.pravatar.cc/100?img=${avatarId}`} alt="User" className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-white dark:border-neutral-900 shadow-sm" />
                ))}
              </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1">
                  <span className="font-bold text-slate-900 dark:text-white text-lg md:text-xl">50,000+</span>
                  <span className="text-yellow-500 text-lg">★★★★★</span>
                </div>
                <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 font-medium">Happy users styling today</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 md:py-32 bg-slate-50 dark:bg-neutral-950 border-t border-slate-100 dark:border-neutral-800 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <RevealOnScroll>
            <div className="text-center mb-16 md:mb-20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-bold uppercase tracking-wider mb-4 border border-brand-200 dark:border-brand-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                </span>
                Simple Process
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 dark:text-white mb-6">
                From Selfie to <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-blue-600">Style Icon</span>
              </h2>
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Three simple steps to visualize your perfect look without touching a pair of scissors.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* LEFT COLUMN: Steps */}
            <div className="relative flex flex-col gap-10 md:gap-12 pl-4 md:pl-0 order-2 lg:order-1">
              {[
                { step: "01", title: "Upload Photo", desc: "Take a quick selfie or upload a clear photo. Our secure system processes it instantly.", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>, color: "from-blue-400 to-blue-600", shadow: "shadow-blue-500/30" },
                { step: "02", title: "AI Analysis", desc: "We map 400+ facial points to detect your face shape and suggest matching styles.", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" /></svg>, color: "from-purple-400 to-purple-600", shadow: "shadow-purple-500/30" },
                { step: "03", title: "Transform", desc: "Generate high-definition previews of any haircut on your own face in seconds.", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" /></svg>, color: "from-brand-400 to-brand-600", shadow: "shadow-brand-500/30" }
              ].map((item, idx) => (
                <RevealOnScroll key={idx} delay={idx * 200}>
                  <div className="relative z-10 flex items-start text-left group">
                    <div className={`relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg ${item.shadow} transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300`}>
                      {item.icon}
                      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white dark:bg-neutral-800 border-2 border-slate-100 dark:border-neutral-700 flex items-center justify-center text-xs font-bold text-slate-900 dark:text-white shadow-sm">
                        {item.step}
                      </div>
                    </div>
                    <div className="ml-6 md:ml-8">
                      <h3 className="text-xl md:text-2xl font-heading font-bold text-slate-900 dark:text-white mb-2 md:mb-3 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm md:text-base">{item.desc}</p>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>

            {/* RIGHT COLUMN: Interactive Before/After Demo */}
            <div className="order-1 lg:order-2 relative w-full flex items-center justify-center">
              <div className="absolute top-0 right-0 w-72 h-72 bg-brand-400/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              <BeforeAfterDemo gender={selectedGender} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50 dark:bg-neutral-950 relative">
        <div className="max-w-7xl mx-auto px-4">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 dark:text-white mb-4">Why Choose HairstyleAI?</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Professional grade styling tools accessible to everyone.</p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: "✨", title: "Smart Analysis", desc: "AI precisely identifies your face shape to suggest flattering cuts.", color: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" },
              { icon: "⚡", title: "Instant Visuals", desc: "See yourself with a new haircut in seconds. No more guessing.", color: "bg-brand-100 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400" },
              { icon: "🎯", title: "Gender Specific", desc: "Tailored advice for everyone. Beards for men, styling for women.", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" },
              { icon: "💎", title: "Hyper-Realistic", desc: "Cinema-grade lighting and texture rendering for results that look real, not fake.", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" },
              { icon: "🔒", title: "Bank-Grade Privacy", desc: "Your photos are processed in ephemeral memory and deleted instantly after use.", color: "bg-teal-100 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400" },
              { icon: "🔥", title: "Always Trending", desc: "Our style library updates weekly with the latest celebrity and runway cuts.", color: "bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400" }
            ].map((feature, idx) => (
              <RevealOnScroll key={idx} delay={idx * 100}>
                <div className="group h-full p-8 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-brand-900/10 transition-all duration-300 hover:-translate-y-2 cursor-default">
                  <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-sm`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-3 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">{feature.desc}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* NEW: EMOTIONAL FREE TOOL TEASER SECTION (Moved after Features) */}
      <section className="py-24 bg-white dark:bg-neutral-900 border-t border-slate-200 dark:border-neutral-800 relative overflow-hidden">
        {/* Abstract geometric background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-0 w-96 h-96 border-[40px] border-brand-500 rounded-full blur-3xl transform -translate-x-1/2"></div>
          <div className="absolute bottom-1/4 right-0 w-96 h-96 border-[40px] border-blue-500 rounded-full blur-3xl transform translate-x-1/2"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <RevealOnScroll>
            {/* Updated Card Styling for Light/Dark Mode Compatibility */}
            <div className="bg-slate-50 dark:bg-black rounded-[3rem] p-8 md:p-16 text-center shadow-2xl overflow-hidden relative border border-slate-200 dark:border-neutral-800">
              {/* Decorative geometric shapes */}
              <div className="absolute top-10 left-10 w-20 h-20 border-2 border-slate-200 dark:border-white/10 rounded-full"></div>
              <div className="absolute bottom-10 right-10 w-20 h-20 border-2 border-slate-200 dark:border-white/10 rotate-45"></div>

              <span className="inline-block px-4 py-1.5 rounded-full bg-brand-100 dark:bg-white/10 text-brand-700 dark:text-white text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-md border border-brand-200 dark:border-white/10">
                Discover Your Real Self
              </span>

              <h2 className="text-4xl md:text-6xl font-heading font-extrabold text-slate-900 dark:text-white mb-6 leading-tight">
                Do you really know your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-blue-600 dark:from-brand-400 dark:to-blue-400">Facial Geometry?</span>
              </h2>

              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
                Most people guess their face shape wrong, leading to years of unflattering haircuts.
                Stop guessing. Use our scientific AI detector to reveal your true structure—for free.
              </p>

              <button
                onClick={() => onNavigate('FREE_FACE_SHAPE')}
                className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-lg rounded-2xl shadow-xl shadow-brand-500/10 dark:shadow-white/10 hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 mx-auto group"
              >
                Check My Face Shape
                <span className="bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded ml-1">Free</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-slate-50 dark:bg-neutral-900/30 border-y border-slate-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <div className="inline-block px-3 py-1 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold uppercase tracking-wider mb-4">
                Success Stories
              </div>
              <h2 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 dark:text-white mb-4">Loved by India</h2>
              <p className="text-slate-600 dark:text-slate-400">See how others found their perfect look.</p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <RevealOnScroll key={i} delay={i * 150}>
                <div className="group rounded-3xl h-full p-1 bg-gradient-to-br from-white to-slate-100 dark:from-neutral-800 dark:to-neutral-900 border border-slate-200 dark:border-neutral-800 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl hover:shadow-brand-900/10 dark:hover:shadow-brand-500/5 cursor-default">
                  <div className="bg-white dark:bg-neutral-900 p-8 rounded-[20px] h-full flex flex-col relative overflow-hidden transition-all duration-300 group-hover:bg-gradient-to-br from-white to-brand-50/30 dark:from-neutral-900 dark:to-brand-900/10">
                    <div className="absolute top-4 right-6 text-9xl font-serif text-slate-100 dark:text-neutral-800 leading-none select-none group-hover:text-brand-50 dark:group-hover:text-brand-900/10 transition-colors duration-500">”</div>
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-center gap-1 text-yellow-400 mb-6">
                        {[1, 2, 3, 4, 5].map(star => (
                          <svg key={star} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 transform group-hover:scale-110 transition-transform" style={{ transitionDelay: `${star * 50}ms` }}>
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-lg text-slate-700 dark:text-slate-300 italic mb-8 flex-grow leading-relaxed font-medium opacity-90 group-hover:opacity-100 transition-opacity">"{t.content}"</p>
                      <div className="flex items-center gap-4 mt-auto border-t border-slate-100 dark:border-neutral-800 pt-4 group-hover:border-brand-200 dark:group-hover:border-brand-800/30 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-100 to-blue-100 dark:from-brand-900 dark:to-blue-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-lg shadow-sm group-hover:scale-110 transition-transform">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{t.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t.role}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => onNavigate('SUCCESS_STORIES')}
              className="px-8 py-4 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-neutral-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto group"
            >
              <span>View More Stories</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* NEW BENEFITS SECTION */}
      <section className="py-24 bg-white dark:bg-neutral-900 border-y border-slate-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4">
          <RevealOnScroll>
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 dark:text-white mb-6">
                More Than Just a <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-blue-600">Filter</span>
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                Experience the tangible benefits of AI-powered grooming decisions.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <RevealOnScroll delay={100}>
              <div className="relative group overflow-hidden rounded-3xl h-[400px]">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-black z-10 opacity-60 transition-opacity group-hover:opacity-40"></div>
                <img src={selectedGender === 'female'
                  ? "https://images.unsplash.com/photo-1488716820095-cbe80883c496?auto=format&fit=crop&w=800&q=80"
                  : "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80"
                } alt="Confidence" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="relative z-20 p-8 h-full flex flex-col justify-end">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-4 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Eliminate Regret</h3>
                  <p className="text-slate-200">Stop paying for haircuts you hate. Visualize the result before committing your wallet.</p>
                </div>
              </div>
            </RevealOnScroll>

            {/* Benefit 2 */}
            <RevealOnScroll delay={200}>
              <div className="relative group overflow-hidden rounded-3xl h-[400px]">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-900 to-slate-900 z-10 opacity-60 transition-opacity group-hover:opacity-40"></div>
                <img src={selectedGender === 'female'
                  ? "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80"
                  : "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=800&q=80"
                } alt="Communication" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="relative z-20 p-8 h-full flex flex-col justify-end">
                  <div className="w-12 h-12 bg-brand-500/30 backdrop-blur-md rounded-xl flex items-center justify-center mb-4 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Perfect Communication</h3>
                  <p className="text-slate-200">No more vague descriptions. Show your stylist exactly what to want.</p>
                </div>
              </div>
            </RevealOnScroll>

            {/* Benefit 3 */}
            <RevealOnScroll delay={300}>
              <div className="relative group overflow-hidden rounded-3xl h-[400px]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-slate-900 z-10 opacity-60 transition-opacity group-hover:opacity-40"></div>
                <img src={selectedGender === 'female'
                  ? "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80"
                  : "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80"
                } alt="Confidence" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="relative z-20 p-8 h-full flex flex-col justify-end">
                  <div className="w-12 h-12 bg-blue-500/30 backdrop-blur-md rounded-xl flex items-center justify-center mb-4 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Ultimate Confidence</h3>
                  <p className="text-slate-200">Walk into any room knowing your style perfectly complements your face.</p>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Pricing Section - ENHANCED */}
      <section id="pricing" className="py-24 relative overflow-hidden bg-slate-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <RevealOnScroll>
            <div className="text-center mb-12">
              <div className="inline-block px-4 py-1.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-xs font-bold uppercase tracking-wider mb-6 animate-pulse border border-brand-200 dark:border-brand-500/20">
                Limited-Time Launch Pricing — Save up to 30%
              </div>
              <h2 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 dark:text-white mb-6">
                Simple Pricing, Instant Style
              </h2>

              {/* Billing Toggle */}
              <div className="flex justify-center mb-8">
                <div className="bg-white dark:bg-neutral-900 p-1.5 rounded-full border border-slate-200 dark:border-neutral-800 flex items-center relative shadow-sm">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white shadow-md bg-slate-100 dark:bg-neutral-800' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${billingCycle === 'yearly' ? 'text-slate-900 dark:text-white shadow-md bg-slate-100 dark:bg-neutral-800' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    Yearly
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] uppercase rounded-full border border-green-200 dark:border-green-900/50">
                      Save 20%
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-2 text-lg text-slate-600 dark:text-slate-400">
                <p>Face Shape Detection is always <span className="font-bold text-brand-600 dark:text-brand-400">FREE</span></p>
                <p className="text-sm text-slate-500 dark:text-slate-500">HD hairstyle renders — No watermark — Share anywhere</p>
              </div>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 justify-center">
            {pricingPlans.map((plan, idx) => {
              const isMonthly = billingCycle === 'monthly';
              const currentPlan = isMonthly ? plan.monthly : plan.yearly;
              const price = currentPlan.price;
              const renders = currentPlan.renders;

              // Calculate Monthly Savings Display
              let monthlySavings = 0;
              if (isMonthly && plan.monthly.mrp) {
                const priceNum = parsePrice(plan.monthly.price);
                const mrpNum = parsePrice(plan.monthly.mrp);
                monthlySavings = mrpNum - priceNum;
              }

              return (
                <RevealOnScroll key={idx} delay={idx * 100} className="h-full">
                  <div className={`relative w-full flex flex-col bg-white dark:bg-neutral-900 rounded-3xl p-8 border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl h-full group
                  ${plan.highlight
                      ? 'border-brand-500 ring-4 ring-brand-500/10 shadow-xl shadow-brand-500/10 scale-105 z-10'
                      : 'border-slate-200 dark:border-neutral-800 hover:border-brand-500/50'
                    }`}>

                    {plan.highlight && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-brand-600 to-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg whitespace-nowrap z-20">
                        {plan.tag}
                      </div>
                    )}

                    {!plan.highlight && plan.tag && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-neutral-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm whitespace-nowrap z-20">
                        {plan.tag}
                      </div>
                    )}

                    <div className="mb-4 mt-4 text-center">
                      <h3 className={`text-2xl font-bold mb-1 ${plan.highlight ? 'text-brand-600 dark:text-brand-400' : 'text-slate-900 dark:text-white'}`}>
                        {plan.name}
                      </h3>
                    </div>

                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="text-4xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">{price}</span>
                        <span className="text-slate-500 font-medium text-sm self-end mb-1.5">/{isMonthly ? 'mo' : 'yr'}</span>
                      </div>

                      {isMonthly && plan.monthly.mrp && (
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-sm text-slate-400 line-through">MRP {plan.monthly.mrp}</p>
                          {monthlySavings > 0 && (
                            <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md">
                              Save ₹{monthlySavings}
                            </span>
                          )}
                        </div>
                      )}

                      {!isMonthly && plan.yearly.savings && (
                        <p className="inline-block text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">
                          Save {plan.yearly.savings}
                        </p>
                      )}
                    </div>

                    <div className="mb-6 p-4 bg-slate-50 dark:bg-neutral-800/50 rounded-xl border border-slate-100 dark:border-neutral-800 text-center">
                      <p className="font-bold text-slate-800 dark:text-white text-lg">
                        {renders} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">HD Renders</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{isMonthly ? 'per month' : 'per year'}</p>
                    </div>

                    <ul className="space-y-3 mb-8 flex-grow">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                          <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.id === 'basic' && plan.subCopy && (
                      <p className="text-xs text-slate-400 text-center mb-4 italic">{plan.subCopy}</p>
                    )}

                    <div className="mt-auto">
                      {(() => {
                        const isCurrentPlan = userPlan && userPlan.toLowerCase() === plan.id.toLowerCase();
                        const hasPaidPlan = userPlan && userPlan !== 'free';

                        // Determine button text
                        let buttonText = 'Get Started';
                        if (user) {
                          if (isCurrentPlan) {
                            buttonText = 'Current Plan';
                          } else if (hasPaidPlan) {
                            buttonText = 'Upgrade Plan';
                          } else {
                            buttonText = 'Buy Plan';
                          }
                        }

                        return (
                          <button
                            onClick={() => handlePlanSelect(plan.id)}
                            disabled={!!isCurrentPlan}
                            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg
                            ${isCurrentPlan
                                ? 'bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border-2 border-slate-200 dark:border-neutral-700'
                                : plan.highlight
                                  ? 'bg-gradient-to-r from-brand-600 to-blue-600 text-white hover:from-brand-500 hover:to-blue-500 shadow-brand-500/25 hover:shadow-brand-500/40 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]'
                                  : 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-neutral-700 hover:border-brand-500 hover:text-brand-600 dark:hover:text-white group-hover:border-brand-500/50 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]'
                              }`}
                          >
                            {buttonText}
                          </button>
                        );
                      })()}

                      {plan.highlight && (
                        <p className="text-xs text-center text-brand-600 dark:text-brand-400 mt-3 font-medium opacity-80">Most people choose Popular</p>
                      )}
                    </div>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              Secure Payment via UPI, Cards & NetBanking
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section with ID */}
      <section id="faq" className="py-24 bg-slate-50 dark:bg-neutral-900/30 border-t border-slate-200 dark:border-neutral-800">
        <div className="max-w-3xl mx-auto px-4">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h2>
              <p className="text-slate-600 dark:text-slate-400">Everything you need to know.</p>
            </div>
          </RevealOnScroll>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <RevealOnScroll key={idx} delay={idx * 50}>
                <div className={`bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl overflow-hidden transition-all duration-300 ${openFaq === idx ? 'ring-2 ring-brand-500/20 border-brand-500' : 'hover:border-brand-500/30'}`}>
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className={`w-5 h-5 text-brand-500 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <div className="px-6 pb-6 text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-neutral-800 pt-4 bg-slate-50/50 dark:bg-neutral-900">
                      {faq.a}
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - ENHANCED & THEME AWARE */}
      <section className="py-24 md:py-32 relative overflow-hidden bg-slate-50 dark:bg-black transition-colors duration-500">
        {/* Backgrounds */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Holographic background - Adapted for Light/Dark */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-100/40 via-transparent to-blue-100/40 dark:from-brand-900/40 dark:via-black dark:to-blue-900/40 animate-gradient bg-400%"></div>
          {/* Radial fade - Adapted */}
          <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <RevealOnScroll>
            <div className="p-1 rounded-[2.5rem] md:rounded-[3rem] bg-gradient-to-b from-slate-200/60 to-transparent dark:from-white/10 dark:to-transparent border border-white/40 dark:border-white/10 backdrop-blur-md">
              <div className="bg-white/60 dark:bg-neutral-950/80 backdrop-blur-xl rounded-[2.3rem] md:rounded-[2.8rem] p-8 md:p-24 border border-white/40 dark:border-white/5 shadow-2xl shadow-brand-500/5 dark:shadow-brand-500/10 relative overflow-hidden">

                {/* Floating Elements - adjust opacity for light mode */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500/10 dark:bg-brand-500/20 rounded-full blur-[80px]"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[80px]"></div>

                <h2 className="text-4xl md:text-7xl font-heading font-extrabold text-slate-900 dark:text-white mb-6 drop-shadow-sm dark:drop-shadow-2xl tracking-tight">
                  Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-blue-600 dark:from-brand-400 dark:to-blue-400">Reinvent Yourself?</span>
                </h2>
                <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed">
                  Don't settle for a haircut that "might" look good. See the future of your style today with just one photo.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
                  <button
                    onClick={() => user ? onNavigate('APP') : onStart()}
                    className="group relative w-full sm:w-auto px-8 py-4 md:px-10 md:py-5 bg-slate-900 dark:bg-white text-white dark:text-black text-lg md:text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 hover:scale-105 overflow-hidden min-w-[200px]"
                  >
                    <span className="relative z-20">{user ? 'Go to Dashboard' : 'Start Free Trial'}</span>
                  </button>
                  <button
                    onClick={() => {
                      const el = document.getElementById('features');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto px-8 py-4 md:px-10 md:py-5 bg-transparent border-2 border-slate-200 dark:border-white/20 text-slate-900 dark:text-white text-lg md:text-xl font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all min-w-[200px]"
                  >
                    Explore Features
                  </button>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  );
};
