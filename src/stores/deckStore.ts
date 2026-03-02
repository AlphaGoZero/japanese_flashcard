import { create } from 'zustand';
import { deckAPI } from '../services/api';

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
      const response = await deckAPI.getAll(params);
      set({ decks: response.data.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch decks:', error);
      set({ isLoading: false });
    }
  },

  fetchDeck: async (id: string) => {
    set({ isLoading: true });
    try {
      const response = await deckAPI.getById(id);
      set({ currentDeck: response.data.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch deck:', error);
      set({ isLoading: false });
    }
  },

  fetchDeckStats: async (id: string) => {
    try {
      const response = await deckAPI.getStats(id);
      set({ deckStats: response.data.data });
    } catch (error) {
      console.error('Failed to fetch deck stats:', error);
    }
  },

  clearCurrentDeck: () => set({ currentDeck: null, deckStats: null }),
}));
