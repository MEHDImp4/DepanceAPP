"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validCurrencies = exports.calculateExchange = exports.convertCurrency = exports.getRates = void 0;
const axios_1 = __importDefault(require("axios"));
const prisma_1 = __importDefault(require("./prisma"));
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const getRates = async () => {
    try {
        // Check DB for cached rates
        const cachedRates = await prisma_1.default.exchangeRate.findMany();
        const now = Date.now();
        // Check if we have valid cached rates
        const usdRate = cachedRates.find(r => r.currency === 'USD');
        if (usdRate && (now - new Date(usdRate.updatedAt).getTime() < CACHE_DURATION)) {
            const rates = {};
            cachedRates.forEach(r => rates[r.currency] = r.rate);
            return rates;
        }
        // Fetch fresh rates
        const response = await axios_1.default.get('https://open.er-api.com/v6/latest/USD');
        if (response.data && response.data.result === 'success') {
            const newRates = response.data.rates;
            const upserts = Object.entries(newRates).map(([currency, rate]) => {
                return prisma_1.default.exchangeRate.upsert({
                    where: { currency },
                    update: { rate },
                    create: { currency, rate }
                });
            });
            await prisma_1.default.$transaction(upserts);
            return newRates;
        }
        throw new Error('Failed to fetch rates');
    }
    catch (error) {
        console.error('Currency API Error:', error.message);
        // Fallback to DB cache even if expired
        const cachedRates = await prisma_1.default.exchangeRate.findMany();
        if (cachedRates.length > 0) {
            const rates = {};
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
exports.getRates = getRates;
/**
 * Convert amount from one currency to another (async - fetches rates if needed)
 */
const convertCurrency = async (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency)
        return amount;
    const rates = await (0, exports.getRates)();
    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];
    if (!fromRate || !toRate) {
        throw new Error(`Exchange rate not available for ${fromCurrency} or ${toCurrency}`);
    }
    const amountInUSD = amount / fromRate;
    return amountInUSD * toRate;
};
exports.convertCurrency = convertCurrency;
/**
 * Synchronous currency calculation using pre-fetched rates
 */
const calculateExchange = (amount, fromCurrency, toCurrency, rates) => {
    if (fromCurrency === toCurrency)
        return amount;
    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];
    if (!fromRate || !toRate) {
        throw new Error(`Exchange rate not available for ${fromCurrency} or ${toCurrency}`);
    }
    const amountInUSD = amount / fromRate;
    return amountInUSD * toRate;
};
exports.calculateExchange = calculateExchange;
exports.validCurrencies = ['USD', 'EUR', 'GBP', 'MAD', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'AED'];
//# sourceMappingURL=currencyService.js.map