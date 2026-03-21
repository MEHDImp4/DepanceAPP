import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  serverUrl: string | null;
  setServerUrl: (url: string) => Promise<void>;
  token: string | null;
  setToken: (token: string) => Promise<void>;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => Promise<void>;
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  logout: () => Promise<void>;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  serverUrl: null,
  token: null,
  theme: 'dark',
  language: 'en',
  notificationsEnabled: true,
  isHydrated: false,

  setServerUrl: async (url: string) => {
    await AsyncStorage.setItem('serverUrl', url);
    set({ serverUrl: url });
  },

  setToken: async (token: string) => {
    await SecureStore.setItemAsync('token', token);
    set({ token });
  },

  setTheme: async (theme: 'dark' | 'light') => {
    await AsyncStorage.setItem('theme', theme);
    set({ theme });
  },

  setLanguage: async (language: string) => {
    await AsyncStorage.setItem('language', language);
    set({ language });
  },

  setNotificationsEnabled: async (enabled: boolean) => {
    await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(enabled));
    set({ notificationsEnabled: enabled });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    // We do not wipe the Server URL on logout, just the secure token
    set({ token: null });
  },

  hydrate: async () => {
    try {
      const url = await AsyncStorage.getItem('serverUrl');
      const theme = await AsyncStorage.getItem('theme') as 'dark' | 'light' | null;
      const language = await AsyncStorage.getItem('language');
      const notificationsStr = await AsyncStorage.getItem('notificationsEnabled');
      
      let token = null;
      try {
        // SecureStore might error out on some emulators without a passcode
        token = await SecureStore.getItemAsync('token');
      } catch (e) {
        console.warn('SecureStore unavailable', e);
      }
      
      const updates: Partial<AppState> = { serverUrl: url, token, isHydrated: true };
      if (theme) updates.theme = theme;
      if (language) updates.language = language;
      if (notificationsStr) updates.notificationsEnabled = JSON.parse(notificationsStr);
      
      set(updates);
    } catch (e) {
      console.error('Hydration failed', e);
      set({ isHydrated: true });
    }
  },
}));
