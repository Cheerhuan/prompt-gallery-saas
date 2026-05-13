'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SaaSNavbar } from '@/components/SaaSNavbar';
import { PromptCard } from '@/components/PromptCard';
import { useI18n } from '@/components/I18nProvider';
import { getLikes } from '@/lib/likes';
import { getSavedIds } from '@/lib/vault';
import { getSubmissions } from '@/lib/submissions';
import promptsData from '@/data/prompts.json';
import { getCardTitle } from '@/lib/i18n';

interface UserInfo {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
}

export default function ProfilePage() {
  const { locale } = useI18n();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [likedIds, setLikedIds] = useState<(string | number)[]>([]);
  const [savedIds, setSavedIds] = useState<(string | number)[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    // Restore user from localStorage
    try {
      const stored = localStorage.getItem('supabase-mock-user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
      }
    } catch {}

    // Listen for auth changes
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

    // Sync liked / saved / submitted IDs
    const sync = () => {
      setLikedIds(getLikes());
      setSavedIds(getSavedIds());
      setSubmissions(getSubmissions());
    };
    sync();

    window.addEventListener('likes-change', sync);
    window.addEventListener('vault-change', sync);
    window.addEventListener('submissions-change', sync);

    return () => {
      window.removeEventListener('supabase-auth-change', handler);
      window.removeEventListener('likes-change', sync);
      window.removeEventListener('vault-change', sync);
      window.removeEventListener('submissions-change', sync);
    };
  }, []);

  const likedPrompts = promptsData
    .filter(p => p.image && p.image.trim() !== '' && likedIds.map(String).includes(String(p.id)))
    .reverse();

  const savedCount = savedIds.length;
  const submittedCount = submissions.length;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500/30">
      <SaaSNavbar />
      <main id="main-content" className="pt-36 pb-20 px-4 max-w-5xl mx-auto">
        {/* ── Profile Header ── */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center justify-center mb-6">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || 'User'}
                className="w-24 h-24 rounded-full object-cover ring-2 ring-indigo-500/30 ring-offset-2 ring-offset-black"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white ring-2 ring-indigo-500/30 ring-offset-2 ring-offset-black">
                {(user?.full_name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-2 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            {user?.full_name || 'Profile'}
          </h1>
          {user?.email && (
            <p className="text-zinc-400 text-sm">{user.email}</p>
          )}
          {!user && (
            <p className="text-zinc-500 text-sm mt-2">Sign in to see your profile stats.</p>
          )}
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-3 gap-4 mb-16 max-w-lg mx-auto">
          {/* Liked count */}
          <div className="glass-panel rounded-2xl p-5 text-center border border-zinc-800">
            <span className="text-2xl block mb-1">❤️</span>
            <div className="text-2xl font-bold text-white">{likedIds.length}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Liked</div>
          </div>
          {/* Saved count */}
          <div className="glass-panel rounded-2xl p-5 text-center border border-zinc-800">
            <span className="text-2xl block mb-1">💾</span>
            <div className="text-2xl font-bold text-white">{savedCount}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Saved</div>
          </div>
          {/* Submitted count */}
          <div className="glass-panel rounded-2xl p-5 text-center border border-zinc-800">
            <span className="text-2xl block mb-1">📝</span>
            <div className="text-2xl font-bold text-white">{submittedCount}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Submitted</div>
          </div>
        </div>

        {/* ── My Liked Prompts ── */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">❤️ My Liked Prompts</h2>
              <p className="text-zinc-500 text-sm mt-1">
                {likedPrompts.length > 0
                  ? `${likedPrompts.length} prompt${likedPrompts.length > 1 ? 's' : ''} you've liked.`
                  : 'Tap the heart icon on any prompt to add it here.'}
              </p>
            </div>
            <Link
              href="/saved"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
            >
              My Saved →
            </Link>
          </div>

          {likedPrompts.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-zinc-800">
              <span className="text-4xl block mb-3">💔</span>
              <p className="text-zinc-500 text-sm">No liked prompts yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {likedPrompts.slice(0, 8).map((item) => (
                <PromptCard
                  key={item.id}
                  id={item.id}
                  image={item.image}
                  title={getCardTitle(item.id, item.title, locale)}
                  tags={['High-Fidelity', 'Industrial']}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── My Saved Prompts ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">💾 My Saved Prompts</h2>
              <p className="text-zinc-500 text-sm mt-1">
                {savedCount > 0
                  ? `${savedCount} prompt${savedCount > 1 ? 's' : ''} in your vault.`
                  : 'Save prompts you love by tapping the bookmark icon.'}
              </p>
            </div>
          </div>
          <Link
            href="/saved"
            className="glass-panel rounded-2xl p-6 border border-zinc-800 flex items-center justify-between group hover:border-indigo-500/30 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl">
                💎
              </div>
              <div>
                <div className="text-white font-bold group-hover:text-indigo-300 transition-colors">
                  Open My Vault
                </div>
                <div className="text-zinc-500 text-xs mt-0.5">
                  {savedCount} saved prompt{savedCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <svg className="w-5 h-5 text-zinc-600 group-hover:text-indigo-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </section>
      </main>
    </div>
  );
}
