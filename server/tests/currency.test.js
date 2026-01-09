const { calculateExchange } = require('../src/utils/currencyService');

describe('Currency Service - calculateExchange', () => {
    const mockRates = {
        USD: 1,
        EUR: 0.85,
        MAD: 10
    };

    it('should return same amount if currencies are identical', () => {
        const result = calculateExchange(100, 'USD', 'USD', mockRates);
        expect(result).toBe(100);
    });

    it('should convert correctly from USD to Target', () => {
        // 100 USD -> EUR (0.85) = 85
        const result = calculateExchange(100, 'USD', 'EUR', mockRates);
        expect(result).toBe(85);
    });

    it('should convert correctly from Source to USD', () => {
        // 85 EUR -> USD
        // 85 / 0.85 = 100 USD
        const result = calculateExchange(85, 'EUR', 'USD', mockRates);
        expect(result).toBeCloseTo(100);
    });

    it('should convert correctly cross currency (EUR to MAD)', () => {
        // 85 EUR -> MAD
        // 85 EUR -> 100 USD -> 1000 MAD
        const result = calculateExchange(85, 'EUR', 'MAD', mockRates);
        expect(result).toBeCloseTo(1000);
    });

    it('should throw error if rate is missing', () => {
        expect(() => {
            calculateExchange(100, 'USD', 'XXX', mockRates);
        }).toThrow('Exchange rate not available');
    });
});
