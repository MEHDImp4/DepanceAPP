import prisma from '../utils/prisma';
import { convertCurrency } from '../utils/currencyService';
import { toCents, fromCents } from '../utils/money';
import bcrypt from 'bcryptjs';

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

export const getAccountSummary = async (userId: number) => {
    const [user, accounts] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.account.findMany({ where: { user_id: userId } })
    ]);

    const targetCurrency = user?.currency || 'USD';
    const amounts = await Promise.all(accounts.map(acc =>
        convertCurrency(acc.balance, acc.currency, targetCurrency)
    ));

    const totalBalanceCents = amounts.reduce((sum, amount) => sum + amount, 0);

    return {
        totalBalance: fromCents(totalBalanceCents),
        currency: targetCurrency,
        accountCount: accounts.length
    };
};

export const createAccount = async (data: CreateAccountData) => {
    const { name, type, balance, currency, color, userId } = data;

    const account = await prisma.account.create({
        data: {
            name,
            type: type || 'normal',
            color: color || 'bg-primary',
            currency: currency || 'USD',
            balance: toCents(balance || 0),
            user_id: userId
        }
    });

    return { ...account, balance: fromCents(account.balance) };
};

export const getUserAccounts = async (userId: number) => {
    const accounts = await prisma.account.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'asc' }
    });
    return accounts.map(acc => ({
        ...acc,
        balance: fromCents(acc.balance)
    }));
};

export const updateAccount = async (data: UpdateAccountData) => {
    const { id, userId, name, type, currency } = data;

    const account = await prisma.account.findFirst({
        where: { id, user_id: userId }
    });

    if (!account) {
        throw new Error('Account not found');
    }

    const updated = await prisma.account.update({
        where: { id },
        data: { name, type, currency }
    });

    return { ...updated, balance: fromCents(updated.balance) };
};

export const deleteAccount = async (id: number, userId: number, password?: string) => {
    if (!password) {
        throw new Error('Password is required');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
        throw new Error('Invalid password');
    }

    const account = await prisma.account.findFirst({
        where: { id, user_id: userId }
    });

    if (!account) {
        throw new Error('Account not found');
    }

    await prisma.account.delete({ where: { id } });
    return true;
};
