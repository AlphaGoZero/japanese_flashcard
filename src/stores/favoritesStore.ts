import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface CardFavorite {
  id: string;
  cardId: string;
  japanese: string;
  hiragana: string;
  romaji: string | null;
  english: string;
  exampleJapanese: string | null;
  exampleEnglish: string | null;
  deckName: string;
  deckId: string;
  addedAt: string;
}

interface CardNote {
  cardId: string;
  note: string;
}

interface FavoritesState {
  favorites: CardFavorite[];
  notes: CardNote[];
  isLoading: boolean;
  fetchFavorites: () => Promise<void>;
  addFavorite: (cardId: string) => Promise<void>;
  removeFavorite: (cardId: string) => Promise<void>;
  isFavorite: (cardId: string) => boolean;
  fetchNotes: () => Promise<void>;
  updateNote: (cardId: string, note: string) => Promise<void>;
  getNote: (cardId: string) => string;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  notes: [],
  isLoading: false,

  fetchFavorites: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('card_favorites')
        .select('*, cards!inner(japanese, hiragana, romaji, english, example_japanese, example_english, deck_id), cards.decks!inner(name)')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) throw error;

      const favorites = (data || []).map((f: any) => ({
        id: f.id,
        cardId: f.card_id,
        japanese: f.cards?.japanese || '',
        hiragana: f.cards?.hiragana || '',
        romaji: f.cards?.romaji || null,
        english: f.cards?.english || '',
        exampleJapanese: f.cards?.example_japanese || null,
        exampleEnglish: f.cards?.example_english || null,
        deckName: f.cards?.decks?.name || '',
        deckId: f.cards?.deck_id || '',
        addedAt: f.added_at,
      }));

      set({ favorites, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      set({ isLoading: false });
    }
  },

  addFavorite: async (cardId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('card_favorites')
        .insert({
          user_id: user.id,
          card_id: cardId,
        });

      if (error) throw error;
      await get().fetchFavorites();
    } catch (error) {
      console.error('Failed to add favorite:', error);
    }
  },

  removeFavorite: async (cardId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('card_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('card_id', cardId);

      if (error) throw error;
      await get().fetchFavorites();
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  },

  isFavorite: (cardId: string) => {
    return get().favorites.some(f => f.cardId === cardId);
  },

  fetchNotes: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('card_notes')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const notes = (data || []).map((n: any) => ({
        cardId: n.card_id,
        note: n.note,
      }));

      set({ notes });
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    }
  },

  updateNote: async (cardId: string, note: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('card_notes')
        .upsert({
          user_id: user.id,
          card_id: cardId,
          note,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,card_id' });

      if (error) throw error;
      await get().fetchNotes();
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  },

  getNote: (cardId: string) => {
    const note = get().notes.find(n => n.cardId === cardId);
    return note?.note || '';
  },
}));
