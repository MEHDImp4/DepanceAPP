import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ResponsiveWrapper } from "./components/layout/ResponsiveWrapper";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import { AuthProvider } from "./context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();


import Transactions from "./pages/Transactions";
import TransactionDetails from "./pages/TransactionDetails";
import Accounts from "./pages/Accounts";
import Templates from "./pages/Templates";
import RecurringTransactions from "@/pages/RecurringTransactions";
import Settings from "./pages/Settings";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
