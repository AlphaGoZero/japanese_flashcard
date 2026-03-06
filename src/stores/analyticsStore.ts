import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface WeeklyData {
  weekStart: string;
  weekEnd: string;
  cardsReviewed: number;
  cardsMastered: number;
  xpEarned: number;
  quizzesCompleted: number;
  gamesPlayed: number;
  studyTimeSeconds: number;
  streakDays: number;
}

interface WeaknessItem {
  cardId: string;
  japanese: string;
  hiragana: string;
  english: string;
  timesIncorrect: number;
  category: string;
  jlptLevel: string;
}

interface DailyVelocity {
  date: string;
  cardsMastered: number;
  cardsReviewed: number;
  xpEarned: number;
}

interface AnalyticsState {
  weeklyData: WeeklyData[];
  weaknessList: WeaknessItem[];
  dailyVelocity: DailyVelocity[];
  isLoading: boolean;
  fetchWeeklyData: () => Promise<void>;
  fetchWeaknessList: () => Promise<void>;
  fetchDailyVelocity: () => Promise<void>;
  fetchAllAnalytics: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  weeklyData: [],
  weaknessList: [],
  dailyVelocity: [],
  isLoading: false,

  fetchWeeklyData: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('weekly_summary')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(12);

      if (error) throw error;

      const weeklyData = (data || []).map((w: any) => ({
        weekStart: w.week_start,
        weekEnd: w.week_end,
        cardsReviewed: w.cards_reviewed || 0,
        cardsMastered: w.cards_mastered || 0,
        xpEarned: w.xp_earned || 0,
        quizzesCompleted: w.quizzes_completed || 0,
        gamesPlayed: w.games_played || 0,
        studyTimeSeconds: w.study_time_seconds || 0,
        streakDays: w.streak_days || 0,
      }));

      set({ weeklyData });
    } catch (error) {
      console.error('Failed to fetch weekly data:', error);
    }
  },

  fetchWeaknessList: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('weakness_analysis')
        .select('*, cards!inner(japanese, hiragana, english, category, jlpt_level)')
        .eq('user_id', user.id)
        .order('times_incorrect', { ascending: false })
        .limit(20);

      if (error) throw error;

      const weaknessList = (data || []).map((w: any) => ({
        cardId: w.card_id,
        japanese: w.cards?.japanese || '',
        hiragana: w.cards?.hiragana || '',
        english: w.cards?.english || '',
        timesIncorrect: w.times_incorrect || 0,
        category: w.cards?.category || '',
        jlptLevel: w.cards?.jlpt_level || '',
      }));

      set({ weaknessList });
    } catch (error) {
      console.error('Failed to fetch weakness list:', error);
    }
  },

  fetchDailyVelocity: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('learning_velocity')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      const dailyVelocity = (data || []).map((d: any) => ({
        date: d.date,
        cardsMastered: d.cards_mastered || 0,
        cardsReviewed: d.cards_reviewed || 0,
        xpEarned: d.xp_earned || 0,
      }));

      set({ dailyVelocity });
    } catch (error) {
      console.error('Failed to fetch daily velocity:', error);
    }
  },

  fetchAllAnalytics: async () => {
    set({ isLoading: true });
    await Promise.all([
      useAnalyticsStore.getState().fetchWeeklyData(),
      useAnalyticsStore.getState().fetchWeaknessList(),
      useAnalyticsStore.getState().fetchDailyVelocity(),
    ]);
    set({ isLoading: false });
  },
}));
