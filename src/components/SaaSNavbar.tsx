'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/components/I18nProvider';
import { getSavedIds } from '@/lib/vault';
import { AuthModal } from './AuthModal';

export const SaaSNavbar = ({ userTier = 'free' }) => {
  const { t, setLocale, locale } = useI18n();
  const [vaultCount, setVaultCount] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<{ id: string; full_name?: string; avatar_url?: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Vault count
  useEffect(() => {
    setVaultCount(getSavedIds().length);
    const handler = () => setVaultCount(getSavedIds().length);
    window.addEventListener('vault-change', handler);
    return () => window.removeEventListener('vault-change', handler);
  }, []);

  // Restore session from Supabase on mount
  useEffect(() => {
    const restore = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        const u = data.session.user;
        setUser({
          id: u.id,
          full_name: u.user_metadata?.full_name || u.user_metadata?.name || 'User',
          avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture || '',
        });
      }
    };
    restore();
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.user) {
        setUser({
          id: detail.user.id,
          full_name: detail.user.user_metadata?.full_name || detail.user.user_metadata?.name || 'User',
          avatar_url: detail.user.user_metadata?.avatar_url || detail.user.user_metadata?.picture || '',
        });
      } else {
        setUser(null);
        setDropdownOpen(false);
      }
    };
    window.addEventListener('supabase-auth-change', handler);
    return () => window.removeEventListener('supabase-auth-change', handler);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDropdownOpen(false);
    window.dispatchEvent(
      new CustomEvent('supabase-auth-change', { detail: { user: null } })
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-black/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black text-xs">PG</span>
            </div>
            <span>PROMPT GALLERY</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            <Link href="/explore" className="hover:text-white transition-colors">{t('nav.explore')}</Link>
            <Link href="/trending" className="hover:text-white transition-colors">{t('nav.trending')}</Link>
            <Link href="/leaderboard" className="hover:text-white transition-colors">🏆 Leaderboard</Link>
            <Link href="/saved" className="hover:text-white transition-colors flex items-center gap-1.5">
              My Vault
              {vaultCount > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {vaultCount}
                </span>
              )}
            </Link>
            <Link href="/submit" className="hover:text-white transition-colors text-indigo-400 hover:text-indigo-300 font-medium">
              + Submit Prompt
            </Link>
            <Link href="/pricing" className="hover:text-white transition-colors">{t('nav.pricing')}</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
            className="text-xs font-medium px-2 py-1 rounded border border-zinc-800 text-zinc-500 hover:text-white transition-colors"
          >
            {locale === 'en' ? '中文' : 'EN'}
          </button>
          {userTier === 'free' && (
            <Link 
              href="/pricing" 
              className="hidden sm:block text-xs font-medium px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white animate-pulse"
            >
              {t('nav.upgrade')}
            </Link>
          )}
          {user ? (
            /* ── Logged in: avatar + dropdown ── */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-zinc-700" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {(user.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <svg className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-2 animate-fade-in">
                  <div className="px-4 py-2 border-b border-zinc-800">
                    <p className="text-sm text-white font-medium truncate">{user.full_name || 'User'}</p>
                    <p className="text-[10px] text-zinc-500">Signed in</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    My Profile
                  </Link>
                  <Link
                    href="/submit"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Submit Prompt
                  </Link>
                  <Link
                    href="/saved"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    My Vault
                  </Link>
                  <div className="border-t border-zinc-800 mt-1 pt-1">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-zinc-800 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              {t('nav.login')}
            </button>
          )}
          <Link 
            href="/pricing" 
            className="text-sm bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-zinc-200 transition-colors"
          >
            {t('nav.getStarted')}
          </Link>
        </div>
      </div>
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </nav>
  );
};
