'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase, signOut } from '@/lib/supabase';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

interface UserInfo {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
}

export const AuthModal = ({ open, onClose }: AuthModalProps) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // Restore session from Supabase on mount
  useEffect(() => {
    const restore = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        const u = data.session.user;
        setUser({
          id: u.id,
          email: u.email,
          full_name: u.user_metadata?.full_name || u.user_metadata?.name || 'User',
          avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture || '',
        });
      }
    };
    restore();
  }, []);

  // Listen for auth state changes
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
    return () => window.removeEventListener('supabase-auth-change', handler);
  }, []);

  const handleSignIn = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://cheerhuan.github.io/prompt-gallery-saas',
        },
      });
      if (error) {
        console.error('Sign in error:', error.message);
        setLoading(false);
      }
      // OAuth redirects browser — no need to reset loading
    } catch (err) {
      console.error('Sign in error:', err);
      setLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setUser(null);
    onClose();
  }, [onClose]);

  const handleClose = useCallback(() => {
    if (!loading) onClose();
  }, [loading, onClose]);

  return (
    <>
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
              className="animate-modal-in relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              {user ? (
                /* ── Logged In State ── */
                <div className="flex flex-col items-center gap-6">
                  <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-indigo-500/30 ring-offset-2 ring-offset-zinc-900">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || 'User'}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                        {(user.full_name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white">{user.full_name || 'User'}</h3>
                    {user.email && (
                      <p className="text-sm text-zinc-400 mt-1">{user.email}</p>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 bg-zinc-800/50 px-3 py-1.5 rounded-full">
                    Signed in with Google
                  </p>
                  <button
                    onClick={handleSignOut}
                    className="w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all text-sm font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                /* ── Logged Out State ── */
                <div className="flex flex-col items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <path d="M20 8v6M23 11h-6" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white">Welcome to Prompt Gallery</h3>
                    <p className="text-sm text-zinc-400 mt-1">Sign in to like, save, and submit prompts</p>
                  </div>
                  <button
                    onClick={handleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all font-medium text-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </button>
                  <p className="text-xs text-zinc-500 bg-zinc-800/50 px-3 py-1.5 rounded-full">
                    Secure sign-in via Supabase
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};
