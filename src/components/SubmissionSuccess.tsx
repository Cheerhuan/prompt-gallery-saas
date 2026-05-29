'use client';
import React from 'react';

interface SubmissionSuccessProps {
  issueNumber: number;
  issueUrl: string;
  title: string;
  onClose: () => void;
}

export const SubmissionSuccess = ({ title, onClose }: SubmissionSuccessProps) => {
  const shareOnX = () => {
    const text = encodeURIComponent(
      `I just submitted "${title}" to Prompt Gallery! 🎨✨\n\nCheck it out: https://cheerhuan.github.io/prompt-gallery-saas/`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'width=600,height=400');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative glass-panel rounded-2xl p-8 max-w-md w-full text-center animate-fade-up">
        {/* Success icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-white mb-2">Prompt Submitted! 🎉</h3>
        <p className="text-sm text-zinc-400 mb-6">
          Your prompt <span className="text-white font-medium">"{title}"</span> has been submitted for review.
          <br />
          <span className="text-emerald-500/80 text-xs">✓ Stored securely &amp; pending admin approval</span>
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={shareOnX}
            className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition-all flex items-center justify-center gap-2 border border-zinc-700"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X (Twitter)
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
          >
            Continue browsing
          </button>
        </div>
      </div>
    </div>
  );
};
