'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { SaaSNavbar } from '@/components/SaaSNavbar';
import { AuthModal } from '@/components/AuthModal';
import { SubmissionSuccess } from '@/components/SubmissionSuccess';

const GH_OWNER = 'Cheerhuan';
const GH_REPO = 'prompt-gallery-saas';
const GH_API = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/issues`;

const AI_MODELS = ['Midjourney', 'DALL-E', 'SDXL', 'GPT-Image', 'Other'] as const;

interface UserInfo {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
}

export default function SubmitPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [fullPrompt, setFullPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState('');
  const [aiModel, setAiModel] = useState('Midjourney');
  const [tags, setTags] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ issueNumber: number; issueUrl: string } | null>(null);

  // Listen for auth changes (same pattern as SaaSNavbar)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.user) {
        setUser({
          id: detail.user.id,
          email: detail.user.email,
          full_name: detail.user.user_metadata?.full_name || detail.user.user_metadata?.name || 'User',
          avatar_url: detail.user.user_metadata?.avatar_url || detail.user.user_metadata?.picture || '',
        });
      } else {
        setUser(null);
      }
    };
    window.addEventListener('supabase-auth-change', handler);

    // Restore from localStorage on mount
    try {
      const stored = localStorage.getItem('supabase-mock-user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
      }
    } catch {}

    return () => window.removeEventListener('supabase-auth-change', handler);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check auth
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Validate
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!fullPrompt.trim()) {
      setError('Full Prompt is required');
      return;
    }

    setSubmitting(true);

    try {
      const bodyPayload = JSON.stringify({
        prompt: {
          title: title.trim(),
          full_prompt: fullPrompt.trim(),
          reference_image: referenceImage.trim() || '',
          ai_model: aiModel,
          tags: tags
            .split(',')
            .map(t => t.trim())
            .filter(Boolean),
        },
        user: {
          id: user.id,
          name: user.full_name || 'Anonymous',
          email: user.email || '',
        },
        submitted_at: new Date().toISOString(),
      }, null, 2);

      const response = await fetch(GH_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[Submission] ${title.trim()}`,
          body: bodyPayload,
          labels: ['submission', 'pending-review'],
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`GitHub API error (${response.status}): ${errBody}`);
      }

      const issue = await response.json();

      // Reset form
      setTitle('');
      setFullPrompt('');
      setReferenceImage('');
      setAiModel('Midjourney');
      setTags('');

      // Show success
      setSuccess({
        issueNumber: issue.number,
        issueUrl: issue.html_url,
      });
    } catch (err: any) {
      console.error('Submit error:', err);
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [user, title, fullPrompt, referenceImage, aiModel, tags]);

  return (
    <div className="min-h-screen bg-black text-white">
      <SaaSNavbar />
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <main id="main-content" className="pt-32 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
              Submit a Prompt
            </h1>
            <p className="text-zinc-400 text-sm max-w-lg mx-auto">
              Share your best AI prompts with the community. 
              All submissions go through a review process before being published.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2 font-medium">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Neon Cyberpunk Portrait"
                className="w-full px-4 py-3 bg-black/50 border border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-600"
                disabled={submitting}
              />
            </div>

            {/* Full Prompt */}
            <div>
              <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2 font-medium">
                Full Prompt <span className="text-red-400">*</span>
              </label>
              <textarea
                value={fullPrompt}
                onChange={e => setFullPrompt(e.target.value)}
                placeholder="Paste your complete AI prompt here..."
                rows={6}
                className="w-full px-4 py-3 bg-black/50 border border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-600 resize-y min-h-[120px]"
                disabled={submitting}
              />
              <p className="text-[10px] text-zinc-600 mt-1">
                {fullPrompt.length} characters
              </p>
            </div>

            {/* Reference Image URL */}
            <div>
              <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2 font-medium">
                Reference Image URL <span className="text-zinc-600">(optional)</span>
              </label>
              <input
                type="url"
                value={referenceImage}
                onChange={e => setReferenceImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 bg-black/50 border border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-600"
                disabled={submitting}
              />
              {referenceImage && (
                <div className="mt-2 relative rounded-xl overflow-hidden border border-zinc-800 w-32 h-32">
                  <img
                    src={referenceImage}
                    alt="Reference preview"
                    className="w-full h-full object-cover"
                    onError={e => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%2318181b" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%2352525b" font-size="10">Invalid URL</text></svg>';
                    }}
                  />
                </div>
              )}
            </div>

            {/* AI Model + Tags row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2 font-medium">
                  AI Model <span className="text-zinc-600">(optional)</span>
                </label>
                <select
                  value={aiModel}
                  onChange={e => setAiModel(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                  disabled={submitting}
                >
                  {AI_MODELS.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2 font-medium">
                  Tags <span className="text-zinc-600">(optional)</span>
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="cinematic, portrait, neon"
                  className="w-full px-4 py-3 bg-black/50 border border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-600"
                  disabled={submitting}
                />
                <p className="text-[10px] text-zinc-600 mt-1">Separate with commas</p>
              </div>
            </div>

            {/* Creator info */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {user ? (user.full_name || 'U').charAt(0).toUpperCase() : '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-zinc-300 truncate">
                  {user ? user.full_name : 'Not signed in'}
                </div>
                <div className="text-[10px] text-zinc-500">
                  {user ? 'Signed in' : 'Sign in required to submit'}
                </div>
              </div>
              {!user && (
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting || !title.trim() || !fullPrompt.trim()}
              className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                  Submit for Review
                </>
              )}
            </button>

            <p className="text-[10px] text-zinc-600 text-center">
              Your prompt will be submitted as a GitHub Issue for review. 
              Once approved, it will be added to the gallery. ⏳
            </p>
          </form>
        </div>
      </main>

      {/* Success modal */}
      {success && (
        <SubmissionSuccess
          issueNumber={success.issueNumber}
          issueUrl={success.issueUrl}
          title={title || 'Untitled'}
          onClose={() => setSuccess(null)}
        />
      )}
    </div>
  );
}
