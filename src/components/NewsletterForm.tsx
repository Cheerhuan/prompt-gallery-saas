'use client';

import React, { useState, FormEvent } from 'react';

const BUTTONDOWN_API = 'https://api.buttondown.email/v1/subscribers';
const BUTTONDOWN_PAGE = 'https://buttondown.com/prompt-gallery';

export const NewsletterForm = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Please enter a valid email address');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(BUTTONDOWN_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (res.ok || res.status === 201) {
        setStatus('success');
        setEmail('');
      } else {
        throw new Error('API request failed');
      }
    } catch {
      // API unavailable — fallback to redirect
      window.open(
        `${BUTTONDOWN_PAGE}?email=${encodeURIComponent(email)}`,
        '_blank',
        'noopener,noreferrer'
      );
      setStatus('success');
      setEmail('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      {status === 'success' ? (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium animate-fade-up">
          ✓ You&apos;re subscribed! Check your inbox for the best prompts.
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            aria-label="Email address for newsletter"
            disabled={status === 'loading'}
            className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            aria-label="Subscribe to newsletter"
            disabled={status === 'loading'}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold rounded-xl hover:from-indigo-400 hover:to-purple-500 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20 whitespace-nowrap"
          >
            {status === 'loading' ? 'Sending…' : 'Subscribe'}
          </button>
        </div>
      )}
      {status === 'error' && errorMsg && (
        <p className="mt-2 text-[11px] text-red-400 text-left">{errorMsg}</p>
      )}
      <p className="mt-3 text-[10px] text-zinc-600 text-center">
        No spam, ever. Unsubscribe anytime.{' '}
        <a
          href={BUTTONDOWN_PAGE}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 underline"
        >
          Via Buttondown
        </a>
      </p>
    </form>
  );
};
