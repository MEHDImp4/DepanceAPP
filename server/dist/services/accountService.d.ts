interface CreateAccountData {
    name: string;
    type?: string;
    balance?: number;
    currency?: string;
    color?: string;
    userId: number;
}
interface UpdateAccountData {
    id: number;
    userId: number;
    name?: string;
    type?: string;
    currency?: string;
}
export declare const getAccountSummary: (userId: number) => Promise<{
    totalBalance: number;
    currency: string;
    accountCount: number;
}>;
export declare const createAccount: (data: CreateAccountData) => Promise<{
    balance: number;
    name: string;
    id: number;
    currency: string;
    created_at: Date;
    type: string;
    color: string | null;
    user_id: number;
}>;
export declare const getUserAccounts: (userId: number) => Promise<{
    balance: number;
    name: string;
    id: number;
    currency: string;
    created_at: Date;
    type: string;
    color: string | null;
    user_id: number;
}[]>;
export declare const updateAccount: (data: UpdateAccountData) => Promise<{
    balance: number;
    name: string;
    id: number;
    currency: string;
    created_at: Date;
    type: string;
    color: string | null;
    user_id: number;
}>;
export declare const deleteAccount: (id: number, userId: number, password?: string) => Promise<boolean>;
export {};
//# sourceMappingURL=accountService.d.ts.map