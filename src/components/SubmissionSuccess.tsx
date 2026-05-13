'use client';
import React from 'react';

interface SubmissionSuccessProps {
  issueNumber: number;
  issueUrl: string;
  title: string;
  onClose: () => void;
}

export const SubmissionSuccess = ({ issueNumber, issueUrl, title, onClose }: SubmissionSuccessProps) => {
  const shareOnX = () => {
    const text = encodeURIComponent(
      `I just submitted "${title}" to Prompt Gallery! 🎨✨\n\nCheck it out: ${issueUrl}`
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
        <p className="text-sm text-zinc-400 mb-1">
          Your prompt <span className="text-white font-medium">"{title}"</span> has been submitted for review.
        </p>
        <p className="text-xs text-emerald-500/80 mb-6">
          ✓ Submitted as Issue #{issueNumber}
        </p>

        <div className="flex flex-col gap-3">
          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            View on GitHub
          </a>

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
