import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <Link href="/" className="text-xs text-zinc-500 hover:text-white transition-colors mb-8 inline-block">← Back to Gallery</Link>

        <h1 className="text-4xl font-extrabold tracking-tighter mt-8 mb-2">Terms of Service</h1>
        <p className="text-xs text-zinc-500 font-mono mb-12">Last updated: May 28, 2026</p>

        <div className="space-y-10 text-sm leading-relaxed text-zinc-300">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Prompt Gallery ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Description of Service</h2>
            <p>Prompt Gallery is a curated repository of AI prompts with reference images. The Service provides discovery, browsing, and sharing of prompt engineering patterns. All content is provided for informational and creative reference purposes only.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. User Content & Submissions</h2>
            <p>Users may submit prompts for inclusion in the gallery. By submitting content, you grant Prompt Gallery a worldwide, non-exclusive, royalty-free license to display, distribute, and archive the submitted prompt and associated metadata. You represent that your submission does not infringe any third-party rights.</p>
            <p className="mt-3">Prompt Gallery reserves the right to review, edit, or remove any submission at its sole discretion.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Intellectual Property</h2>
            <p>The Prompt Gallery platform, including its codebase (available on GitHub), design, and compilation of prompts, is open source under the MIT License. Individual prompts may retain their original authorship attribution as noted on each card.</p>
            <p className="mt-3">AI-generated reference images displayed alongside prompts are provided for demonstration purposes only and may be subject to the terms of their respective generation platforms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Disclaimer</h2>
            <p>The Service is provided "as is" without warranties of any kind. Prompt Gallery does not guarantee the accuracy, completeness, or usefulness of any prompt or reference image. Use of AI-generated content may be subject to the terms of third-party platforms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Limitation of Liability</h2>
            <p>Prompt Gallery shall not be liable for any indirect, incidental, or consequential damages arising from the use or inability to use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Changes to Terms</h2>
            <p>We reserve the right to update these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Contact</h2>
            <p>For questions about these terms, please open an issue on our <a href="https://github.com/Cheerhuan/prompt-gallery-saas" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">GitHub repository</a>.</p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-zinc-800 text-xs text-zinc-600">
          <Link href="/" className="text-indigo-400 hover:underline">← Return to Prompt Gallery</Link>
        </div>
      </div>
    </div>
  );
}
