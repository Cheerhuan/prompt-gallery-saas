'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Session Recovery — runs silently on every page load.
 * Handles:
 * 1. PKCE code exchange from OAuth redirect (code in URL query)
 * 2. Session restore from stored auth tokens
 */
export function SessionRecovery() {
  useEffect(() => {
    const recover = async () => {
      try {
        const url = window.location.href;
        const hasCode = new URLSearchParams(window.location.search).has('code');

        if (hasCode) {
          // PKCE flow — exchange auth code for session
          const { data, error } = await supabase.auth.exchangeCodeForSession(url);
          if (data?.session) {
            window.dispatchEvent(
              new CustomEvent('supabase-auth-change', {
                detail: { user: data.session.user },
              })
            );
          } else if (error) {
            console.error('[Auth] Exchange failed:', error.message);
          }
          // Clean URL — remove auth params
          window.history.replaceState({}, '', window.location.pathname);
        } else {
          // Normal page load — check for existing session
          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            window.dispatchEvent(
              new CustomEvent('supabase-auth-change', {
                detail: { user: data.session.user },
              })
            );
          }
        }
      } catch (err) {
        console.error('[Auth] Recovery error:', err);
        // Clean URL in case of error too
        if (window.location.search.includes('code=') || window.location.search.includes('error=')) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    };

    recover();
  }, []);

  return null; // Invisible — no UI
}
