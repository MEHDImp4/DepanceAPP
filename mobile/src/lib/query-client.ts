import { QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 30, // 30 minutes
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
                if (isAxiosError(error) && error.response?.status === 401) {
                    return false;
                }
                return failureCount < 1;
            },
        },
    },
});
