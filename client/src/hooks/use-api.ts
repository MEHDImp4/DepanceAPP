import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Transaction, Account, Template, User, Category, RecurringTransaction, Goal, MonthlyRecap } from '@/types';

export function useTransaction(id: number) {
    return useQuery({
        queryKey: ['transactions', id],
        queryFn: async () => {
            const { data } = await api.get<Transaction>(`/transactions/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export function useUpdateProfile() {
    return useMutation({
        mutationFn: (data: Partial<User>) =>
            api.put<User>('/auth/profile', data),
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
    return useQuery({
        queryKey: ['transactions'],
        queryFn: async () => {
            const { data } = await api.get<Transaction[]>('/transactions');
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
            // Need to create this endpoint or aggregate locally
            // For now, let's assume we can get simple stats
            const accounts = await api.get<Account[]>('/accounts');
            const transactions = await api.get<Transaction[]>('/transactions');

            const totalCapital = accounts.data.reduce((acc, curr) => acc + curr.balance, 0);

            return {
                totalCapital,
                transactions: transactions.data,
                accounts: accounts.data
            };
        }
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
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
}

export function useCreateAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newAccount: Omit<Account, 'id'>) =>
            api.post('/accounts', newAccount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['summary'] });
        },
    });
}

export function useCreateTransfer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newTransfer: { from_account_id: number; to_account_id: number; amount: number; description?: string }) =>
            api.post('/transfers', newTransfer),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['summary'] });
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
        },
    });
}

export function useCreateTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newTemplate: Omit<Template, 'id'>) =>
            api.post('/templates', newTemplate),
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
        mutationFn: (id: number) =>
            api.delete(`/templates/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
        },
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newCategory: Omit<Category, 'id'>) => {
            const { data } = await api.post('/categories', newCategory);
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
        mutationFn: (newRecurring: any) =>
            api.post('/recurring', newRecurring),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurring'] });
        },
    });
}

export function useDeleteRecurring() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) =>
            api.delete(`/recurring/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurring'] });
        },
    });
}

export function useProcessRecurring() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () =>
            api.post('/recurring/process'),
        onSuccess: (data) => {
            if (data.data.processed > 0) {
                queryClient.invalidateQueries({ queryKey: ['transactions'] });
                queryClient.invalidateQueries({ queryKey: ['accounts'] });
                queryClient.invalidateQueries({ queryKey: ['summary'] });
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

export function useCreateGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newGoal: any) =>
            api.post('/goals', newGoal),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
        },
    });
}

export function useUpdateGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { id: number } & Partial<Goal>) =>
            api.put<Goal>(`/goals/${data.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
        },
    });
}

export function useDeleteGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) =>
            api.delete(`/goals/${id}`),
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
        retry: false, // Don't retry if it fails (e.g. no data)
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
