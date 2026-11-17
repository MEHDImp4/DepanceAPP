import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DARK_THEME, LIGHT_THEME, type ThemeMode, type ThemePalette } from '@/constants/theme';

const THEME_STORAGE_KEY = 'theme';

interface ThemeState {
    theme: ThemeMode;
    colors: ThemePalette;
    isHydrated: boolean;
    toggleTheme: () => void;
    setTheme: (theme: ThemeMode) => void;
    hydrateTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>()((set, get) => ({
    theme: 'dark',
    colors: DARK_THEME,
    isHydrated: false,
    toggleTheme: () => {
        const nextTheme: ThemeMode = get().theme === 'light' ? 'dark' : 'light';
        set({
            theme: nextTheme,
            colors: nextTheme === 'dark' ? DARK_THEME : LIGHT_THEME,
        });
        AsyncStorage.setItem(THEME_STORAGE_KEY, nextTheme).catch(() => {});
    },
    setTheme: (nextTheme) => {
        set({
            theme: nextTheme,
            colors: nextTheme === 'dark' ? DARK_THEME : LIGHT_THEME,
        });
        AsyncStorage.setItem(THEME_STORAGE_KEY, nextTheme).catch(() => {});
    },
    hydrateTheme: async () => {
        try {
            const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (saved === 'light' || saved === 'dark') {
                set({
                    theme: saved,
                    colors: saved === 'dark' ? DARK_THEME : LIGHT_THEME,
                    isHydrated: true,
                });
                return;
            }
        } catch {
            // Default to OLED dark mode
        }
        set({ theme: 'dark', colors: DARK_THEME, isHydrated: true });
    },
}));
