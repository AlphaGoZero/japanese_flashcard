import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface Card {
  id: string;
  japanese: string;
  hiragana: string;
  romaji: string | null;
  english: string;
  jlptLevel: string;
  category: string;
}

interface Deck {
  id: string;
  name: string;
  description: string | null;
  jlptLevel: string;
  category: string;
  cardCount: number;
  isPremium: boolean;
  createdAt: string;
  cards?: Card[];
}

interface DeckStats {
  total: number;
  mastered: number;
  learning: number;
  new: number;
}

interface DeckState {
  decks: Deck[];
  currentDeck: Deck | null;
  deckStats: DeckStats | null;
  isLoading: boolean;
  fetchDecks: (params?: { jlpt?: string; category?: string }) => Promise<void>;
  fetchDeck: (id: string) => Promise<void>;
  fetchDeckStats: (id: string) => Promise<void>;
  clearCurrentDeck: () => void;
}

export const useDeckStore = create<DeckState>((set) => ({
  decks: [],
  currentDeck: null,
  deckStats: null,
  isLoading: false,

  fetchDecks: async (params) => {
    set({ isLoading: true });
    try {
      let query = supabase.from('decks').select('*');
      
      if (params?.jlpt) {
        query = query.eq('jlpt_level', params.jlpt);
      }
      if (params?.category) {
        query = query.eq('category', params.category);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const decks = (data || []).map((deck: any) => ({
        id: deck.id,
        name: deck.name,
        description: deck.description,
        jlptLevel: deck.jlpt_level,
        category: deck.category,
        cardCount: deck.card_count,
        isPremium: deck.is_premium,
        createdAt: deck.created_at,
      }));
      
      set({ decks, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch decks:', error);
      set({ isLoading: false });
    }
  },

  fetchDeck: async (id: string) => {
    set({ isLoading: true });
    try {
      const { data: deck, error } = await supabase
        .from('decks')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      const { data: cards } = await supabase
        .from('cards')
        .select('*')
        .eq('deck_id', id);
      
      set({ 
        currentDeck: { 
          ...deck, 
          cards: cards || [],
          jlptLevel: deck.jlpt_level,
          cardCount: deck.card_count,
          createdAt: deck.created_at,
        }, 
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch deck:', error);
      set({ isLoading: false });
    }
  },

  fetchDeckStats: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('id', { count: 'exact' })
        .eq('deck_id', id);
      
      if (error) throw error;
      
      set({ deckStats: { total: data?.length || 0, mastered: 0, learning: 0, new: 0 } });
    } catch (error) {
      console.error('Failed to fetch deck stats:', error);
    }
  },

  clearCurrentDeck: () => set({ currentDeck: null, deckStats: null }),
}));
