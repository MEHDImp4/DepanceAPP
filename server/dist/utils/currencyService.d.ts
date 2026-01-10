import type { ExchangeRates } from '../types';
export declare const getRates: () => Promise<ExchangeRates>;
/**
 * Convert amount from one currency to another (async - fetches rates if needed)
 */
export declare const convertCurrency: (amount: number, fromCurrency: string, toCurrency: string) => Promise<number>;
/**
 * Synchronous currency calculation using pre-fetched rates
 */
export declare const calculateExchange: (amount: number, fromCurrency: string, toCurrency: string, rates: ExchangeRates) => number;
export declare const validCurrencies: string[];
//# sourceMappingURL=currencyService.d.ts.map