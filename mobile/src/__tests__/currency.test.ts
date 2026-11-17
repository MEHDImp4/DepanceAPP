import {
    convertCurrency,
    formatCurrency,
    formatDecimal,
    getCurrencySymbol,
} from '@/hooks/use-currency';
import { hexWithOpacity, resolveColorHex } from '@/constants/theme';

describe('currency helpers', () => {
    const rates = {
        USD: 1,
        EUR: 0.9,
        MAD: 10,
        GBP: 0.8,
    };

    it('returns identical amount when currencies match or rates are missing', () => {
        expect(convertCurrency(100, 'USD', 'USD', rates)).toBe(100);
        expect(convertCurrency(100, 'eur', 'EUR', rates)).toBe(100);
        expect(convertCurrency(100, 'USD', 'EUR', undefined)).toBe(100);
        expect(convertCurrency(100, 'USD', 'UNKNOWN', rates)).toBe(100);
    });

    it('converts across currencies via USD base accurately', () => {
        expect(convertCurrency(90, 'EUR', 'USD', rates)).toBeCloseTo(100, 6);
        expect(convertCurrency(100, 'USD', 'MAD', rates)).toBeCloseTo(1000, 6);
        expect(convertCurrency(90, 'EUR', 'MAD', rates)).toBeCloseTo(1000, 6);
    });

    it('formats decimal and currency values safely', () => {
        expect(formatDecimal(1234.5, 'en-US', 2, 2)).toBe('1,234.50');
        expect(formatCurrency(50, 'USD', 'en-US')).toContain('50.00');
        expect(getCurrencySymbol('EUR')).toBe('€');
    });

    it('resolves Tailwind color classes to exact hex values and rgba opacity', () => {
        expect(resolveColorHex('bg-blue-500')).toBe('#3B82F6');
        expect(resolveColorHex('bg-emerald-500')).toBe('#10B981');
        expect(resolveColorHex('#123456')).toBe('#123456');
        expect(resolveColorHex(undefined, '#2563EB')).toBe('#2563EB');
        expect(hexWithOpacity('#2563EB', 0.5)).toBe('rgba(37, 99, 235, 0.5)');
    });
});
