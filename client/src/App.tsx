import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ResponsiveWrapper } from "./components/layout/ResponsiveWrapper";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
// AuthProvider removed in favor of Zustand store
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAxiosError } from "axios";

const queryClient = new QueryClient({
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


import ReloadPrompt from "./components/ReloadPrompt";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const TransactionDetails = lazy(() => import("./pages/TransactionDetails"));
const Accounts = lazy(() => import("./pages/Accounts"));
const Templates = lazy(() => import("./pages/Templates"));
const RecurringTransactions = lazy(() => import("./pages/RecurringTransactions"));
const Goals = lazy(() => import("./pages/Goals"));
const Settings = lazy(() => import("./pages/Settings"));
const ProfileInfo = lazy(() => import("./pages/settings/ProfileInfo"));
const SecurityPrivacy = lazy(() => import("./pages/settings/SecurityPrivacy"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div role="status" aria-label="Loading page" className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-muted border-t-primary animate-spin" /></div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={
            <ProtectedRoute>
              <ResponsiveWrapper />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transactions/:id" element={<TransactionDetails />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/recurring" element={<RecurringTransactions />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/profile" element={<ProfileInfo />} />
            <Route path="/settings/security" element={<SecurityPrivacy />} />
          </Route>
        </Routes>
        </Suspense>
        <ReloadPrompt />
      </QueryClientProvider>
    </BrowserRouter >
  );
}

export default App;
