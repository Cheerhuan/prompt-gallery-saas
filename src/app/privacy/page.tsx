import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <Link href="/" className="text-xs text-zinc-500 hover:text-white transition-colors mb-8 inline-block">← Back to Gallery</Link>

        <h1 className="text-4xl font-extrabold tracking-tighter mt-8 mb-2">Privacy Policy</h1>
        <p className="text-xs text-zinc-500 font-mono mb-12">Last updated: May 28, 2026</p>

        <div className="space-y-10 text-sm leading-relaxed text-zinc-300">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Information We Collect</h2>
            <p>Prompt Gallery is a static website hosted on GitHub Pages. We collect minimal data:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-zinc-400">
              <li><strong className="text-zinc-200">Anonymous analytics</strong> via Plausible — page views, referrer, device type. No cookies, no personal data. See <a href="https://plausible.io/data-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Plausible Data Policy</a>.</li>
              <li><strong className="text-zinc-200">Local storage</strong> — saved prompts, likes, and view counts are stored in your browser&apos;s localStorage only. This data never leaves your device.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. No Cookies</h2>
            <p>We do not use tracking cookies, fingerprinting, or any cross-site tracking mechanisms. Plausible is cookie-less by design.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. No Account Required</h2>
            <p>Prompt Gallery does not require registration. Any &ldquo;authentication&rdquo; features (saving, liking) use a demo mode that stores data in your browser&apos;s localStorage only. No data is transmitted to any server.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Third-Party Services</h2>
            <p>The following third-party services are used:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-zinc-400">
              <li><strong className="text-zinc-200">GitHub Pages</strong> — static hosting. See <a href="https://docs.github.com/en/site-policy/privacy-policies" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">GitHub Privacy Statement</a>.</li>
              <li><strong className="text-zinc-200">Plausible</strong> — privacy-first analytics (self-hosted or cloud). No personal data collected.</li>
              <li><strong className="text-zinc-200">Pexels</strong> — reference images used under the <a href="https://www.pexels.com/license/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Pexels License</a>.</li>
              <li><strong className="text-zinc-200">Google Fonts</strong> — Inter and Plus Jakarta Sans typefaces. May log requests per <a href="https://developers.google.com/fonts/faq/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Google Fonts Privacy</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Data Retention</h2>
            <p>All user data (saved prompts, likes) is stored exclusively in your browser&apos;s localStorage. Clearing your browser data will remove this information. We do not maintain any serverside databases.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Your Rights</h2>
            <p>Since we collect no personal data, there is nothing to access, correct, or delete on our end. You can clear your localStorage at any time through your browser settings.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Changes to This Policy</h2>
            <p>Updates will be reflected on this page. The &ldquo;Last updated&rdquo; date at the top indicates when changes were made.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Contact</h2>
            <p>For privacy-related questions, open an issue on our <a href="https://github.com/Cheerhuan/prompt-gallery-saas" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">GitHub repository</a>.</p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-zinc-800 text-xs text-zinc-600">
          <Link href="/" className="text-indigo-400 hover:underline">← Return to Prompt Gallery</Link>
        </div>
      </div>
    </div>
  );
}
