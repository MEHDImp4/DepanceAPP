import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/axios';
import type { User } from '@/types';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isInitialized = useAuthStore((state) => state.isInitialized);
    const setAuth = useAuthStore((state) => state.setAuth);
    const logout = useAuthStore((state) => state.logout);
    const location = useLocation();

    useEffect(() => {
        if (isInitialized) return;

        let cancelled = false;
        api.get<User>('/auth/profile')
            .then(({ data }) => {
                if (!cancelled) setAuth(data);
            })
            .catch(() => {
                if (!cancelled) logout();
            });

        return () => {
            cancelled = true;
        };
    }, [isInitialized, logout, setAuth]);

    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center h-screen" role="status" aria-label="Checking session">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
