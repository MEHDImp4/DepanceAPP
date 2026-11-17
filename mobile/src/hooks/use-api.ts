import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type {
    Transaction,
    TransactionPage,
    Account,
    Template,
    User,
    Category,
    RecurringTransaction,
    Goal,
    MonthlyRecap,
    LoginHistoryEntry,
    SpendingTrend,
} from '@/types';

export function useTransaction(id: number) {
    return useQuery({
        queryKey: ['transactions', id],
        queryFn: async () => {
            const { data } = await api.get<Transaction>(`/transactions/${id}`);
            return data;
        },
        enabled: Number.isFinite(id) && id > 0,
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<User>) => api.put<User>('/auth/profile', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['summary'] });
            queryClient.invalidateQueries({ queryKey: ['accountSummary'] });
        },
    });
}

export function useChangePassword() {
    return useMutation({
        mutationFn: (data: { oldPassword: string; newPassword: string }) =>
            api.post('/auth/change-password', data),
    });
}

export function useLoginHistory() {
    return useQuery({
        queryKey: ['loginHistory'],
        queryFn: async () => {
            const { data } = await api.get<LoginHistoryEntry[]>('/auth/login-history');
            return data;
        },
    });
}

export function useSecurityAlerts() {
    return useQuery({
        queryKey: ['securityAlerts'],
        queryFn: async () => {
            const { data } = await api.get('/auth/security-alerts');
            return data;
        },
    });
}

export function useCategories() {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data } = await api.get<Category[]>('/categories');
            return data;
        },
    });
}

export function useTransactions() {
    return useInfiniteQuery({
        queryKey: ['transactions'],
        initialPageParam: null as string | null,
        queryFn: async ({ pageParam }) => {
            const { data } = await api.get<TransactionPage>('/transactions', {
                params: { limit: 50, cursor: pageParam || undefined },
            });
            return data;
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    });
}

// Accounts
export function useAccountSummary() {
    return useQuery({
        queryKey: ['accountSummary'],
        queryFn: async () => {
            const { data } = await api.get<{ totalBalance: number; currency: string; accountCount: number }>('/accounts/summary');
            return data;
        },
    });
}

export function useAccounts() {
    return useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            const { data } = await api.get<Account[]>('/accounts');
            return data;
        },
    });
}

export function useCreateAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newAccount: Omit<Account, 'id'>) => api.post('/accounts', newAccount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['summary'] });
            queryClient.invalidateQueries({ queryKey: ['accountSummary'] });
        },
    });
}

export function useUpdateAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { id: number } & Partial<Account>) =>
            api.put<Account>(`/accounts/${data.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['summary'] });
            queryClient.invalidateQueries({ queryKey: ['accountSummary'] });
        },
    });
}

export function useDeleteAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { id: number; password: string }) =>
            api.delete(`/accounts/${data.id}`, { data: { password: data.password } }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['summary'] });
            queryClient.invalidateQueries({ queryKey: ['accountSummary'] });
        },
    });
}

export function useCreateTransfer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newTransfer: {
            from_account_id: number;
            to_account_id: number;
            amount: number;
            description?: string;
        }) => api.post('/transfers', newTransfer),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['summary'] });
            queryClient.invalidateQueries({ queryKey: ['accountSummary'] });
        },
    });
}

// Templates
export function useTemplates() {
    return useQuery({
        queryKey: ['templates'],
        queryFn: async () => {
            const { data } = await api.get<Template[]>('/templates');
            return data;
        },
    });
}

export function useSummary() {
    return useQuery({
        queryKey: ['summary'],
        queryFn: async () => {
            const [summary, transactions] = await Promise.all([
                api.get<{ totalBalance: number; currency: string }>('/accounts/summary'),
                api.get<TransactionPage>('/transactions', { params: { limit: 5 } }),
            ]);

            return {
                totalCapital: summary.data.totalBalance,
                currency: summary.data.currency,
                transactions: transactions.data.items,
            };
        },
    });
}

export function useCreateTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newTransaction: Omit<Transaction, 'id' | 'created_at'>) =>
            api.post('/transactions', newTransaction),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['summary'] });
            queryClient.invalidateQueries({ queryKey: ['accountSummary'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}

export function useDeleteTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`/transactions/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['summary'] });
            queryClient.invalidateQueries({ queryKey: ['accountSummary'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}

export function useCreateTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newTemplate: Omit<Template, 'id'>) => api.post('/templates', newTemplate),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
        },
    });
}

export function useUpdateTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { id: number } & Partial<Template>) =>
            api.put<Template>(`/templates/${data.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
        },
    });
}

export function useDeleteTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`/templates/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
        },
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newCategory: Omit<Category, 'id'>) => {
            const { data } = await api.post<Category>('/categories', newCategory);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
}

export function useRecurring() {
    return useQuery({
        queryKey: ['recurring'],
        queryFn: async () => {
            const { data } = await api.get<RecurringTransaction[]>('/recurring');
            return data;
        },
    });
}

export function useCreateRecurring() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newRecurring: {
            description: string;
            amount: number;
            type: 'income' | 'expense';
            interval: 'weekly' | 'monthly' | 'yearly';
            start_date?: string;
            account_id: number;
            category_id?: number | null;
        }) => api.post('/recurring', newRecurring),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurring'] });
        },
    });
}

export function useDeleteRecurring() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`/recurring/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurring'] });
        },
    });
}

export function useProcessRecurring() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => api.post('/recurring/process'),
        onSuccess: (data) => {
            if (data.data.processed > 0) {
                queryClient.invalidateQueries({ queryKey: ['transactions'] });
                queryClient.invalidateQueries({ queryKey: ['accounts'] });
                queryClient.invalidateQueries({ queryKey: ['summary'] });
            queryClient.invalidateQueries({ queryKey: ['accountSummary'] });
                queryClient.invalidateQueries({ queryKey: ['recurring'] });
            }
        },
    });
}

export function useGoals() {
    return useQuery({
        queryKey: ['goals'],
        queryFn: async () => {
            const { data } = await api.get<Goal[]>('/goals');
            return data;
        },
    });
}

type CreateGoalInput = Omit<Goal, 'id' | 'created_at' | 'percentage' | 'currency'>;

export function useCreateGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newGoal: CreateGoalInput) => api.post('/goals', newGoal),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
        },
    });
}

export function useUpdateGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { id: number } & Partial<Omit<Goal, 'currency'>>) =>
            api.put<Goal>(`/goals/${data.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
        },
    });
}

export function useDeleteGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`/goals/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
        },
    });
}

export function useRecap() {
    return useQuery({
        queryKey: ['recap'],
        queryFn: async () => {
            const { data } = await api.get<MonthlyRecap>('/analytics/recap');
            return data;
        },
        retry: false,
        staleTime: 1000 * 60 * 60,
    });
}

export function useSpendingTrends(period: 'week' | 'month' | 'year' | 'all') {
    return useQuery({
        queryKey: ['spendingTrends', period],
        queryFn: async () => {
            const { data } = await api.get<SpendingTrend[]>(
                `/analytics/spending-trends?period=${period}`
            );
            return data;
        },
        staleTime: 1000 * 60 * 5,
    });
}
