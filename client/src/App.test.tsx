import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { useAuthStore } from './store/auth-store';

vi.mock('./lib/axios', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('App', () => {
    beforeEach(() => {
        useAuthStore.setState({
            user: null,
            isAuthenticated: false,
            isInitialized: true,
        });
        window.history.replaceState({}, '', '/login');
    });

    it('renders without making session network requests', () => {
        expect(() => render(<App />)).not.toThrow();
    });
});
