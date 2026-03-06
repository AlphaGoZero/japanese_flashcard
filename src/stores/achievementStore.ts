import { create } from 'zustand';
import { supabase } from '../services/supabase';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirementType: string;
  requirementValue: number;
  xpReward: number;
}

export interface UserAchievement extends Achievement {
  unlockedAt: string;
  progress: number;
  isUnlocked: boolean;
}

interface AchievementState {
  achievements: Achievement[];
  userAchievements: UserAchievementsMap;
  isLoading: boolean;
  newAchievements: Achievement[];
  fetchAchievements: () => Promise<void>;
  fetchUserAchievements: () => Promise<void>;
  checkAndUnlockAchievements: () => Promise<void>;
  clearNewAchievements: () => void;
}

interface UserAchievementsMap {
  [key: string]: {
    unlockedAt: string;
    progress: number;
    isUnlocked: boolean;
  };
}

export const useAchievementStore = create<AchievementState>((set, get) => ({
  achievements: [],
  userAchievements: {},
  isLoading: false,
  newAchievements: [],

  fetchAchievements: async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;

      const achievements = (data || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        category: a.category,
        requirementType: a.requirement_type,
        requirementValue: a.requirement_value,
        xpReward: a.xp_reward,
      }));

      set({ achievements });
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    }
  },

  fetchUserAchievements: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', user.id);

      if (error) throw error;

      const userAchievements: UserAchievementsMap = {};
      (data || []).forEach((ua: any) => {
        userAchievements[ua.achievement_id] = {
          unlockedAt: ua.unlocked_at,
          progress: ua.progress || ua.achievements?.requirement_value || 0,
          isUnlocked: true,
        };
      });

      set({ userAchievements, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch user achievements:', error);
      set({ isLoading: false });
    }
  },

  checkAndUnlockAchievements: async () => {
    const { achievements, userAchievements } = get();
    const newUnlocks: Achievement[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [progressResult, quizResult, gameResult] = await Promise.all([
        supabase.from('user_progress').select('*').eq('user_id', user.id),
        supabase.from('quiz_results').select('*').eq('user_id', user.id),
        supabase.from('game_results').select('*').eq('user_id', user.id),
      ]);

      const progress = progressResult.data || [];
      const quizzes = quizResult.data || [];
      const games = gameResult.data || [];

      const totalReviewed = progress.reduce((acc, p) => acc + p.times_reviewed, 0);
      const mastered = progress.filter(p => p.mastery_level >= 8).length;
      const perfectQuizzes = quizzes.filter((q: any) => q.score === q.total_questions).length;
      const quizzesCompleted = quizzes.length;
      const gamesPlayed = games.length;
      
      const now = new Date();
      const hour = now.getHours();
      const isNightStudy = hour >= 22 || hour < 5;
      const isEarlyStudy = hour >= 5 && hour < 7;

      const { data: userData } = await supabase
        .from('users')
        .select('xp, level, daily_goal')
        .eq('id', user.id)
        .single();

      const userLevel = userData?.level || 1;

      for (const achievement of achievements) {
        if (userAchievements[achievement.id]?.isUnlocked) continue;

        let shouldUnlock = false;
        let progressValue = 0;

        switch (achievement.requirementType) {
          case 'cards_reviewed':
            progressValue = totalReviewed;
            shouldUnlock = totalReviewed >= achievement.requirementValue;
            break;
          case 'cards_mastered':
            progressValue = mastered;
            shouldUnlock = mastered >= achievement.requirementValue;
            break;
          case 'perfect_quiz':
            progressValue = perfectQuizzes;
            shouldUnlock = perfectQuizzes >= achievement.requirementValue;
            break;
          case 'quizzes_completed':
            progressValue = quizzesCompleted;
            shouldUnlock = quizzesCompleted >= achievement.requirementValue;
            break;
          case 'games_played':
            progressValue = gamesPlayed;
            shouldUnlock = gamesPlayed >= achievement.requirementValue;
            break;
          case 'user_level':
            progressValue = userLevel;
            shouldUnlock = userLevel >= achievement.requirementValue;
            break;
          case 'night_study':
            progressValue = isNightStudy ? 1 : 0;
            shouldUnlock = isNightStudy;
            break;
          case 'early_study':
            progressValue = isEarlyStudy ? 1 : 0;
            shouldUnlock = isEarlyStudy;
            break;
        }

        if (shouldUnlock) {
          await supabase.from('user_achievements').insert({
            user_id: user.id,
            achievement_id: achievement.id,
            progress: achievement.requirementValue,
          });

          if (achievement.xpReward > 0) {
            const newXP = (userData?.xp || 0) + achievement.xpReward;
            await supabase.from('users').update({ xp: newXP }).eq('id', user.id);
          }

          newUnlocks.push(achievement);
        } else if (progressValue > 0) {
          await supabase.from('user_achievements').upsert({
            user_id: user.id,
            achievement_id: achievement.id,
            progress: progressValue,
          }, { onConflict: 'user_id,achievement_id' });
        }
      }

      if (newUnlocks.length > 0) {
        set({ newAchievements: newUnlocks });
      }

      await get().fetchUserAchievements();
    } catch (error) {
      console.error('Failed to check achievements:', error);
    }
  },

  clearNewAchievements: () => {
    set({ newAchievements: [] });
  },
}));
