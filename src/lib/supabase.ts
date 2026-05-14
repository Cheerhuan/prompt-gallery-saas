import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/** Whether Supabase is configured with real credentials */
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Create the client — even without real keys it won't crash, just return errors
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// ── Auth helpers ──────────────────────────────────────

export const signInWithGoogle = async () => {
  if (!isSupabaseConfigured) {
    // Mock mode: dispatch a mock auth state
    const mockUser = {
      id: 'mock-user-' + Date.now(),
      email: 'demo@prompt-gallery.dev',
      user_metadata: {
        full_name: 'Demo User',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      },
    }
    window.dispatchEvent(
      new CustomEvent('supabase-auth-change', {
        detail: { user: mockUser },
      })
    )
    return { data: { user: mockUser }, error: null }
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/prompt-gallery-saas/' },
  })
  return { data, error }
}

export const signOut = async () => {
  if (!isSupabaseConfigured) {
    window.dispatchEvent(
      new CustomEvent('supabase-auth-change', {
        detail: { user: null },
      })
    )
    return { error: null }
  }
  return await supabase.auth.signOut()
}

export const getCurrentUser = async () => {
  if (!isSupabaseConfigured) return null
  const { data } = await supabase.auth.getUser()
  return data?.user || null
}
