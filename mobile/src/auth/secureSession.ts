import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import type { TokenPair } from './types';

const ACCESS_TOKEN_KEY = 'depance.accessToken';
const REFRESH_TOKEN_KEY = 'depance.refreshToken';
const DEVICE_ID_KEY = 'depance.deviceId';

export const secureSession = {
  async read(): Promise<Pick<TokenPair, 'accessToken' | 'refreshToken'> | null> {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
    ]);
    return accessToken && refreshToken ? { accessToken, refreshToken } : null;
  },

  async write(tokens: Pick<TokenPair, 'accessToken' | 'refreshToken'>): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken)
    ]);
  },

  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
    ]);
  },

  async deviceId(): Promise<string> {
    const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (existing) return existing;
    const created = Crypto.randomUUID();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, created);
    return created;
  }
};
