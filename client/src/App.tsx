import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ResponsiveWrapper } from "./components/layout/ResponsiveWrapper";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
// AuthProvider removed in favor of Zustand store
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});


import Transactions from "./pages/Transactions";
import TransactionDetails from "./pages/TransactionDetails";
import Accounts from "./pages/Accounts";
import Templates from "./pages/Templates";
import RecurringTransactions from "./pages/RecurringTransactions";
import Goals from "./pages/Goals";
import Settings from "./pages/Settings";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ReloadPrompt from "./components/ReloadPrompt";

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
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
          </Route>
        </Routes>
        <ReloadPrompt />
      </QueryClientProvider>
    </BrowserRouter >
  );
}

export default App;
