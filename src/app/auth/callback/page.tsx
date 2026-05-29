'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase client auto-detects session from URL hash
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Auth callback error:', error.message);
        router.replace('/?auth=error');
        return;
      }

      if (data?.session) {
        // Dispatch auth event so all components update
        window.dispatchEvent(
          new CustomEvent('supabase-auth-change', {
            detail: { user: data.session.user },
          })
        );
        router.replace('/');
      } else {
        // No session yet — try exchange
        const { data: exchangeData, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(
            window.location.href
          );
        if (exchangeError) {
          console.error('Session exchange error:', exchangeError.message);
          router.replace('/?auth=error');
          return;
        }
        if (exchangeData?.session) {
          window.dispatchEvent(
            new CustomEvent('supabase-auth-change', {
              detail: { user: exchangeData.session.user },
            })
          );
        }
        router.replace('/');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Completing sign in...</p>
      </div>
    </div>
  );
}
