const axios = require('axios');

// Simple in-memory cache to avoid hitting API on every request
let ratesCache = {
    base: 'USD',
    rates: null,
    timestamp: 0
};

const CACHE_DURATION = 1000 * 60 * 60; // 1 hour


const getRates = async () => {
    const now = Date.now();
    if (ratesCache.rates && (now - ratesCache.timestamp < CACHE_DURATION)) {
        return ratesCache.rates;
    }

    try {
        // Free API, no key required
        const response = await axios.get('https://open.er-api.com/v6/latest/USD');
        if (response.data && response.data.result === 'success') {
            ratesCache.rates = response.data.rates;
            ratesCache.timestamp = now;
            return ratesCache.rates;
        }
        throw new Error('Failed to fetch rates');
    } catch (error) {
        console.error('Currency API Error:', error.message);
        // Fallback to static rates if API fails
        if (ratesCache.rates) return ratesCache.rates;

        console.warn('Using static fallback rates due to API failure.');
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
 * Convert amount from one currency to another
 */
exports.convertCurrency = async (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;

    const rates = await getRates();
    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];

    if (!fromRate || !toRate) {
        throw new Error(`Exchange rate not available for ${fromCurrency} or ${toCurrency}`);
    }

    // Convert to USD then to Target
    // AmountInUSD = Amount / FromRate
    // AmountInTarget = AmountInUSD * ToRate

    // Example: 100 EUR to MAD. (USD base)
    // 1 USD = 0.9 EUR
    // 1 USD = 10 MAD
    // 100 EUR = 100 / 0.9 = 111.11 USD
    // 111.11 USD * 10 = 1111.1 MAD

    const amountInUSD = amount / fromRate;
    return amountInUSD * toRate;
};

exports.validCurrencies = ['USD', 'EUR', 'GBP', 'MAD', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'AED']; // Common list
