import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { Transaction, Account, Template, User, Category, RecurringTransaction, Goal, MonthlyRecap } from '../types';

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data } = await apiClient.get<Transaction[]>('/transactions');
      return data;
    },
  });
}

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data } = await apiClient.get<Account[]>('/accounts');
      return data;
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<Category[]>('/categories');
      return data;
    },
  });
}

export function useSummary() {
  return useQuery({
    queryKey: ['summary'],
    queryFn: async () => {
      // In mobile we often need a combined summary for the dashboard
      const [accountsRes, transactionsRes] = await Promise.all([
        apiClient.get<Account[]>('/accounts'),
        apiClient.get<Transaction[]>('/transactions'),
      ]);

      const accounts = accountsRes.data || [];
      const transactions = transactionsRes.data || [];

      const totalCapital = Array.isArray(accounts) 
        ? accounts.reduce((acc, curr) => acc + (curr.balance || 0), 0)
        : 0;

      return {
        totalCapital,
        transactions: Array.isArray(transactions) ? transactions.slice(0, 10) : [],
        accounts
      };
    }
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newTransaction: Omit<Transaction, 'id' | 'created_at'>) =>
      apiClient.post('/transactions', newTransaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data } = await apiClient.get<Goal[]>('/goals');
      return data;
    },
  });
}

export function useRecurring() {
  return useQuery({
    queryKey: ['recurring'],
    queryFn: async () => {
      const { data } = await apiClient.get<RecurringTransaction[]>('/recurring');
      return data;
    },
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data } = await apiClient.get<Template[]>('/templates');
      return data;
    },
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newGoal: any) => apiClient.post('/goals', newGoal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: number } & Partial<Goal>) =>
      apiClient.put<Goal>(`/goals/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}
