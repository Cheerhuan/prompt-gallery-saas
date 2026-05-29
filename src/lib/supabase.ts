// ── Supabase client (browser-only for static export) ──
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mnsbcqmpprlfjlhpofmz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2JjcW1wcHJsZmpsaHBvZm16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMjk0NTIsImV4cCI6MjA5NTYwNTQ1Mn0.RINauOECMf6YDtN_xpsPT38cR99VegCdMhPnVHzs2iM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/** Whether Supabase is configured with real credentials */
export const isSupabaseConfigured = true;

// ── Auth helpers ──────────────────────────────────

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://cheerhuan.github.io/prompt-gallery-saas/auth/callback',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (!error) {
    window.dispatchEvent(
      new CustomEvent('supabase-auth-change', { detail: { user: null } })
    );
  }
  return { error };
};

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
};

// ── Community prompts helpers ─────────────────────

export interface CommunityPrompt {
  id: number;
  user_id: string;
  title: string;
  full_prompt: string;
  reference_image: string;
  ai_model: string;
  tags: string[];
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export const submitCommunityPrompt = async ({
  title,
  fullPrompt,
  referenceImage,
  aiModel,
  tags,
}: {
  title: string;
  fullPrompt: string;
  referenceImage: string;
  aiModel: string;
  tags: string[];
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('community_prompts')
    .insert({
      user_id: user.id,
      title,
      full_prompt: fullPrompt,
      reference_image: referenceImage,
      ai_model: aiModel,
      tags,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data as CommunityPrompt;
};

export const fetchUserPrompts = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('community_prompts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as CommunityPrompt[];
};

export const fetchApprovedPrompts = async () => {
  const { data, error } = await supabase
    .from('community_prompts')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as CommunityPrompt[];
};
