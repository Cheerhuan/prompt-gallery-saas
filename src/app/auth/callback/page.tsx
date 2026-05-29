'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Completing sign in...');

  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      try {
        const url = window.location.href;
        console.log('[AuthCallback] URL:', url);

        // Step 1: Check if session already exists (auto-detected from hash)
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('[AuthCallback] getSession:', sessionData?.session ? 'HAS_SESSION' : 'NO_SESSION');

        if (!cancelled && sessionData?.session) {
          window.dispatchEvent(
            new CustomEvent('supabase-auth-change', {
              detail: { user: sessionData.session.user },
            })
          );
          router.replace('/');
          return;
        }

        // Step 2: Try exchanging code (PKCE flow)
        // The code arrives as ?code=xxx in the URL after Supabase OAuth redirect
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        console.log('[AuthCallback] code in URL:', code ? 'YES' : 'NO');

        if (code) {
          setStatus('Exchanging authorization code...');
          const { data: exchangeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(url);

          if (!cancelled) {
            console.log('[AuthCallback] exchange result:', {
              hasSession: !!exchangeData?.session,
              error: exchangeError?.message,
            });

            if (exchangeData?.session) {
              window.dispatchEvent(
                new CustomEvent('supabase-auth-change', {
                  detail: { user: exchangeData.session.user },
                })
              );
              router.replace('/');
              return;
            }

            if (exchangeError) {
              setStatus(`Error: ${exchangeError.message}. Redirecting...`);
              setTimeout(() => router.replace('/?auth=error'), 3000);
              return;
            }
          }
        }

        // Step 3: Fallback - try initialize
        setStatus('Initializing session...');
        await supabase.auth.initialize();
        const { data: initData } = await supabase.auth.getSession();
        if (!cancelled && initData?.session) {
          window.dispatchEvent(
            new CustomEvent('supabase-auth-change', {
              detail: { user: initData.session.user },
            })
          );
          router.replace('/');
          return;
        }

        // All methods failed - redirect home
        if (!cancelled) {
          setStatus('Unable to complete sign in. Redirecting...');
          setTimeout(() => router.replace('/'), 2000);
        }
      } catch (err) {
        console.error('[AuthCallback] Exception:', err);
        if (!cancelled) {
          setStatus('Connection error. Redirecting...');
          setTimeout(() => router.replace('/'), 2000);
        }
      }
    };

    // Small delay to ensure Supabase client is fully initialized
    setTimeout(handleCallback, 100);

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
