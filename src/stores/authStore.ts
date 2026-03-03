import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('No user returned');
    
    set({ 
      user: {
        id: data.user.id,
        email: data.user.email || '',
        displayName: data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || null,
        avatarUrl: data.user.user_metadata?.avatar_url || null,
      },
      isAuthenticated: true,
      isLoading: false
    });
  },

  register: async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { data: { display_name: displayName || email.split('@')[0] } }
    });
    if (error) throw error;
    
    if (data.user) {
      set({ 
        user: {
          id: data.user.id,
          email: data.user.email || '',
          displayName: displayName || email.split('@')[0],
          avatarUrl: null,
        },
        isAuthenticated: true,
        isLoading: false
      });
    } else {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const user = session.user;
        set({
          user: {
            id: user.id,
            email: user.email || '',
            displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || null,
            avatarUrl: user.user_metadata?.avatar_url || null,
          },
          isAuthenticated: true,
          isLoading: false,
        });
        
        // Clear URL hash if present (OAuth callback)
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
