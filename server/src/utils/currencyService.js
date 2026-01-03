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
        // Fallback or rethrow? For now, if no cache and fail, we can't convert.
        if (ratesCache.rates) return ratesCache.rates;
        throw error;
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
