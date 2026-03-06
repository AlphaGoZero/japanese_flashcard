import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface StudyPlan {
  id: string;
  name: string;
  dailyTarget: number;
  weeklyTarget: number;
  preferredTime: string | null;
  targetDecks: string[];
  daysOfWeek: number[];
  isActive: boolean;
  createdAt: string;
}

interface StudyPlanState {
  plans: StudyPlan[];
  activePlan: StudyPlan | null;
  isLoading: boolean;
  fetchPlans: () => Promise<void>;
  createPlan: (plan: Omit<StudyPlan, 'id' | 'createdAt'>) => Promise<void>;
  updatePlan: (id: string, plan: Partial<StudyPlan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  setActivePlan: (plan: StudyPlan | null) => void;
}

export const useStudyPlanStore = create<StudyPlanState>((set) => ({
  plans: [],
  activePlan: null,
  isLoading: false,

  fetchPlans: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const plans = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        dailyTarget: p.daily_target,
        weeklyTarget: p.weekly_target,
        preferredTime: p.preferred_time,
        targetDecks: p.target_decks || [],
        daysOfWeek: p.days_of_week || [0, 1, 2, 3, 4, 5, 6],
        isActive: p.is_active,
        createdAt: p.created_at,
      }));

      const activePlan = plans.find(p => p.isActive) || null;

      set({ plans, activePlan, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      set({ isLoading: false });
    }
  },

  createPlan: async (plan) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('study_plans')
        .insert({
          user_id: user.id,
          name: plan.name,
          daily_target: plan.dailyTarget,
          weekly_target: plan.weeklyTarget,
          preferred_time: plan.preferredTime,
          target_decks: plan.targetDecks,
          days_of_week: plan.daysOfWeek,
          is_active: plan.isActive,
        })
        .select()
        .single();

      if (error) throw error;

      const newPlan: StudyPlan = {
        id: data.id,
        name: data.name,
        dailyTarget: data.daily_target,
        weeklyTarget: data.weekly_target,
        preferredTime: data.preferred_time,
        targetDecks: data.target_decks || [],
        daysOfWeek: data.days_of_week || [0, 1, 2, 3, 4, 5, 6],
        isActive: data.is_active,
        createdAt: data.created_at,
      };

      set((state) => ({
        plans: [newPlan, ...state.plans],
        activePlan: newPlan.isActive ? newPlan : state.activePlan,
      }));
    } catch (error) {
      console.error('Failed to create plan:', error);
    }
  },

  updatePlan: async (id, planUpdate) => {
    try {
      const updateData: any = {};
      if (planUpdate.name !== undefined) updateData.name = planUpdate.name;
      if (planUpdate.dailyTarget !== undefined) updateData.daily_target = planUpdate.dailyTarget;
      if (planUpdate.weeklyTarget !== undefined) updateData.weekly_target = planUpdate.weeklyTarget;
      if (planUpdate.preferredTime !== undefined) updateData.preferred_time = planUpdate.preferredTime;
      if (planUpdate.targetDecks !== undefined) updateData.target_decks = planUpdate.targetDecks;
      if (planUpdate.daysOfWeek !== undefined) updateData.days_of_week = planUpdate.daysOfWeek;
      if (planUpdate.isActive !== undefined) updateData.is_active = planUpdate.isActive;
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('study_plans')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        plans: state.plans.map(p => 
          p.id === id ? { ...p, ...planUpdate } : p
        ),
        activePlan: state.activePlan?.id === id 
          ? { ...state.activePlan, ...planUpdate }
          : planUpdate.isActive 
            ? state.plans.find(p => p.id === id) || null
            : state.activePlan
      }));
    } catch (error) {
      console.error('Failed to update plan:', error);
    }
  },

  deletePlan: async (id) => {
    try {
      const { error } = await supabase
        .from('study_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        plans: state.plans.filter(p => p.id !== id),
        activePlan: state.activePlan?.id === id ? null : state.activePlan,
      }));
    } catch (error) {
      console.error('Failed to delete plan:', error);
    }
  },

  setActivePlan: (plan) => set({ activePlan: plan }),
}));
