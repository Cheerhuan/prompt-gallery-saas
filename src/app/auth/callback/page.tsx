'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing sign in...');

  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      try {
        console.log('[AuthCallback] URL:', window.location.href);

        // ── Method 1: Try auto-detect (handles hash fragments) ──
        const { data, error } = await supabase.auth.getSession();
        console.log('[AuthCallback] getSession:', { data, error });

        if (!cancelled && data?.session) {
          window.dispatchEvent(
            new CustomEvent('supabase-auth-change', {
              detail: { user: data.session.user },
            })
          );
          router.replace('/');
          return;
        }

        // ── Method 2: Exchange code from URL (PKCE) ──
        setStatus('Exchanging authorization code...');
        const { data: exchangeData, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(window.location.href);
        console.log('[AuthCallback] exchange:', { exchangeData, exchangeError });

        if (!cancelled && exchangeData?.session) {
          window.dispatchEvent(
            new CustomEvent('supabase-auth-change', {
              detail: { user: exchangeData.session.user },
            })
          );
          router.replace('/');
          return;
        }

        // ── Method 3: If there's an error but we have URL params, try to initialize session ──
        if (!cancelled) {
          setStatus('Retrying session setup...');
          await supabase.auth.initialize();
          const { data: retryData } = await supabase.auth.getSession();
          if (retryData?.session) {
            window.dispatchEvent(
              new CustomEvent('supabase-auth-change', {
                detail: { user: retryData.session.user },
              })
            );
            router.replace('/');
            return;
          }
        }

        // ── Failed ──
        if (!cancelled) {
          console.error('[AuthCallback] All methods failed');
          setStatus('Sign in failed. Redirecting...');
          setTimeout(() => router.replace('/?auth=error'), 2000);
        }
      } catch (err) {
        console.error('[AuthCallback] Exception:', err);
        if (!cancelled) {
          setStatus('An error occurred. Redirecting...');
          setTimeout(() => router.replace('/'), 2000);
        }
      }
    };

    handleCallback();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">{status}</p>
      </div>
    </div>
  );
}
