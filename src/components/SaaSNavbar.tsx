'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/components/I18nProvider';
import { getSavedIds } from '@/lib/vault';
import { AuthModal } from './AuthModal';

export const SaaSNavbar = ({ userTier = 'free' }) => {
  const { t, setLocale, locale } = useI18n();
  const [vaultCount, setVaultCount] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<{ full_name?: string; avatar_url?: string } | null>(null);

  useEffect(() => {
    setVaultCount(getSavedIds().length);
    const handler = () => setVaultCount(getSavedIds().length);
    window.addEventListener('vault-change', handler);
    return () => window.removeEventListener('vault-change', handler);
  }, []);

  // Listen for auth changes (mock mode + real supabase)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.user) {
        setUser({
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
        setUser({ full_name: u.full_name, avatar_url: u.avatar_url });
      }
    } catch {}

    return () => window.removeEventListener('supabase-auth-change', handler);
  }, []);

  const handleLogin = () => {
    setShowAuthModal(true);
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
            <Link href="/saved" className="hover:text-white transition-colors flex items-center gap-1.5">
              My Vault
              {vaultCount > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {vaultCount}
                </span>
              )}
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
          <button 
            onClick={handleLogin}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            {user ? (
              <>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-zinc-700" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {(user.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline text-xs">{user.full_name || 'User'}</span>
              </>
            ) : (
              t('nav.login')
            )}
          </button>
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
