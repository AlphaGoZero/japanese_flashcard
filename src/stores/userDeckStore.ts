import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface UserCard {
  id: string;
  user_id: string;
  user_deck_id: string;
  japanese: string;
  hiragana: string;
  romaji: string | null;
  english: string;
  example_japanese: string | null;
  example_english: string | null;
  created_at: string;
}

interface UserDeck {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  jlpt_level: string;
  category: string;
  is_public: boolean;
  cardCount?: number;
  created_at: string;
  updated_at: string;
}

interface UserDeckState {
  userDecks: UserDeck[];
  currentDeck: UserDeck | null;
  deckCards: UserCard[];
  isLoading: boolean;
  fetchUserDecks: () => Promise<void>;
  fetchUserDeck: (id: string) => Promise<void>;
  createDeck: (deck: Omit<UserDeck, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<UserDeck | null>;
  updateDeck: (id: string, updates: Partial<UserDeck>) => Promise<void>;
  deleteDeck: (id: string) => Promise<void>;
  addCard: (deckId: string, card: Omit<UserCard, 'id' | 'user_id' | 'user_deck_id' | 'created_at'>) => Promise<UserCard | null>;
  updateCard: (id: string, updates: Partial<UserCard>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  clearCurrentDeck: () => void;
}

export const useUserDeckStore = create<UserDeckState>((set, get) => ({
  userDecks: [],
  currentDeck: null,
  deckCards: [],
  isLoading: false,

  fetchUserDecks: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ userDecks: [], isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('user_decks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const decksWithCount = await Promise.all(
        (data || []).map(async (deck: any) => {
          const { count } = await supabase
            .from('user_cards')
            .select('*', { count: 'exact', head: true })
            .eq('user_deck_id', deck.id);
          return { ...deck, cardCount: count || 0 };
        })
      );

      set({ userDecks: decksWithCount as UserDeck[], isLoading: false });
    } catch (error) {
      console.error('Failed to fetch user decks:', error);
      set({ isLoading: false });
    }
  },

  fetchUserDeck: async (id: string) => {
    set({ isLoading: true });
    try {
      const { data: deck, error } = await supabase
        .from('user_decks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const { data: cards } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_deck_id', id)
        .order('created_at', { ascending: false });

      set({ currentDeck: deck, deckCards: cards || [], isLoading: false });
    } catch (error) {
      console.error('Failed to fetch user deck:', error);
      set({ isLoading: false });
    }
  },

  createDeck: async (deck) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_decks')
        .insert({ ...deck, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      set(state => ({ userDecks: [data, ...state.userDecks] }));
      return data;
    } catch (error) {
      console.error('Failed to create deck:', error);
      return null;
    }
  },

  updateDeck: async (id: string, updates: Partial<UserDeck>) => {
    try {
      const { error } = await supabase
        .from('user_decks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        userDecks: state.userDecks.map(d => 
          d.id === id ? { ...d, ...updates } : d
        ),
        currentDeck: state.currentDeck?.id === id 
          ? { ...state.currentDeck, ...updates }
          : state.currentDeck
      }));
    } catch (error) {
      console.error('Failed to update deck:', error);
    }
  },

  deleteDeck: async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_decks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        userDecks: state.userDecks.filter(d => d.id !== id),
        currentDeck: state.currentDeck?.id === id ? null : state.currentDeck
      }));
    } catch (error) {
      console.error('Failed to delete deck:', error);
    }
  },

  addCard: async (deckId: string, card) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_cards')
        .insert({ ...card, user_id: user.id, user_deck_id: deckId })
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        deckCards: [...state.deckCards, data],
        userDecks: state.userDecks.map(d => 
          d.id === deckId ? { ...d, cardCount: (d.cardCount || 0) + 1 } : d
        )
      }));
      return data;
    } catch (error) {
      console.error('Failed to add card:', error);
      return null;
    }
  },

  updateCard: async (id: string, updates: Partial<UserCard>) => {
    try {
      const { error } = await supabase
        .from('user_cards')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        deckCards: state.deckCards.map(c => 
          c.id === id ? { ...c, ...updates } : c
        )
      }));
    } catch (error) {
      console.error('Failed to update card:', error);
    }
  },

  deleteCard: async (id: string) => {
    try {
      const card = get().deckCards.find(c => c.id === id);
      
      const { error } = await supabase
        .from('user_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        deckCards: state.deckCards.filter(c => c.id !== id),
        userDecks: card 
          ? state.userDecks.map(d => 
              d.id === card.user_deck_id 
                ? { ...d, cardCount: Math.max(0, (d.cardCount || 1) - 1) } 
                : d
            )
          : state.userDecks
      }));
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  },

  clearCurrentDeck: () => set({ currentDeck: null, deckCards: [] }),
}));

declare global {
  interface Array<T> {
    asyncMap<U>(fn: (item: T) => Promise<U>): Promise<U[]>;
  }
}

Array.prototype.asyncMap = async function<T, U>(this: T[], fn: (item: T) => Promise<U>): Promise<U[]> {
  return Promise.all(this.map(fn));
};
