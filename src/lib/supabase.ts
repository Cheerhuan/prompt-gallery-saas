// ── Supabase adapter (mock-only for static export) ──
// All auth is localStorage-based mock. No SDK needed.

/** Whether Supabase is configured with real credentials */
export const isSupabaseConfigured = false;

// ── Auth helpers ──────────────────────────────────────

export const signInWithGoogle = async () => {
  // Mock mode: dispatch a mock auth state
  const mockUser = {
    id: 'mock-user-' + Date.now(),
    email: 'demo@prompt-gallery.dev',
    user_metadata: {
      full_name: 'Demo User',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
    },
  };
  window.dispatchEvent(
    new CustomEvent('supabase-auth-change', {
      detail: { user: mockUser },
    })
  );
  return { data: { user: mockUser }, error: null };
};

export const signOut = async () => {
  window.dispatchEvent(
    new CustomEvent('supabase-auth-change', {
      detail: { user: null },
    })
  );
  return { error: null };
};

export const getCurrentUser = async () => {
  return null;
};
