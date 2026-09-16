import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth-store';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
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

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiErrorBody>) => {
        const originalRequest = error.config as RetryableRequest | undefined;
        if (!originalRequest) return Promise.reject(error);

        if (originalRequest.url?.includes('/auth/refresh')) {
            useAuthStore.getState().logout();
            return Promise.reject(error);
        }

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
                await api.post('/auth/refresh');
                processQueue();
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
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
