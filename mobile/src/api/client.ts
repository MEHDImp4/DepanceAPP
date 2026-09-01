import { Platform } from 'react-native';
import { secureSession } from '@/auth/secureSession';
import type { MobileLoginResponse, TokenPair, User } from '@/auth/types';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

const requireApiUrl = (): string => {
  if (!API_URL) throw new ApiError('EXPO_PUBLIC_API_URL n’est pas configurée', 0, 'MISSING_API_URL');
  if (!__DEV__ && !API_URL.startsWith('https://')) {
    throw new ApiError('HTTPS est obligatoire en production', 0, 'INSECURE_API_URL');
  }
  return API_URL;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly requestId?: string
  ) {
    super(message);
  }
}

const parse = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) return undefined as T;
  const body = await response.json() as T & { error?: string; code?: string; requestId?: string };
  if (!response.ok) throw new ApiError(body.error ?? 'Une erreur est survenue', response.status, body.code, body.requestId);
  return body;
};

const request = async <T>(path: string, init: RequestInit = {}, retry = true): Promise<T> => {
  const baseUrl = requireApiUrl();
  const session = await secureSession.read();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...init.headers
    }
  });

  if (response.status === 401 && retry && session?.refreshToken) {
    const refreshed = await refresh(session.refreshToken);
    await secureSession.write(refreshed);
    return request<T>(path, init, false);
  }
  return parse<T>(response);
};

let refreshInFlight: Promise<TokenPair> | null = null;
const refresh = (refreshToken: string): Promise<TokenPair> => {
  const baseUrl = requireApiUrl();
  if (!refreshInFlight) {
    refreshInFlight = secureSession.deviceId()
      .then(deviceId => fetch(`${baseUrl}/auth/mobile/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken, deviceId })
      }))
      .then(parse<TokenPair>)
      .catch(async error => {
        await secureSession.clear();
        throw error;
      })
      .finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
};

export const api = {
  async login(identifier: string, password: string): Promise<MobileLoginResponse> {
    const baseUrl = requireApiUrl();
    const deviceId = await secureSession.deviceId();
    const response = await fetch(`${baseUrl}/auth/mobile/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, deviceId, deviceName: `${Platform.OS} device` })
    });
    const session = await parse<MobileLoginResponse>(response);
    await secureSession.write(session);
    return session;
  },

  profile: () => request<User>('/auth/profile'),

  async logout(): Promise<void> {
    const [session, deviceId] = await Promise.all([secureSession.read(), secureSession.deviceId()]);
    try {
      if (session?.refreshToken) {
        await request<void>('/auth/mobile/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: session.refreshToken, deviceId })
        }, false);
      }
    } finally {
      await secureSession.clear();
    }
  }
};
