import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface UserSettings {
  srsPreference: 'relaxed' | 'standard' | 'intensive';
  maxDailyCards: number;
  themeConfig: {
    accentColor: string;
    fontSize: string;
    animations: boolean;
    highContrast: boolean;
  };
  reminderEnabled: boolean;
  reminderTime: string;
  reminderDays: number[];
}

interface SettingsState {
  settings: UserSettings;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {
    srsPreference: 'standard',
    maxDailyCards: 50,
    themeConfig: {
      accentColor: '#4F46E5',
      fontSize: 'medium',
      animations: true,
      highContrast: false,
    },
    reminderEnabled: false,
    reminderTime: '09:00',
    reminderDays: [0, 1, 2, 3, 4, 5, 6],
  },
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('srs_preference, max_daily_cards, theme_config, reminder_enabled, reminder_time, reminder_days')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        set({
          settings: {
            srsPreference: data.srs_preference || 'standard',
            maxDailyCards: data.max_daily_cards || 50,
            themeConfig: data.theme_config || get().settings.themeConfig,
            reminderEnabled: data.reminder_enabled || false,
            reminderTime: data.reminder_time || '09:00',
            reminderDays: data.reminder_days || [0, 1, 2, 3, 4, 5, 6],
          },
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      set({ isLoading: false });
    }
  },

  updateSettings: async (newSettings) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updateData: any = {};
      if (newSettings.srsPreference !== undefined) updateData.srs_preference = newSettings.srsPreference;
      if (newSettings.maxDailyCards !== undefined) updateData.max_daily_cards = newSettings.maxDailyCards;
      if (newSettings.themeConfig !== undefined) updateData.theme_config = newSettings.themeConfig;
      if (newSettings.reminderEnabled !== undefined) updateData.reminder_enabled = newSettings.reminderEnabled;
      if (newSettings.reminderTime !== undefined) updateData.reminder_time = newSettings.reminderTime;
      if (newSettings.reminderDays !== undefined) updateData.reminder_days = newSettings.reminderDays;

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      set((state) => ({
        settings: { ...state.settings, ...newSettings },
      }));
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  },
}));
