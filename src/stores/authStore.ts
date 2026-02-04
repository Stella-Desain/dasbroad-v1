import { create } from 'zustand';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatar: string;
  role: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  initialized: boolean;

  init: () => () => void;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, fullName: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
}

function mapSupabaseUser(sbUser: SupabaseUser): User {
  const fullName =
    (sbUser.user_metadata?.full_name as string | undefined) ??
    sbUser.email?.split('@')[0] ??
    'User';

  const avatarSeed = encodeURIComponent(sbUser.email ?? fullName ?? sbUser.id);
  const avatar =
    (sbUser.user_metadata?.avatar_url as string | undefined) ??
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;

  return {
    id: sbUser.id,
    email: sbUser.email ?? '',
    fullName,
    avatar,
    role: 'Member',
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  loading: true,
  initialized: false,

  init: () => {
    if (get().initialized) return () => {};

    set({ initialized: true, loading: true });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      set({
        session,
        user: session?.user ? mapSupabaseUser(session.user) : null,
        isAuthenticated: !!session,
        loading: false,
      });
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        user: session?.user ? mapSupabaseUser(session.user) : null,
        isAuthenticated: !!session,
        loading: false,
      });
    });

    return () => subscription.unsubscribe();
  },

  login: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  },

  signup: async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    });

    return !error;
  },

  loginWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    return !error;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isAuthenticated: false });
  },
}));
