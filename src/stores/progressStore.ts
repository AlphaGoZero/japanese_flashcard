import { create } from 'zustand';
import { progressAPI } from '../services/api';

interface ProgressStats {
  totalReviewed: number;
  mastered: number;
  learning: number;
  streak: number;
}

interface ProgressState {
  stats: ProgressStats | null;
  isLoading: boolean;
  fetchStats: () => Promise<void>;
  recordReview: (cardId: string, correct: boolean) => Promise<void>;
}

export const useProgressStore = create<ProgressState>((set) => ({
  stats: null,
  isLoading: false,

  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const response = await progressAPI.getAll();
      set({ stats: response.data.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch progress:', error);
      set({ isLoading: false });
    }
  },

  recordReview: async (cardId: string, correct: boolean) => {
    try {
      await progressAPI.review({ cardId, correct });
    } catch (error) {
      console.error('Failed to record review:', error);
    }
  },
}));
