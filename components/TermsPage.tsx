
import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="animate-fade-in pb-20 pt-28 md:pt-40">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-extrabold text-slate-900 dark:text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Last Updated: October 24, 2024</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-neutral-800 space-y-8 text-slate-600 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the HairstyleAI platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-4">2. Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials (information or software) on HairstyleAI's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-4">3. AI Generations</h2>
            <p>
              Our service uses artificial intelligence to generate images. You acknowledge that:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Generations may not always be 100% accurate or realistic.</li>
              <li>You must own the rights to any photo you upload.</li>
              <li>You will not upload offensive, illegal, or infringing content.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-4">4. Disclaimer</h2>
            <p>
              The materials on HairstyleAI's website are provided on an 'as is' basis. HairstyleAI makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-4">5. Limitations</h2>
            <p>
              In no event shall HairstyleAI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on HairstyleAI's website.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
