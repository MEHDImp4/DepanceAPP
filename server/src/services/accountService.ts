import type { Request } from 'express';
import prisma from '../utils/prisma';
import { convertCurrency } from '../utils/currencyService';
import { assertCurrencyAmount, toCents, fromCents } from '../utils/money';
import { AuditAction, createAuditEntry } from '../utils/auditService';
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

    const targetCurrency = (user?.currency || 'USD').toUpperCase();
    const needsConversion = accounts.some(account => account.currency.toUpperCase() !== targetCurrency);

    let totalBalanceCents = 0;
    if (!needsConversion) {
        totalBalanceCents = accounts.reduce((sum, account) => sum + account.balance, 0);
    } else {
        const amounts = await Promise.all(accounts.map(async account =>
            Math.round(await convertCurrency(account.balance, account.currency, targetCurrency))
        ));
        totalBalanceCents = amounts.reduce((sum, amount) => sum + amount, 0);
    }

    return {
        totalBalance: fromCents(totalBalanceCents),
        currency: targetCurrency,
        accountCount: accounts.length
    };
};

export const createAccount = async (data: CreateAccountData) => {
    const { name, type, balance, currency, color, userId } = data;
    const normalizedCurrency = (currency || 'USD').toUpperCase();
    const initialBalance = balance ?? 0;
    assertCurrencyAmount(initialBalance, normalizedCurrency, { allowNegative: true, allowZero: true });
    const balanceInCents = toCents(initialBalance);

    const account = await prisma.account.create({
        data: {
            name,
            type: type || 'normal',
            color: color || 'bg-primary',
            currency: normalizedCurrency,
            balance: balanceInCents,
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
    return accounts.map(account => ({
        ...account,
        balance: fromCents(account.balance)
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

    const normalizedCurrency = currency?.toUpperCase();
    if (normalizedCurrency && normalizedCurrency !== account.currency.toUpperCase()) {
        const transactionCount = await prisma.transaction.count({ where: { account_id: id } });
        if (account.balance !== 0 || transactionCount > 0) {
            throw new Error('Account currency cannot be changed after financial activity');
        }
    }

    const updated = await prisma.account.update({
        where: { id },
        data: {
            name,
            type,
            ...(normalizedCurrency !== undefined && { currency: normalizedCurrency })
        }
    });

    return { ...updated, balance: fromCents(updated.balance) };
};

export const deleteAccount = async (id: number, userId: number, password?: string, req?: Request) => {
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

    return prisma.$transaction(async database => {
        const account = await database.account.findFirst({
            where: { id, user_id: userId }
        });

        if (!account) {
            throw new Error('Account not found');
        }

        const [transactionCount, recurringCount] = await Promise.all([
            database.transaction.count({ where: { account_id: id, user_id: userId } }),
            database.recurringTransaction.count({ where: { account_id: id, user_id: userId } })
        ]);

        if (transactionCount > 0 || recurringCount > 0) {
            const error = new Error('Account has financial history or recurring rules and cannot be deleted');
            Object.assign(error, { code: 'ACCOUNT_HAS_ACTIVITY' });
            throw error;
        }

        await database.account.delete({ where: { id } });
        await createAuditEntry(database, {
            userId,
            action: AuditAction.ACCOUNT_DELETE,
            entityType: 'account',
            entityId: account.id,
            oldValue: {
                name: account.name,
                type: account.type,
                currency: account.currency,
                balance: account.balance
            },
            req
        });

        return account;
    });
};
