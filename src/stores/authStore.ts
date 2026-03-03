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
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session || !data.user) throw new Error('No session created');
    
    localStorage.setItem('token', data.session.access_token);
    set({ 
      user: {
        id: data.user.id,
        email: data.user.email || '',
        displayName: data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || null,
        avatarUrl: data.user.user_metadata?.avatar_url || null,
      },
      token: data.session.access_token,
      isAuthenticated: true
    });
  },

  register: async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { data: { display_name: displayName || email.split('@')[0] } }
    });
    if (error) throw error;
    
    // If auto-confirm is enabled, log them in
    if (data.session && data.user) {
      localStorage.setItem('token', data.session.access_token);
      set({ 
        user: {
          id: data.user.id,
          email: data.user.email || '',
          displayName: displayName || email.split('@')[0],
          avatarUrl: null,
        },
        token: data.session.access_token,
        isAuthenticated: true
      });
    } else {
      // Need email confirmation
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    // Get session from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      localStorage.setItem('token', session.access_token);
      
      const { data: { user } } = await supabase.auth.getUser();
      
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
        
        // Clear URL hash after OAuth callback
        if (window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        return;
      }
    }

    // No valid session
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
}));
