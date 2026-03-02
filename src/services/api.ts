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

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: { email: string; password: string; displayName?: string }) =>
    api.post('/functions/v1/auth-register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/functions/v1/auth-login', data),
  me: () => api.get('/functions/v1/auth-me'),
  logout: () => {
    localStorage.removeItem('token');
    return Promise.resolve();
  },
};

// Decks
export const deckAPI = {
  getAll: (params?: { jlpt?: string; category?: string }) =>
    api.get('/functions/v1/decks-list', { params }),
  getById: (id: string) => api.get(`/functions/v1/decks-get?id=${id}`),
  getStats: (id: string) => api.get(`/functions/v1/decks-stats?id=${id}`),
};

// Cards
export const cardAPI = {
  getById: async (_id: string) => {
    return { data: { data: null } };
  },
  getRandom: async () => {
    return { data: { data: [] } };
  },
};

// Progress
export const progressAPI = {
  getAll: async () => {
    return { data: { data: { totalReviewed: 0, mastered: 0, learning: 0, streak: 0 } } };
  },
  getByDeck: async () => {
    return { data: { data: [] } };
  },
  review: (data: { cardId: string; correct: boolean }) =>
    api.post('/functions/v1/progress-review', data),
  getDue: async () => {
    return { data: { data: [] } };
  },
};

// Quiz
export const quizAPI = {
  start: (data: { deckId: string; quizType: string; count?: number }) =>
    api.get('/functions/v1/quiz-start', { params: data }),
  submit: (data: {
    deckId: string;
    quizType: string;
    answers: Array<{ cardId: string; answer: string }>;
    timeTakenSeconds: number;
  }) => api.post('/functions/v1/quiz-submit', data),
  getHistory: async () => {
    return { data: { data: [] } };
  },
};

// Games
export const gameAPI = {
  start: (data: { deckId: string; gameType: string }) =>
    api.post('/functions/v1/games-start', data),
  submit: (data: { deckId: string; gameType: string; score: number; timeTakenSeconds: number }) =>
    api.post('/functions/v1/games-submit', data),
  getHistory: () =>
    api.get('/functions/v1/games-history'),
};

export default api;
