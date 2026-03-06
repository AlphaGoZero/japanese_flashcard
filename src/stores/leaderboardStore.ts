import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalXp: number;
  cardsMastered: number;
  cardsReviewed: number;
  quizzesCompleted: number;
  gamesPlayed: number;
}

interface UserRank {
  rank: number;
  totalXp: number;
  cardsMastered: number;
}

interface LeaderboardState {
  weeklyLeaderboard: LeaderboardEntry[];
  monthlyLeaderboard: LeaderboardEntry[];
  allTimeLeaderboard: LeaderboardEntry[];
  userRank: UserRank | null;
  isLoading: boolean;
  period: 'weekly' | 'monthly' | 'all_time';
  fetchLeaderboard: (period?: 'weekly' | 'monthly' | 'all_time') => Promise<void>;
  fetchUserRank: () => Promise<void>;
  setPeriod: (period: 'weekly' | 'monthly' | 'all_time') => void;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  weeklyLeaderboard: [],
  monthlyLeaderboard: [],
  allTimeLeaderboard: [],
  userRank: null,
  isLoading: false,
  period: 'weekly',

  fetchLeaderboard: async (period = 'weekly') => {
    set({ isLoading: true });
    try {
      let query = supabase
        .from('global_leaderboard')
        .select('*')
        .order('rank', { ascending: true })
        .limit(100);

      const { data, error } = await query;

      if (error) throw error;

      const leaderboard = (data || []).map((entry: any) => ({
        rank: entry.rank,
        userId: entry.user_id,
        displayName: entry.display_name || 'Anonymous',
        avatarUrl: entry.avatar_url,
        totalXp: entry.total_xp || 0,
        cardsMastered: entry.cards_mastered || 0,
        cardsReviewed: entry.cards_reviewed || 0,
        quizzesCompleted: entry.quizzes_completed || 0,
        gamesPlayed: entry.games_played || 0,
      }));

      switch (period) {
        case 'weekly':
          set({ weeklyLeaderboard: leaderboard, isLoading: false });
          break;
        case 'monthly':
          set({ monthlyLeaderboard: leaderboard, isLoading: false });
          break;
        case 'all_time':
          set({ allTimeLeaderboard: leaderboard, isLoading: false });
          break;
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      set({ isLoading: false });
    }
  },

  fetchUserRank: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('global_leaderboard')
        .select('rank, total_xp, cards_mastered')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        set({
          userRank: {
            rank: data.rank,
            totalXp: data.total_xp || 0,
            cardsMastered: data.cards_mastered || 0,
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch user rank:', error);
    }
  },

  setPeriod: (period) => set({ period }),
}));
