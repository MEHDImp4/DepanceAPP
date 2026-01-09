const axios = require('axios');

const prisma = require('./prisma');

const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

const getRates = async () => {
    try {
        // Check DB for cached rates
        const cachedRates = await prisma.exchangeRate.findMany();
        const now = Date.now();

        // Check if we have valid cached rates (assuming if we have some, we check timestamp of one)
        // For simplicity, verify if USD exists and is fresh
        const usdRate = cachedRates.find(r => r.currency === 'USD');

        if (usdRate && (now - new Date(usdRate.updatedAt).getTime() < CACHE_DURATION)) {
            // Reconstruct rates object
            const rates = {};
            cachedRates.forEach(r => rates[r.currency] = r.rate);
            return rates;
        }

        // Fetch fresh rates
        const response = await axios.get('https://open.er-api.com/v6/latest/USD');
        if (response.data && response.data.result === 'success') {
            const newRates = response.data.rates;

            // Validate essential currencies if API returns weird data, but open.er is reliable generally.
            // Update DB in a transaction (upsert) usually, but loop is fine effectively for this size
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
        console.error('Currency API Error:', error.message);

        // Fallback to DB cache even if expired
        const cachedRates = await prisma.exchangeRate.findMany();
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
