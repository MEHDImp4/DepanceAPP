import axios from 'axios';
import prisma from './prisma';
import type { ExchangeRates } from '../types';

const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export const getRates = async (): Promise<ExchangeRates> => {
    try {
        // Check DB for cached rates
        const cachedRates = await prisma.exchangeRate.findMany();
        const now = Date.now();

        // Check if we have valid cached rates
        const usdRate = cachedRates.find(r => r.currency === 'USD');

        if (usdRate && (now - new Date(usdRate.updatedAt).getTime() < CACHE_DURATION)) {
            const rates: ExchangeRates = {};
            cachedRates.forEach(r => rates[r.currency] = r.rate);
            return rates;
        }

        // Fetch fresh rates
        const response = await axios.get<{ result: string; rates: ExchangeRates }>(
            'https://open.er-api.com/v6/latest/USD'
        );

        if (response.data && response.data.result === 'success') {
            const newRates = response.data.rates;

            const upserts = Object.entries(newRates).map(([currency, rate]) => {
                return prisma.exchangeRate.upsert({
                    where: { currency },
                    update: { rate },
                    create: { currency, rate }
                });
            });

            await prisma.$transaction(upserts);
            return newRates;
        }
        throw new Error('Failed to fetch rates');
    } catch (error) {
        console.error('Currency API Error:', (error as Error).message);

        // Fallback to DB cache even if expired
        const cachedRates = await prisma.exchangeRate.findMany();
        if (cachedRates.length > 0) {
            const rates: ExchangeRates = {};
            cachedRates.forEach(r => rates[r.currency] = r.rate);
            return rates;
        }

        console.warn('Using static fallback rates due to API failure and no cache.');
        return {
            USD: 1,
            EUR: 0.92,
            GBP: 0.79,
            MAD: 10.0,
            JPY: 150.0,
            CAD: 1.35,
            AUD: 1.5,
            CHF: 0.9,
            CNY: 7.2,
            AED: 3.67
        };
    }
};

/**
 * Convert amount from one currency to another (async - fetches rates if needed)
 */
export const convertCurrency = async (
    amount: number,
    fromCurrency: string,
    toCurrency: string
): Promise<number> => {
    if (fromCurrency === toCurrency) return amount;

    const rates = await getRates();
    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];

    if (!fromRate || !toRate) {
        throw new Error(`Exchange rate not available for ${fromCurrency} or ${toCurrency}`);
    }

    const amountInUSD = amount / fromRate;
    return amountInUSD * toRate;
};

/**
 * Synchronous currency calculation using pre-fetched rates
 */
export const calculateExchange = (
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rates: ExchangeRates
): number => {
    if (fromCurrency === toCurrency) return amount;

    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];

    if (!fromRate || !toRate) {
        throw new Error(`Exchange rate not available for ${fromCurrency} or ${toCurrency}`);
    }

    const amountInUSD = amount / fromRate;
    return amountInUSD * toRate;
};

export const validCurrencies = ['USD', 'EUR', 'GBP', 'MAD', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'AED'];
