import { create } from 'zustand';
import { supabase } from '../services/supabase';

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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        set({ stats: { totalReviewed: 0, mastered: 0, learning: 0, streak: 0 }, isLoading: false });
        return;
      }

      // Get total reviewed
      const { count: totalReviewed } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get mastered (mastery_level >= 5)
      const { count: mastered } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('mastery_level', 5);

      // Get learning (mastery_level > 0 and < 5)
      const { count: learning } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gt('mastery_level', 0)
        .lt('mastery_level', 5);

      set({ 
        stats: { 
          totalReviewed: totalReviewed || 0, 
          mastered: mastered || 0, 
          learning: learning || 0,
          streak: 0, // Would need separate tracking
        }, 
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch progress:', error);
      set({ stats: { totalReviewed: 0, mastered: 0, learning: 0, streak: 0 }, isLoading: false });
    }
  },

  recordReview: async (cardId: string, correct: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('card_id', cardId)
        .single();

      if (existing) {
        await supabase
          .from('user_progress')
          .update({
            times_reviewed: existing.times_reviewed + 1,
            correct_count: correct ? existing.correct_count + 1 : existing.correct_count,
            mastery_level: correct ? Math.min(existing.mastery_level + 1, 10) : Math.max(existing.mastery_level - 1, 0),
            last_reviewed: new Date().toISOString(),
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
            mastery_level: correct ? 1 : 0,
            last_reviewed: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error('Failed to record review:', error);
    }
  },
}));
