import axios, { AxiosError, type AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '@/store/auth-store';
import {
    clearSessionTokens,
    getCachedSessionTokens,
    hydrateSessionTokens,
    updateTokensFromHeaders,
} from '@/lib/token-storage';

export function resolveApiBaseUrl(): string {
    const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
    if (envUrl) {
        return envUrl.replace(/\/+$/, '');
    }
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:3000/api';
    }
    return 'http://localhost:3000/api';
}

const api = axios.create({
    baseURL: resolveApiBaseUrl(),
    withCredentials: true,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

let isRefreshing = false;

interface RetryableRequest extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

interface QueueEntry {
    resolve: () => void;
    reject: (error: unknown) => void;
}

interface ApiErrorBody {
    code?: string;
    error?: string;
}

let failedQueue: QueueEntry[] = [];

const processQueue = (error?: unknown) => {
    failedQueue.forEach((promise) => {
        if (error) promise.reject(error);
        else promise.resolve();
    });
    failedQueue = [];
};

const refreshableCodes = new Set([
    'AUTH_TOKEN_MISSING',
    'ACCESS_TOKEN_EXPIRED',
    'ACCESS_TOKEN_INVALID',
]);

api.interceptors.request.use(async (config) => {
    await hydrateSessionTokens();
    const { token, refreshToken } = getCachedSessionTokens();

    if (Platform.OS !== 'web') {
        const headers = config.headers as AxiosHeaders;
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        } else {
            headers.delete('Authorization');
        }

        const cookieParts: string[] = [];
        if (token) cookieParts.push(`token=${encodeURIComponent(token)}`);
        if (refreshToken) cookieParts.push(`refreshToken=${encodeURIComponent(refreshToken)}`);
        if (cookieParts.length > 0) {
            headers.set('Cookie', cookieParts.join('; '));
        } else {
            headers.delete('Cookie');
        }
    }

    return config;
});

api.interceptors.response.use(
    async (response) => {
        await updateTokensFromHeaders(response.headers as Record<string, unknown>);
        return response;
    },
    async (error: AxiosError<ApiErrorBody>) => {
        if (error.response?.headers) {
            await updateTokensFromHeaders(error.response.headers as Record<string, unknown>);
        }

        const originalRequest = error.config as RetryableRequest | undefined;
        if (!originalRequest) return Promise.reject(error);

        if (originalRequest.url?.includes('/auth/refresh')) {
            await clearSessionTokens();
            useAuthStore.getState().logout();
            return Promise.reject(error);
        }

        const code = error.response?.data?.code;
        const shouldRefresh =
            error.response?.status === 401 && Boolean(code && refreshableCodes.has(code));

        if (shouldRefresh && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise<void>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => api(originalRequest));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await api.post('/auth/refresh');
                processQueue();
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                await clearSessionTokens();
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
