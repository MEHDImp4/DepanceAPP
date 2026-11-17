import { useAuthStore } from '@/store/auth-store';
import { useThemeStore } from '@/store/theme-store';

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
}));

describe('auth and theme stores', () => {
    beforeEach(() => {
        useAuthStore.setState({
            user: null,
            isAuthenticated: false,
            isInitialized: false,
        });
        useThemeStore.getState().setTheme('dark');
    });

    it('transitions through authentication lifecycle cleanly', () => {
        expect(useAuthStore.getState().isAuthenticated).toBe(false);
        expect(useAuthStore.getState().isInitialized).toBe(false);

        const mockUser = {
            id: 1,
            email: 'mehdi@example.com',
            username: 'mehdi',
            currency: 'EUR',
            timezone: 'Africa/Casablanca',
        };

        useAuthStore.getState().setAuth(mockUser);
        expect(useAuthStore.getState().isAuthenticated).toBe(true);
        expect(useAuthStore.getState().isInitialized).toBe(true);
        expect(useAuthStore.getState().user).toEqual(mockUser);

        useAuthStore.getState().logout();
        expect(useAuthStore.getState().isAuthenticated).toBe(false);
        expect(useAuthStore.getState().isInitialized).toBe(true);
        expect(useAuthStore.getState().user).toBeNull();
    });

    it('defaults to dark OLED mode and toggles between dark and light', () => {
        expect(useThemeStore.getState().theme).toBe('dark');
        expect(useThemeStore.getState().colors.background).toBe('#09090B');

        useThemeStore.getState().toggleTheme();
        expect(useThemeStore.getState().theme).toBe('light');
        expect(useThemeStore.getState().colors.background).toBe('#FAFAFA');

        useThemeStore.getState().toggleTheme();
        expect(useThemeStore.getState().theme).toBe('dark');
    });
});
