import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Account } from '@/types';

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
        mutationFn: (newAccount: Omit<Account, 'id'>) =>
            api.post('/accounts', newAccount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
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

export function useDeleteAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { id: number; password: string }) =>
            api.delete(`/accounts/${data.id}`, { data: { password: data.password } }),
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
