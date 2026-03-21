import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  serverUrl: string | null;
  setServerUrl: (url: string) => Promise<void>;
  token: string | null;
  setToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  serverUrl: null,
  token: null,
  isHydrated: false,

  setServerUrl: async (url: string) => {
    await AsyncStorage.setItem('serverUrl', url);
    set({ serverUrl: url });
  },

  setToken: async (token: string) => {
    await SecureStore.setItemAsync('token', token);
    set({ token });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    // We do not wipe the Server URL on logout, just the secure token
    set({ token: null });
  },

  hydrate: async () => {
    try {
      const url = await AsyncStorage.getItem('serverUrl');
      
      let token = null;
      try {
        // SecureStore might error out on some emulators without a passcode
        token = await SecureStore.getItemAsync('token');
      } catch (e) {
        console.warn('SecureStore unavailable', e);
      }
      
      set({ serverUrl: url, token, isHydrated: true });
    } catch (e) {
      console.error('Hydration failed', e);
      set({ isHydrated: true });
    }
  },
}));
