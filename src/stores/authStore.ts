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
        isAuthenticated: true,
        isLoading: false
      });
    } else {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    // Handle OAuth callback - tokens might be in URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    
    if (accessToken) {
      // Extract and set session from URL hash
      localStorage.setItem('token', accessToken);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        set({
          user: {
            id: user.id,
            email: user.email || '',
            displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || null,
            avatarUrl: user.user_metadata?.avatar_url || null,
          },
          token: accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
        
        // Clear URL hash
        window.history.replaceState(null, '', window.location.pathname);
        return;
      }
    }

    // Check for existing session
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
        return;
      }
    }

    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
}));
