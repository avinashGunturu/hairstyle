
import React, { useState } from 'react';
import { AppView } from '../types';
import { supabase } from '../services/supabaseClient';

interface ContactPageProps {
   onNavigate: (view: AppView) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
   const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      topic: 'General Inquiry',
      message: ''
   });
   const [showSuccessModal, setShowSuccessModal] = useState(false);
   const [submittedData, setSubmittedData] = useState<any>(null);
   const [isSubmitting, setIsSubmitting] = useState(false);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
         // Get current user session if logged in
         const { data: { session } } = await supabase.auth.getSession();

         const contactMessage = {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            mobile: formData.mobile,
            topic: formData.topic,
            message: formData.message,
            user_id: session?.user?.id || null
         };

         const { error } = await supabase
            .from('contact_messages')
            .insert([contactMessage]);

         if (error) throw error;

         // Store submitted data for modal
         setSubmittedData(formData);
         setShowSuccessModal(true);

         // Reset form
         setFormData({
            firstName: '',
            lastName: '',
            email: '',
            mobile: '',
            topic: 'General Inquiry',
            message: ''
         });
      } catch (error) {
         console.error('Error submitting contact form:', error);
         alert('Failed to send message. Please try again.');
      } finally {
         setIsSubmitting(false);
      }
   };

   const inputClass = "w-full bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700 rounded-xl px-5 py-4 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 dark:text-white transition-all placeholder-slate-400 dark:placeholder-neutral-600 text-base";
   const labelClass = "block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mb-2 ml-1 tracking-wide";

   return (
      <div className="animate-fade-in pt-28 md:pt-40 pb-20 min-h-screen bg-slate-50 dark:bg-neutral-950">
         {/* Header */}
         <div className="max-w-7xl mx-auto px-4 mb-16 text-center">
            <h1 className="text-4xl md:text-6xl font-heading font-extrabold text-slate-900 dark:text-white mb-6">
               Let's Start a <br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-blue-600">Conversation</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
               We'd love to hear from you. Whether you have a question about features, pricing, or enterprise needs, our team is ready to answer all your questions.
            </p>
         </div>

         <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

               {/* Contact Info Column */}
               <div className="lg:col-span-5 space-y-8">
                  {/* Info Cards */}
                  <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
                     <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Contact Details</h3>

                     <div className="space-y-8">
                        <div className="flex items-start gap-5 group">
                           <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                              </svg>
                           </div>
                           <div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Email Us</p>
                              <p className="text-lg font-semibold text-slate-900 dark:text-white">support@hairstyleai.com</p>
                              <p className="text-sm text-slate-500 mt-1">Response time: &lt; 24 hours</p>
                           </div>
                        </div>

                        <div className="flex items-start gap-5 group">
                           <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                              </svg>
                           </div>
                           <div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Visit Us</p>
                              <p className="text-lg font-semibold text-slate-900 dark:text-white">Q city,Financial District</p>
                              <p className="text-sm text-slate-500 mt-1">500032, Hyderabad</p>
                           </div>
                        </div>

                        {/* <div className="flex items-start gap-5 group">
                           <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                              </svg>
                           </div>
                           <div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Call Us</p>
                              <p className="text-lg font-semibold text-slate-900 dark:text-white">+91 (800) 123-4567</p>
                              <p className="text-sm text-slate-500 mt-1">Mon-Fri, 9am - 6pm IST</p>
                           </div>
                        </div> */}
                     </div>
                  </div>

                  {/* Quick Help */}
                  <div className="p-8 rounded-3xl bg-gradient-to-br from-brand-500 to-blue-600 text-white shadow-lg">
                     <h3 className="text-xl font-bold mb-2">Need faster help?</h3>
                     <p className="text-brand-50 mb-6 text-sm">Check our frequently asked questions for instant answers.</p>
                     <button
                        onClick={() => {
                           onNavigate('LANDING');
                           // Give time for navigation then scroll to FAQ
                           setTimeout(() => {
                              const faqSection = document.getElementById('faq');
                              if (faqSection) {
                                 faqSection.scrollIntoView({ behavior: 'smooth' });
                              }
                           }, 100);
                        }}
                        className="w-full py-3 bg-white text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-colors"
                     >
                        View FAQ
                     </button>
                  </div>
               </div>

               {/* Form Column */}
               <div className="lg:col-span-7">
                  <div className="glass-panel p-1 rounded-[32px] shadow-2xl shadow-brand-900/5 h-full">
                     <form onSubmit={handleSubmit} className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-[28px] p-8 md:p-10 h-full">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Send a Message</h3>

                        <div className="space-y-6">
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <div>
                                 <label className={labelClass}>First Name</label>
                                 <input
                                    type="text"
                                    required
                                    className={inputClass}
                                    placeholder="e.g. Aditi"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                 />
                              </div>
                              <div>
                                 <label className={labelClass}>Last Name</label>
                                 <input
                                    type="text"
                                    required
                                    className={inputClass}
                                    placeholder="e.g. Rao"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                 />
                              </div>
                           </div>

                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <div>
                                 <label className={labelClass}>Email Address</label>
                                 <input
                                    type="email"
                                    required
                                    className={inputClass}
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                 />
                              </div>
                              <div>
                                 <label className={labelClass}>Mobile Number</label>
                                 <input
                                    type="tel"
                                    className={inputClass}
                                    placeholder="+91 98765 43210"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                 />
                              </div>
                           </div>

                           <div>
                              <label className={labelClass}>Topic</label>
                              <div className="relative">
                                 <select
                                    className={`${inputClass} appearance-none cursor-pointer`}
                                    value={formData.topic}
                                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                 >
                                    <option>General Inquiry</option>
                                    <option>Technical Support</option>
                                    <option>Billing & Subscriptions</option>
                                    <option>Partnership Opportunities</option>
                                 </select>
                                 <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                       <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                 </div>
                              </div>
                           </div>

                           <div>
                              <label className={labelClass}>Message</label>
                              <textarea
                                 rows={5}
                                 required
                                 className={`${inputClass} resize-none`}
                                 placeholder="Tell us how we can help..."
                                 value={formData.message}
                                 onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                              />
                           </div>

                           <button
                              type="submit"
                              disabled={isSubmitting}
                              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-4 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              {isSubmitting ? 'Sending...' : 'Send Message'}
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                              </svg>
                           </button>
                        </div>
                     </form>
                  </div>
               </div>

            </div>
         </div>

         {/* Success Modal */}
         {showSuccessModal && submittedData && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
               <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-neutral-800 animate-scale-in">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-green-600 dark:text-green-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 text-center">Message Received!</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
                     Thank you for reaching out! We've received your message and will get back to you shortly.
                  </p>

                  <div className="bg-slate-50 dark:bg-neutral-800 rounded-xl p-4 mb-6 space-y-2 text-sm">
                     <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Name:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{submittedData.firstName} {submittedData.lastName}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Email:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{submittedData.email}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Topic:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{submittedData.topic}</span>
                     </div>
                  </div>

                  <button
                     onClick={() => setShowSuccessModal(false)}
                     className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all"
                  >
                     Got it, thanks!
                  </button>
               </div>
            </div>
         )}
      </div>
   );
};
