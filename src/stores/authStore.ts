import { create } from 'zustand';
import { authAPI } from '../services/api';
import { supabase, getCurrentUser } from '../services/supabase';

interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const response = await authAPI.login({ email, password });
    const { user, token } = response.data.data;
    if (!token) {
      throw new Error('No token received');
    }
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
    return user;
  },

  register: async (email: string, password: string, displayName?: string) => {
    try {
      const response = await authAPI.register({ email, password, displayName });
      const { user, token } = response.data.data;
      if (!token) {
        throw new Error('No token received from server');
      }
      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true });
    } catch (error: any) {
      console.error('Register error:', error.response?.data || error.message);
      throw error;
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore logout errors
    }
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    // Try to get session from Supabase (handles OAuth callback with hash fragment)
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      localStorage.setItem('token', session.access_token);
      try {
        const user = await getCurrentUser();
        if (user) {
          set({
            user: {
              id: user.id,
              email: user.email || '',
              displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || null,
              avatarUrl: user.user_metadata?.avatar_url || null,
            },
            token: session.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          // Clear the URL hash after successful auth
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          return;
        }
      } catch (e) {
        // Session invalid
      }
    }

    // Fallback to token-based auth
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authAPI.me();
        set({
          user: response.data.data.user,
          isAuthenticated: true,
          isLoading: false,
          token,
        });
      } catch (error: any) {
        console.error('checkAuth failed:', error);
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      set({ isLoading: false, isAuthenticated: false });
    }
  },
}));
