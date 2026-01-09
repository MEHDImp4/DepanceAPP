import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    // Since Zustand persistence is synchronous for localStorage, we don't strictly need a loading state, 
    // but if we were checking a cookie via an API, we would.
    // For now, let's assume immediate availability or handle hydration if needed.
    const isLoading = false; // Zustand persist is synchronous-ish with localStorage, but for cookies we might need a verify check.
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
