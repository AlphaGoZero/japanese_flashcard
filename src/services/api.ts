import axios from 'axios';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const api = axios.create({
  baseURL: SUPABASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  },
});

// Auth - using Supabase client directly now
export const authAPI = {
  register: () => Promise.reject(new Error('Use Supabase auth')),
  login: () => Promise.reject(new Error('Use Supabase auth')),
  me: () => Promise.reject(new Error('Use Supabase auth')),
  logout: () => Promise.resolve(),
};

// Decks - using Supabase client in deckStore now
export const deckAPI = {
  getAll: async () => ({ data: { data: [] } }),
  getById: async () => ({ data: { data: null } }),
  getStats: async () => ({ data: { data: { total: 0, mastered: 0, learning: 0, new: 0 } } }),
};

// Cards
export const cardAPI = {
  getById: async () => ({ data: { data: null } }),
  getRandom: async () => ({ data: { data: [] } }),
};

// Progress - using Supabase client in progressStore now
export const progressAPI = {
  getAll: async () => ({ data: { data: { totalReviewed: 0, mastered: 0, learning: 0, streak: 0 } } }),
  getByDeck: async () => ({ data: { data: [] } }),
  review: async (_data: { cardId: string; correct: boolean }) => ({ data: { data: {} } }),
  getDue: async () => ({ data: { data: [] } }),
};

// Quiz
export const quizAPI = {
  start: async () => ({ data: { data: [] } }),
  submit: async () => ({ data: { data: {} } }),
  getHistory: async () => ({ data: { data: [] } }),
};

// Games
export const gameAPI = {
  start: async (_data: { deckId: string; gameType: string }) => ({ data: { data: [] } }),
  submit: async (_data: { deckId: string; gameType: string; score: number; timeTakenSeconds: number }) => ({ data: { data: {} } }),
  getHistory: async () => ({ data: { data: [] } }),
};

export default api;
