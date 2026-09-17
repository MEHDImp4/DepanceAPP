import axios from 'axios';
import prisma from './prisma';
import type { ExchangeRates } from '../types';
import { SUPPORTED_CURRENCIES } from '../constants/currencies';

const CACHE_DURATION_MS = 60 * 60 * 1000;
const MAX_STALE_CACHE_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 5000;

const ratesFromRows = (rows: Array<{ currency: string; rate: number }>): ExchangeRates => {
    const rates: ExchangeRates = {};
    rows.forEach(row => {
        rates[row.currency] = row.rate;
    });
    return rates;
};

const getCacheState = async () => {
    const rows = await prisma.exchangeRate.findMany();
    const usdRate = rows.find(rate => rate.currency === 'USD');
    const ageMs = usdRate
        ? Date.now() - new Date(usdRate.updatedAt).getTime()
        : Number.POSITIVE_INFINITY;
    return { rows, usdRate, ageMs };
};

export const getCachedRates = async (maxAgeMs = MAX_STALE_CACHE_MS): Promise<ExchangeRates | null> => {
    const { rows, usdRate, ageMs } = await getCacheState();
    if (!usdRate || ageMs > maxAgeMs) return null;
    return ratesFromRows(rows);
};

export const serializeRatesSnapshot = (rates: ExchangeRates): string => JSON.stringify({
    capturedAt: new Date().toISOString(),
    rates
});

export const parseRatesSnapshot = (snapshot?: string | null): ExchangeRates | null => {
    if (!snapshot) return null;
    try {
        const parsed = JSON.parse(snapshot) as { rates?: ExchangeRates } | ExchangeRates;
        const rates = 'rates' in parsed ? parsed.rates : parsed;
        if (!rates || typeof rates !== 'object') return null;
        return rates as ExchangeRates;
    } catch {
        return null;
    }
};

export const getRates = async (): Promise<ExchangeRates> => {
    const { rows: cachedRates, usdRate, ageMs: cacheAge } = await getCacheState();

    if (usdRate && cacheAge < CACHE_DURATION_MS) {
        return ratesFromRows(cachedRates);
    }

    try {
        const response = await axios.get<{ result: string; rates: ExchangeRates }>(
            'https://open.er-api.com/v6/latest/USD',
            { timeout: REQUEST_TIMEOUT_MS }
        );

        if (!response.data || response.data.result !== 'success') {
            throw new Error('Exchange-rate provider returned an invalid response');
        }

        const relevantRates = Object.entries(response.data.rates)
            .filter(([currency]) => SUPPORTED_CURRENCIES.includes(currency as (typeof SUPPORTED_CURRENCIES)[number]));

        await prisma.$transaction(relevantRates.map(([currency, rate]) =>
            prisma.exchangeRate.upsert({
                where: { currency },
                update: { rate },
                create: { currency, rate }
            })
        ));

        return Object.fromEntries(relevantRates) as ExchangeRates;
    } catch (error) {
        console.error('Currency API Error:', (error as Error).message);

        if (usdRate && cacheAge <= MAX_STALE_CACHE_MS) {
            console.warn('Using cached exchange rates because the provider is unavailable.');
            return ratesFromRows(cachedRates);
        }

        throw new Error('Exchange rates are temporarily unavailable or too stale to use safely');
    }
};

export const convertCurrency = async (
    amount: number,
    fromCurrency: string,
    toCurrency: string
): Promise<number> => {
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();
    if (from === to) return amount;

    const rates = await getRates();
    return calculateExchange(amount, from, to, rates);
};

export const calculateExchange = (
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rates: ExchangeRates
): number => {
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();
    if (from === to) return amount;

    const fromRate = rates[from];
    const toRate = rates[to];

    if (!fromRate || !toRate) {
        throw new Error(`Exchange rate not available for ${from} or ${to}`);
    }

    const amountInUSD = amount / fromRate;
    return amountInUSD * toRate;
};

export const validCurrencies = [...SUPPORTED_CURRENCIES];
