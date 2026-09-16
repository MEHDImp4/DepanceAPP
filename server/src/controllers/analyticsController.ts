import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { fromCents } from '../utils/money';
import { calculateExchange, getRates } from '../utils/currencyService';
import {
    dateKeyInTimeZone,
    getCurrentMonthWindow,
    getRollingStart,
    getZonedParts,
    monthKeyInTimeZone,
    normalizeTimeZone
} from '../utils/reportingTime';

const toReportingAmount = (
    amount: number,
    sourceCurrency: string,
    targetCurrency: string,
    rates: Record<string, number>
) => sourceCurrency.toUpperCase() === targetCurrency.toUpperCase()
    ? amount
    : Math.round(calculateExchange(amount, sourceCurrency, targetCurrency, rates));

export const getMonthlyRecap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { currency: true, timezone: true }
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const targetCurrency = user.currency.toUpperCase();
        const timeZone = normalizeTimeZone(user.timezone);
        const window = getCurrentMonthWindow(timeZone);

        const [currentTransactions, previousTransactions] = await Promise.all([
            prisma.transaction.findMany({
                where: {
                    user_id: userId,
                    transfer_id: null,
                    created_at: { gte: window.start, lt: window.endExclusive }
                },
                include: {
                    account: { select: { currency: true } },
                    category: true
                }
            }),
            prisma.transaction.findMany({
                where: {
                    user_id: userId,
                    transfer_id: null,
                    created_at: { gte: window.previousStart, lt: window.previousEndExclusive }
                },
                include: { account: { select: { currency: true } } }
            })
        ]);

        const allTransactions = [...currentTransactions, ...previousTransactions];
        const needsConversion = allTransactions.some(
            tx => tx.account.currency.toUpperCase() !== targetCurrency
        );
        const rates = needsConversion ? await getRates() : {};

        let currentExpense = 0;
        let currentIncome = 0;
        const categoryTotals = new Map<number, { amount: number; category: NonNullable<(typeof currentTransactions)[number]['category']> }>();
        let biggestPurchase: (typeof currentTransactions)[number] | null = null;
        let biggestPurchaseAmount = -1;

        for (const tx of currentTransactions) {
            const converted = toReportingAmount(tx.amount, tx.account.currency, targetCurrency, rates);
            if (tx.type === 'income') currentIncome += converted;
            if (tx.type === 'expense') {
                currentExpense += converted;
                if (converted > biggestPurchaseAmount) {
                    biggestPurchase = tx;
                    biggestPurchaseAmount = converted;
                }
                if (tx.category_id && tx.category) {
                    const existing = categoryTotals.get(tx.category_id);
                    categoryTotals.set(tx.category_id, {
                        amount: (existing?.amount || 0) + converted,
                        category: tx.category
                    });
                }
            }
        }

        const lastExpense = previousTransactions.reduce((sum, tx) => {
            if (tx.type !== 'expense') return sum;
            return sum + toReportingAmount(tx.amount, tx.account.currency, targetCurrency, rates);
        }, 0);

        const topCategoryEntry = [...categoryTotals.values()].sort((a, b) => b.amount - a.amount)[0];
        const topCategory = topCategoryEntry ? {
            name: topCategoryEntry.category.name,
            amount: fromCents(topCategoryEntry.amount),
            color: topCategoryEntry.category.color,
            icon: topCategoryEntry.category.icon
        } : null;

        let comparisonPercentage = 0;
        if (lastExpense > 0) {
            comparisonPercentage = Math.round(((currentExpense - lastExpense) / lastExpense) * 100);
        } else if (currentExpense > 0) {
            comparisonPercentage = 100;
        }

        const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', timeZone }).format(new Date());

        res.json({
            month: monthLabel,
            year: window.year,
            currency: targetCurrency,
            totalSpent: fromCents(currentExpense),
            totalIncome: fromCents(currentIncome),
            transactionCount: currentTransactions.length,
            topCategory,
            biggestPurchase: biggestPurchase ? {
                ...biggestPurchase,
                amount: fromCents(biggestPurchaseAmount),
                originalAmount: fromCents(biggestPurchase.amount),
                originalCurrency: biggestPurchase.account.currency,
                convertedCurrency: targetCurrency
            } : null,
            comparison: {
                lastMonthSpent: fromCents(lastExpense),
                percentageChange: comparisonPercentage
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getSpendingTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const rawPeriod = typeof req.query.period === 'string' ? req.query.period : 'month';
        const period = ['week', 'month', 'year', 'all'].includes(rawPeriod)
            ? rawPeriod as 'week' | 'month' | 'year' | 'all'
            : 'month';

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { currency: true, timezone: true }
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const targetCurrency = user.currency.toUpperCase();
        const timeZone = normalizeTimeZone(user.timezone);
        const startDate = getRollingStart(period, timeZone);

        const transactions = await prisma.transaction.findMany({
            where: {
                user_id: userId,
                transfer_id: null,
                created_at: { gte: startDate }
            },
            include: { account: { select: { currency: true } } },
            orderBy: { created_at: 'asc' }
        });

        const needsConversion = transactions.some(tx => tx.account.currency.toUpperCase() !== targetCurrency);
        const rates = needsConversion ? await getRates() : {};
        const formatByMonth = period === 'year' || period === 'all';
        const groupedData: Record<string, { income: number; expense: number }> = {};

        const startParts = getZonedParts(startDate, timeZone);
        const endParts = getZonedParts(new Date(), timeZone);
        const cursor = new Date(Date.UTC(startParts.year, startParts.month - 1, formatByMonth ? 1 : startParts.day));
        const endCursor = new Date(Date.UTC(endParts.year, endParts.month - 1, formatByMonth ? 1 : endParts.day));

        while (cursor <= endCursor) {
            const key = formatByMonth
                ? `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`
                : cursor.toISOString().slice(0, 10);
            groupedData[key] = { income: 0, expense: 0 };
            if (formatByMonth) cursor.setUTCMonth(cursor.getUTCMonth() + 1);
            else cursor.setUTCDate(cursor.getUTCDate() + 1);
        }

        transactions.forEach(transaction => {
            const key = formatByMonth
                ? monthKeyInTimeZone(transaction.created_at, timeZone)
                : dateKeyInTimeZone(transaction.created_at, timeZone);
            if (!groupedData[key]) return;

            const converted = toReportingAmount(
                transaction.amount,
                transaction.account.currency,
                targetCurrency,
                rates
            );
            if (transaction.type === 'income') groupedData[key].income += converted;
            if (transaction.type === 'expense') groupedData[key].expense += converted;
        });

        const sortedChartData = Object.keys(groupedData)
            .sort()
            .map(dateKey => ({
                date: dateKey,
                currency: targetCurrency,
                income: fromCents(groupedData[dateKey].income),
                expense: fromCents(groupedData[dateKey].expense)
            }));

        res.json(sortedChartData);
    } catch (error) {
        next(error);
    }
};
