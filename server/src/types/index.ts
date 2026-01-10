// User payload from JWT
export interface JwtPayload {
    userId: number;
    email: string;
    iat?: number;
    exp?: number;
}

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

// Database Models (matching Prisma schema)
export interface User {
    id: number;
    email: string;
    username: string;
    password_hash: string;
    currency: string;
    created_at: Date;
}

export interface Account {
    id: number;
    name: string;
    type: string;
    color: string | null;
    currency: string;
    balance: number;
    user_id: number;
    created_at: Date;
}

export interface Transaction {
    id: number;
    amount: number;
    description: string;
    type: 'income' | 'expense';
    account_id: number;
    user_id: number;
    category_id: number | null;
    transfer_id: string | null;
    created_at: Date;
}

export interface Category {
    id: number;
    name: string;
    type: 'income' | 'expense';
    color: string | null;
    icon: string | null;
    user_id: number;
    created_at: Date;
}

export interface Budget {
    id: number;
    amount: number;
    period: 'weekly' | 'monthly' | 'yearly';
    category_id: number | null;
    user_id: number;
    created_at: Date;
    updated_at: Date;
}

export interface Template {
    id: number;
    name: string;
    amount: number;
    description: string | null;
    color: string | null;
    icon_name: string | null;
    default_account_id: number | null;
    category_id: number | null;
    type: 'income' | 'expense';
    user_id: number;
    created_at: Date;
}

export interface RecurringTransaction {
    id: number;
    amount: number;
    description: string;
    type: 'income' | 'expense';
    interval: 'weekly' | 'monthly' | 'yearly';
    next_run_date: Date;
    active: boolean;
    category_id: number | null;
    account_id: number;
    user_id: number;
    created_at: Date;
    updated_at: Date;
}

export interface RefreshToken {
    id: string;
    token: string;
    userId: number;
    expiresAt: Date;
    createdAt: Date;
}

// API Response types
export interface ApiError {
    error: string;
    stack?: string;
}

export interface AuthResponse {
    message?: string;
    userId?: number;
    user?: {
        id: number;
        email: string;
        username: string;
        currency?: string;
    };
}

export interface TransactionWithConversion extends Transaction {
    convertedAmount: number;
    convertedCurrency: string;
    account?: {
        name: string;
        currency: string;
    };
    category?: Category | null;
}

// Currency rates map
export interface ExchangeRates {
    [currency: string]: number;
}
