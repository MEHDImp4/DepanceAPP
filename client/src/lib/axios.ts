import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth-store';

const axiosOptions = {
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
};

const api = axios.create(axiosOptions);
// Deliberately has no response interceptor so session probing/refresh cannot recurse.
const authApi = axios.create(axiosOptions);

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
    failedQueue.forEach(promise => {
        if (error) promise.reject(error);
        else promise.resolve();
    });
    failedQueue = [];
};

const refreshableCodes = new Set([
    'AUTH_TOKEN_MISSING',
    'ACCESS_TOKEN_EXPIRED',
    'ACCESS_TOKEN_INVALID'
]);

const sessionIsAlreadyValid = async (): Promise<boolean> => {
    try {
        await authApi.get('/auth/profile');
        return true;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) return false;
        throw error;
    }
};

const performRefresh = async (): Promise<void> => {
    // Another tab may have refreshed while this request was waiting for the lock.
    if (await sessionIsAlreadyValid()) return;

    try {
        await authApi.post('/auth/refresh');
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data?.code === 'REFRESH_TOKEN_RACE') {
            // The server deliberately keeps the session alive for this race. If the
            // winning response has already updated the shared cookie jar, recover now.
            if (await sessionIsAlreadyValid()) return;
        }
        throw error;
    }
};

const refreshAcrossTabs = async (): Promise<void> => {
    if (typeof navigator !== 'undefined' && navigator.locks?.request) {
        await navigator.locks.request('depance-auth-refresh', async () => {
            await performRefresh();
        });
        return;
    }

    await performRefresh();
};

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiErrorBody>) => {
        const originalRequest = error.config as RetryableRequest | undefined;
        if (!originalRequest) return Promise.reject(error);

        const code = error.response?.data?.code;
        const shouldRefresh = error.response?.status === 401 && Boolean(code && refreshableCodes.has(code));

        if (shouldRefresh && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise<void>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => api(originalRequest));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await refreshAcrossTabs();
                processQueue();
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                const refreshCode = refreshError instanceof AxiosError
                    ? refreshError.response?.data?.code
                    : undefined;

                // A rotation race is recoverable and must never log out another tab's
                // valid session. A later request can retry after the winning cookie lands.
                if (refreshCode !== 'REFRESH_TOKEN_RACE') {
                    useAuthStore.getState().logout();
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
