
import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="animate-fade-in pb-20 pt-28 md:pt-40">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-extrabold text-slate-900 dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Last Updated: October 24, 2024</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-neutral-800 space-y-8 text-slate-600 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-4">1. Introduction</h2>
            <p>
              Welcome to HairstyleAI ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our website and with our products and services. This Privacy Policy applies to our website and virtual hairstyling services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-4">2. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Personal Information:</strong> Name, email address, and account credentials when you sign up.</li>
              <li><strong>User Content:</strong> Photos you upload for processing. <strong>Note:</strong> We do not store your original photos permanently. They are processed in memory and deleted shortly after the session ends, unless you explicitly save them to your profile.</li>
              <li><strong>Usage Data:</strong> Information on how you interact with the service, such as styles generated and features used.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-4">3. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Provide and improve our AI hairstyling services.</li>
              <li>Process your images using Google Gemini API (third-party processor).</li>
              <li>Communicate with you about updates, security alerts, and support.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-4">4. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure. We prioritize the ephemeral processing of sensitive biometric data (your face photos) to minimize risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-4">5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at <a href="#" className="text-brand-600 dark:text-brand-400 font-bold">privacy@hairstyleai.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
