/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface VocabularyGenre {
  id: string;
  slug: string;
  name: string;
  name_japanese: string | null;
  description: string | null;
  icon: string | null;
  color: string | null;
  card_count: number;
  is_premium: boolean;
}

interface GenreProgress {
  genre_slug: string;
  cards_studied: number;
  cards_mastered: number;
  total_xp: number;
  streak_days: number;
  last_studied: string | null;
  completion_percentage: number;
}

interface GenreState {
  genres: VocabularyGenre[];
  genreProgress: GenreProgress[];
  isLoading: boolean;
  fetchGenres: () => Promise<void>;
  fetchGenreProgress: () => Promise<void>;
  updateGenreProgress: (genreSlug: string, data: Partial<GenreProgress>) => Promise<void>;
}

export const useGenreStore = create<GenreState>((set, get) => ({
  genres: [],
  genreProgress: [],
  isLoading: false,

  fetchGenres: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('vocabulary_genres')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      set({ genres: data || [] });
    } catch (error) {
      console.error('Error fetching genres:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchGenreProgress: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('genre_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      set({ genreProgress: data || [] });
    } catch (error) {
      console.error('Error fetching genre progress:', error);
    }
  },

  updateGenreProgress: async (genreSlug: string, data: Partial<GenreProgress>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('genre_progress')
        .upsert({
          user_id: user.id,
          genre_slug: genreSlug,
          ...data,
          last_studied: new Date().toISOString()
        }, {
          onConflict: 'user_id,genre_slug'
        });

      if (error) throw error;
      get().fetchGenreProgress();
    } catch (error) {
      console.error('Error updating genre progress:', error);
    }
  }
}));
