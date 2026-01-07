export interface User {
    id: number;
    email: string;
    username: string;
    currency: string;
}

export interface Account {
    id: number;
    name: string;
    type: string;
    currency: string;
    balance: number;
    color?: string;
}

export interface Transaction {
    id: number;
    amount: number;
    description: string;
    type: 'income' | 'expense';
    account_id: number;
    category_id?: number;
    created_at: string;
    category?: {
        name: string;
        icon?: string;
        color?: string;
    };
}

export interface Template {
    id: number;
    name: string;
    amount: number;
    type: 'income' | 'expense';
    category_id?: number | null;
    default_account_id?: number | null;
    icon_name?: string;
    color: string;
    description?: string;
    category?: {
        name: string;
        icon?: string;
        color?: string;
    };
    default_account?: {
        name: string;
        currency: string;
    };
}

export interface Category {
    id: number;
    name: string;
    type: 'income' | 'expense';
    color: string;
    icon: string;
    user_id: number;
    created_at?: string;
}

export interface RecurringTransaction {
    id: number;
    amount: number;
    description: string;
    type: 'income' | 'expense';
    interval: 'weekly' | 'monthly' | 'yearly';
    next_run_date: string;
    active: boolean;
    category_id?: number | null;
    account_id: number;
    created_at: string;
    updated_at: string;
    category?: Category;
    account?: Account;
}
