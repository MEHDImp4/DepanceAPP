import { QueryClient, focusManager } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Platform, type AppStateStatus } from 'react-native';

export function onAppStateChange(status: AppStateStatus) {
    if (Platform.OS !== 'web') {
        focusManager.setFocused(status === 'active');
    }
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 30, // 30 minutes
            refetchOnWindowFocus: Platform.OS !== 'web',
            retry: (failureCount, error) => {
                if (isAxiosError(error) && error.response?.status === 401) {
                    return false;
                }
                return failureCount < 1;
            },
        },
    },
});
