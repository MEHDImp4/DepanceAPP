import { AxiosError } from 'axios';
import {
    parseAuthCookiesFromSetCookie,
    splitSetCookieHeader,
    hydrateSessionTokens,
    getCachedSessionTokens,
    updateTokensFromHeaders,
    clearSessionTokens,
    resetTokenCacheForTests,
} from '@/lib/token-storage';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/auth-store';
import * as SecureStore from 'expo-secure-store';

const mockSecureMemory = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 6,
    setItemAsync: jest.fn(async (key: string, val: string) => {
        mockSecureMemory.set(key, val);
    }),
    getItemAsync: jest.fn(
        async (key: string) => mockSecureMemory.get(key) ?? null
    ),
    deleteItemAsync: jest.fn(async (key: string) => {
        mockSecureMemory.delete(key);
    }),
}));

describe('token-storage and axios refresh flow', () => {
    beforeEach(() => {
        mockSecureMemory.clear();
        resetTokenCacheForTests();
        jest.clearAllMocks();
        useAuthStore.setState({
            user: {
                id: 42,
                email: 'test@depance.app',
                username: 'tester',
                currency: 'USD',
                timezone: 'UTC',
            },
            isAuthenticated: true,
            isInitialized: true,
        });
    });

    it('splits Set-Cookie headers safely without breaking on Expires commas', () => {
        const header =
            'refreshToken=ref-123; Max-Age=2592000; Path=/; Expires=Thu, 17 Dec 2026 10:00:00 GMT; HttpOnly; SameSite=Strict, token=acc-456; Max-Age=900; Path=/; HttpOnly';
        const parts = splitSetCookieHeader(header);
        expect(parts).toHaveLength(2);

        const parsed = parseAuthCookiesFromSetCookie(header);
        expect(parsed).toEqual({
            refreshToken: 'ref-123',
            token: 'acc-456',
        });
    });

    it('detects cleared cookies via empty value, Max-Age=0, or epoch Expires', () => {
        const cleared = parseAuthCookiesFromSetCookie([
            'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
            'token=old; Max-Age=0; Path=/; HttpOnly',
        ]);
        expect(cleared).toEqual({
            refreshToken: null,
            token: null,
        });
    });

    it('persists and rehydrates tokens across simulated app restart', async () => {
        await updateTokensFromHeaders({
            'set-cookie': [
                'token=persisted-access; Path=/; HttpOnly',
                'refreshToken=persisted-refresh; Path=/; HttpOnly',
            ],
        });

        expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2);

        // Simulate cold restart by wiping only in-memory cache
        resetTokenCacheForTests();
        expect(getCachedSessionTokens()).toEqual({
            token: null,
            refreshToken: null,
        });

        const rehydrated = await hydrateSessionTokens();
        expect(rehydrated).toEqual({
            token: 'persisted-access',
            refreshToken: 'persisted-refresh',
        });

        await clearSessionTokens();
        expect(getCachedSessionTokens()).toEqual({
            token: null,
            refreshToken: null,
        });
    });

    it('queues concurrent 401 requests during a single /auth/refresh rotation', async () => {
        await updateTokensFromHeaders({
            'set-cookie': [
                'token=expired-access; Path=/; HttpOnly',
                'refreshToken=valid-refresh-1; Path=/; HttpOnly',
            ],
        });

        let refreshCalls = 0;
        let dataCalls = 0;

        api.defaults.adapter = async (config) => {
            if (config.url?.includes('/auth/refresh')) {
                refreshCalls += 1;
                await new Promise((r) => setTimeout(r, 20));
                return {
                    status: 200,
                    statusText: 'OK',
                    headers: {
                        'set-cookie': [
                            'token=fresh-access-2; Path=/; HttpOnly',
                            'refreshToken=valid-refresh-2; Path=/; HttpOnly',
                        ],
                    },
                    config,
                    data: { message: 'Token refreshed' },
                };
            }

            dataCalls += 1;
            const authHeader =
                typeof config.headers?.get === 'function'
                    ? config.headers.get('Authorization')
                    : config.headers?.Authorization;

            if (authHeader !== 'Bearer fresh-access-2') {
                const err = new AxiosError(
                    'Access token expired',
                    '401',
                    config,
                    undefined,
                    {
                        status: 401,
                        statusText: 'Unauthorized',
                        headers: {},
                        config,
                        data: {
                            error: 'Access token expired',
                            code: 'ACCESS_TOKEN_EXPIRED',
                        },
                    }
                );
                throw err;
            }

            return {
                status: 200,
                statusText: 'OK',
                headers: {},
                config,
                data: [{ id: 1, name: 'Main Bank' }],
            };
        };

        const [res1, res2] = await Promise.all([
            api.get('/accounts'),
            api.get('/transactions'),
        ]);

        expect(refreshCalls).toBe(1);
        expect(dataCalls).toBe(4);
        expect(res1.status).toBe(200);
        expect(res2.status).toBe(200);
        expect(getCachedSessionTokens()).toEqual({
            token: 'fresh-access-2',
            refreshToken: 'valid-refresh-2',
        });
    });

    it('logs out and clears SecureStore if /auth/refresh fails', async () => {
        await updateTokensFromHeaders({
            'set-cookie': [
                'token=expired-access; Path=/; HttpOnly',
                'refreshToken=revoked-refresh; Path=/; HttpOnly',
            ],
        });

        api.defaults.adapter = async (config) => {
            const code = config.url?.includes('/auth/refresh')
                ? 'REFRESH_TOKEN_REVOKED'
                : 'ACCESS_TOKEN_EXPIRED';
            throw new AxiosError(
                'Unauthorized',
                '401',
                config,
                undefined,
                {
                    status: 401,
                    statusText: 'Unauthorized',
                    headers: {},
                    config,
                    data: { code },
                }
            );
        };

        await expect(api.get('/accounts')).rejects.toThrow();

        expect(useAuthStore.getState().isAuthenticated).toBe(false);
        expect(useAuthStore.getState().user).toBeNull();
        expect(getCachedSessionTokens()).toEqual({
            token: null,
            refreshToken: null,
        });
    });
});
