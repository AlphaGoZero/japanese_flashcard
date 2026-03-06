import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { calculateSRS } from '../utils/srs';

interface ProgressStats {
  totalReviewed: number;
  mastered: number;
  learning: number;
  streak: number;
  xp: number;
  level: number;
}

interface UserProgress {
  id: string;
  user_id: string;
  card_id: string;
  mastery_level: number;
  times_reviewed: number;
  correct_count: number;
  last_reviewed: string | null;
  next_review: string | null;
  ease_factor: number;
  interval: number;
  created_at: string;
}

interface ProgressState {
  stats: ProgressStats | null;
  dueCards: UserProgress[];
  isLoading: boolean;
  dailyGoal: number;
  todayProgress: number;
  achievements: string[];
  fetchStats: () => Promise<void>;
  fetchDueCards: (deckId?: string) => Promise<void>;
  recordReview: (cardId: string, correct: boolean, quality?: number) => Promise<void>;
  setDailyGoal: (goal: number) => void;
  addXP: (amount: number) => Promise<void>;
  checkAchievements: () => Promise<void>;
}

const calculateLevel = (xp: number): number => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

const getXPForNextLevel = (level: number): number => {
  return Math.pow(level, 2) * 100;
};

export const useProgressStore = create<ProgressState>((set, get) => ({
  stats: null,
  dueCards: [],
  isLoading: false,
  dailyGoal: 20,
  todayProgress: 0,
  achievements: [],

  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        set({ stats: { totalReviewed: 0, mastered: 0, learning: 0, streak: 0, xp: 0, level: 1 }, isLoading: false });
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      const [progressResult, dailyResult, userMetaResult] = await Promise.all([
        supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id),
        
        supabase
          .from('daily_activity')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .single(),
        
        supabase
          .from('users')
          .select('xp, level, daily_goal, achievements')
          .eq('id', user.id)
          .single()
      ]);

      const progress = progressResult.data || [];
      const dailyActivity = dailyResult.data;
      const userMeta = userMetaResult.data as { xp?: number; level?: number; daily_goal?: number; achievements?: string[] } || {};

      const totalReviewed = progress.reduce((acc, p) => acc + p.times_reviewed, 0);
      const mastered = progress.filter(p => p.mastery_level >= 8).length;
      const learning = progress.filter(p => p.mastery_level > 0 && p.mastery_level < 8).length;
      const xp = userMeta.xp || 0;
      const level = userMeta.level || calculateLevel(xp);
      const dailyGoal = userMeta.daily_goal || 20;
      const todayProgress = dailyActivity?.cards_reviewed || 0;

      const streak = await calculateStreak(user.id);

      set({ 
        stats: { 
          totalReviewed, 
          mastered, 
          learning,
          streak,
          xp,
          level,
        }, 
        dailyGoal,
        todayProgress,
        achievements: userMeta.achievements || [],
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch progress:', error);
      set({ stats: { totalReviewed: 0, mastered: 0, learning: 0, streak: 0, xp: 0, level: 1 }, isLoading: false });
    }
  },

  fetchDueCards: async (deckId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date().toISOString();

      let query = supabase
        .from('user_progress')
        .select(`
          *,
          cards:cards!inner(
            id, japanese, hiragana, romaji, english, 
            example_japanese, example_english, deck_id
          )
        `)
        .eq('user_id', user.id)
        .or(`next_review.is.null,next_review.lte.${now}`);

      if (deckId) {
        query = query.eq('cards.deck_id', deckId);
      }

      const { data, error } = await query;

      if (error) throw error;
      set({ dueCards: data || [] });
    } catch (error) {
      console.error('Failed to fetch due cards:', error);
    }
  },

  recordReview: async (cardId: string, correct: boolean, quality?: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const q = quality ?? (correct ? 4 : 1);

      const { data: existing } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('card_id', cardId)
        .single();

      const easeFactor = existing?.ease_factor || 2.5;
      const currentInterval = existing?.interval || 0;
      const masteryLevel = existing?.mastery_level || 0;

      const srsResult = calculateSRS(q, easeFactor, currentInterval, masteryLevel);

      const xpEarned = correct ? 10 + Math.floor(masteryLevel / 2) : 2;
      const { stats } = get();

      if (existing) {
        await supabase
          .from('user_progress')
          .update({
            times_reviewed: existing.times_reviewed + 1,
            correct_count: correct ? existing.correct_count + 1 : existing.correct_count,
            mastery_level: srsResult.masteryLevel,
            last_reviewed: new Date().toISOString(),
            next_review: srsResult.nextReview.toISOString(),
            ease_factor: srsResult.easeFactor,
            interval: srsResult.interval,
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            card_id: cardId,
            times_reviewed: 1,
            correct_count: correct ? 1 : 0,
            mastery_level: srsResult.masteryLevel,
            last_reviewed: new Date().toISOString(),
            next_review: srsResult.nextReview.toISOString(),
            ease_factor: srsResult.easeFactor,
            interval: srsResult.interval,
          });
      }

      await updateDailyActivity(user.id, today, xpEarned);
      await addXPToUser(user.id, xpEarned);

      set({ 
        todayProgress: (stats?.totalReviewed || 0) + 1 
      });

      await get().fetchStats();
    } catch (error) {
      console.error('Failed to record review:', error);
    }
  },

  setDailyGoal: (goal: number) => {
    set({ dailyGoal: goal });
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      settings.dailyGoal = goal;
      localStorage.setItem('userSettings', JSON.stringify(settings));
    }
  },

  addXP: async (amount: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await addXPToUser(user.id, amount);
      await get().fetchStats();
    } catch (error) {
      console.error('Failed to add XP:', error);
    }
  },

  checkAchievements: async () => {
    const { stats, achievements } = get();
    if (!stats) return;

      const newAchievements = [...achievements];
      
      if (stats.totalReviewed >= 1 && !newAchievements.includes('first_card')) {
        newAchievements.push('first_card');
      }
      if (stats.totalReviewed >= 100 && !newAchievements.includes('hundred_cards')) {
        newAchievements.push('hundred_cards');
      }
      if (stats.streak >= 7 && !newAchievements.includes('week_streak')) {
        newAchievements.push('week_streak');
      }
      if (stats.streak >= 30 && !newAchievements.includes('month_streak')) {
        newAchievements.push('month_streak');
      }
      if (stats.mastered >= 50 && !newAchievements.includes('fifty_mastered')) {
        newAchievements.push('fifty_mastered');
      }
      if (stats.level >= 10 && !newAchievements.includes('level_10')) {
        newAchievements.push('level_10');
      }

      if (newAchievements.length !== achievements.length) {
        set({ achievements: newAchievements });
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('users')
            .update({ achievements: newAchievements })
            .eq('id', user.id);
        }
      }
  },
}));

async function calculateStreak(userId: string): Promise<number> {
  const { data: activities } = await supabase
    .from('daily_activity')
    .select('date, cards_reviewed')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(30);

  if (!activities || activities.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    
    const hasActivity = activities.some((a: { date: string; cards_reviewed: number }) => a.date === dateStr && a.cards_reviewed > 0);
    
    if (hasActivity) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}

async function updateDailyActivity(userId: string, date: string, xpEarned: number) {
  const { data: existing } = await supabase
    .from('daily_activity')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single();

  if (existing) {
    await supabase
      .from('daily_activity')
      .update({
        cards_reviewed: existing.cards_reviewed + 1,
        xp_earned: existing.xp_earned + xpEarned,
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('daily_activity')
      .insert({
        user_id: userId,
        date,
        cards_reviewed: 1,
        xp_earned: xpEarned,
      });
  }
}

async function addXPToUser(userId: string, xpToAdd: number) {
  const { data: user } = await supabase
    .from('users')
    .select('xp, level')
    .eq('id', userId)
    .single();

  if (user) {
    const newXP = (user.xp || 0) + xpToAdd;
    const newLevel = calculateLevel(newXP);
    
    await supabase
      .from('users')
      .update({ xp: newXP, level: newLevel })
      .eq('id', userId);
  }
}

export { calculateLevel, getXPForNextLevel };
