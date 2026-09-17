import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { fromCents } from '../utils/money';
import {
    calculateExchange,
    getRates,
    parseRatesSnapshot,
    serializeRatesSnapshot
} from '../utils/currencyService';
import type { ExchangeRates } from '../types';
import {
    dateKeyInTimeZone,
    getCurrentMonthWindow,
    getRollingStart,
    getZonedParts,
    monthKeyInTimeZone,
    normalizeTimeZone
} from '../utils/reportingTime';

type ReportingTransaction = {
    id: number;
    amount: number;
    fx_rates_snapshot: string | null;
    account: { currency: string };
};

const canConvert = (rates: ExchangeRates | null, fromCurrency: string, toCurrency: string) => {
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();
    if (from === to) return true;
    return Boolean(rates?.[from] && rates?.[to]);
};

const requiresLiveRates = (transactions: ReportingTransaction[], targetCurrency: string) =>
    transactions.some(tx => {
        const sourceCurrency = tx.account.currency.toUpperCase();
        if (sourceCurrency === targetCurrency.toUpperCase()) return false;
        return !canConvert(parseRatesSnapshot(tx.fx_rates_snapshot), sourceCurrency, targetCurrency);
    });

const reportingAmount = (
    tx: ReportingTransaction,
    targetCurrency: string,
    liveRates: ExchangeRates | null,
    missingSnapshotIds: Set<number>
) => {
    const sourceCurrency = tx.account.currency.toUpperCase();
    const target = targetCurrency.toUpperCase();
    if (sourceCurrency === target) return tx.amount;

    const snapshotRates = parseRatesSnapshot(tx.fx_rates_snapshot);
    const rates = canConvert(snapshotRates, sourceCurrency, target) ? snapshotRates : liveRates;
    if (!rates) {
        throw new Error(`Exchange rate unavailable for historical transaction ${tx.id}`);
    }

    if (!tx.fx_rates_snapshot && liveRates) missingSnapshotIds.add(tx.id);
    return Math.round(calculateExchange(tx.amount, sourceCurrency, target, rates));
};

const persistFallbackSnapshot = async (ids: Set<number>, liveRates: ExchangeRates | null) => {
    if (ids.size === 0 || !liveRates) return;
    await prisma.transaction.updateMany({
        where: { id: { in: [...ids] }, fx_rates_snapshot: null, transfer_id: null },
        data: { fx_rates_snapshot: serializeRatesSnapshot(liveRates) }
    });
};

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
        const liveRates = requiresLiveRates(allTransactions, targetCurrency) ? await getRates() : null;
        const missingSnapshotIds = new Set<number>();

        let currentExpense = 0;
        let currentIncome = 0;
        const categoryTotals = new Map<number, { amount: number; category: NonNullable<(typeof currentTransactions)[number]['category']> }>();
        let biggestPurchase: (typeof currentTransactions)[number] | null = null;
        let biggestPurchaseAmount = -1;

        for (const tx of currentTransactions) {
            const converted = reportingAmount(tx, targetCurrency, liveRates, missingSnapshotIds);
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
            return sum + reportingAmount(tx, targetCurrency, liveRates, missingSnapshotIds);
        }, 0);

        await persistFallbackSnapshot(missingSnapshotIds, liveRates);

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

        let serializedBiggestPurchase = null;
        if (biggestPurchase) {
            const { fx_rates_snapshot: _snapshot, ...safePurchase } = biggestPurchase;
            serializedBiggestPurchase = {
                ...safePurchase,
                amount: fromCents(biggestPurchaseAmount),
                originalAmount: fromCents(biggestPurchase.amount),
                originalCurrency: biggestPurchase.account.currency,
                convertedCurrency: targetCurrency
            };
        }

        res.json({
            month: monthLabel,
            year: window.year,
            currency: targetCurrency,
            totalSpent: fromCents(currentExpense),
            totalIncome: fromCents(currentIncome),
            transactionCount: currentTransactions.length,
            topCategory,
            biggestPurchase: serializedBiggestPurchase,
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
                ...(startDate ? { created_at: { gte: startDate } } : {})
            },
            include: { account: { select: { currency: true } } },
            orderBy: { created_at: 'asc' }
        });

        const liveRates = requiresLiveRates(transactions, targetCurrency) ? await getRates() : null;
        const missingSnapshotIds = new Set<number>();
        const formatByMonth = period === 'year' || period === 'all';
        const groupedData: Record<string, { income: number; expense: number }> = {};

        const chartStartDate = startDate ?? transactions[0]?.created_at ?? new Date();
        const startParts = getZonedParts(chartStartDate, timeZone);
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

            const converted = reportingAmount(
                transaction,
                targetCurrency,
                liveRates,
                missingSnapshotIds
            );
            if (transaction.type === 'income') groupedData[key].income += converted;
            if (transaction.type === 'expense') groupedData[key].expense += converted;
        });

        await persistFallbackSnapshot(missingSnapshotIds, liveRates);

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
