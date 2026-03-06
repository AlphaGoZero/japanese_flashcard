import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeConfig {
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  animations: boolean;
  highContrast: boolean;
}

interface ThemeState {
  theme: Theme;
  themeConfig: ThemeConfig;
  setTheme: (theme: Theme) => void;
  setThemeConfig: (config: Partial<ThemeConfig>) => void;
}

const defaultConfig: ThemeConfig = {
  accentColor: '#4F46E5',
  fontSize: 'medium',
  animations: true,
  highContrast: false,
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      themeConfig: defaultConfig,
      setTheme: (theme) => set({ theme }),
      setThemeConfig: (config) => set((state) => ({ 
        themeConfig: { ...state.themeConfig, ...config } 
      })),
    }),
    {
      name: 'theme-storage',
    }
  )
);
