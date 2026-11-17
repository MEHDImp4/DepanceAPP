import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'depance_access_token';
const REFRESH_TOKEN_KEY = 'depance_refresh_token';

interface SessionTokens {
    token: string | null;
    refreshToken: string | null;
}

let cachedTokens: SessionTokens = {
    token: null,
    refreshToken: null,
};

let hydrated = false;

function isWebPlatform(): boolean {
    return Platform.OS === 'web';
}

export function splitSetCookieHeader(raw: string | string[]): string[] {
    if (Array.isArray(raw)) {
        return raw.flatMap((entry) => splitSetCookieHeader(entry));
    }
    if (!raw || typeof raw !== 'string') {
        return [];
    }
    // Split on comma only when followed by a cookie key=value pair, preserving commas inside Expires=Thu, ...
    return raw.split(/,(?=\s*[^;,\s]+=)/).map((s) => s.trim()).filter(Boolean);
}

function isCookieCleared(cookieString: string, value: string): boolean {
    if (!value) return true;
    const lower = cookieString.toLowerCase();
    if (/max-age\s*=\s*0\b/.test(lower)) return true;
    if (/expires\s*=\s*thu,\s*01\s+jan\s+1970/.test(lower)) return true;
    return false;
}

export function parseAuthCookiesFromSetCookie(raw: string | string[] | undefined): {
    token?: string | null;
    refreshToken?: string | null;
} {
    if (!raw) return {};

    const result: { token?: string | null; refreshToken?: string | null } = {};
    const cookies = splitSetCookieHeader(raw);

    for (const cookieStr of cookies) {
        const firstPart = cookieStr.split(';')[0]?.trim();
        if (!firstPart) continue;
        const eqIdx = firstPart.indexOf('=');
        if (eqIdx <= 0) continue;

        const name = firstPart.slice(0, eqIdx).trim();
        const rawValue = firstPart.slice(eqIdx + 1).trim();
        const value = decodeURIComponent(rawValue);

        if (name === 'token') {
            result.token = isCookieCleared(cookieStr, value) ? null : value;
        } else if (name === 'refreshToken') {
            result.refreshToken = isCookieCleared(cookieStr, value) ? null : value;
        }
    }

    return result;
}

async function persistKey(key: string, value: string | null): Promise<void> {
    if (isWebPlatform()) return;
    try {
        if (value) {
            await SecureStore.setItemAsync(key, value, {
                keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
            });
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    } catch {
        // Ignore SecureStore unavailability in test environments
    }
}

export async function hydrateSessionTokens(): Promise<SessionTokens> {
    if (hydrated || isWebPlatform()) {
        hydrated = true;
        return { ...cachedTokens };
    }

    try {
        const [token, refreshToken] = await Promise.all([
            SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
            SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
        ]);
        cachedTokens = {
            token: token || null,
            refreshToken: refreshToken || null,
        };
    } catch {
        cachedTokens = { token: null, refreshToken: null };
    }
    hydrated = true;
    return { ...cachedTokens };
}

export function getCachedSessionTokens(): SessionTokens {
    return { ...cachedTokens };
}

export async function updateTokensFromHeaders(
    headers: Record<string, unknown> | undefined
): Promise<void> {
    if (!headers || isWebPlatform()) return;

    const rawSetCookie = (headers['set-cookie'] ?? headers['Set-Cookie']) as
        | string
        | string[]
        | undefined;

    if (!rawSetCookie) return;

    const parsed = parseAuthCookiesFromSetCookie(rawSetCookie);
    const updates: Promise<void>[] = [];

    if (parsed.token !== undefined) {
        cachedTokens.token = parsed.token;
        updates.push(persistKey(ACCESS_TOKEN_KEY, parsed.token));
    }

    if (parsed.refreshToken !== undefined) {
        cachedTokens.refreshToken = parsed.refreshToken;
        updates.push(persistKey(REFRESH_TOKEN_KEY, parsed.refreshToken));
    }

    if (updates.length > 0) {
        hydrated = true;
        await Promise.all(updates);
    }
}

export async function setSessionTokens(tokens: Partial<SessionTokens>): Promise<void> {
    const updates: Promise<void>[] = [];

    if (tokens.token !== undefined) {
        cachedTokens.token = tokens.token;
        updates.push(persistKey(ACCESS_TOKEN_KEY, tokens.token));
    }

    if (tokens.refreshToken !== undefined) {
        cachedTokens.refreshToken = tokens.refreshToken;
        updates.push(persistKey(REFRESH_TOKEN_KEY, tokens.refreshToken));
    }

    hydrated = true;
    await Promise.all(updates);
}

export async function clearSessionTokens(): Promise<void> {
    cachedTokens = { token: null, refreshToken: null };
    hydrated = true;
    await Promise.all([
        persistKey(ACCESS_TOKEN_KEY, null),
        persistKey(REFRESH_TOKEN_KEY, null),
    ]);
}

export function resetTokenCacheForTests(): void {
    cachedTokens = { token: null, refreshToken: null };
    hydrated = false;
}
