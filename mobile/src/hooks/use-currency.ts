import { useQuery } from '@tanstack/react-query';

interface ExchangeRates {
    result: string;
    provider: string;
    documentation: string;
    terms_of_use: string;
    time_last_update_unix: number;
    time_last_update_utc: string;
    time_next_update_unix: number;
    time_next_update_utc: string;
    base_code: string;
    rates: Record<string, number>;
}

export function useCurrencyRates() {
    return useQuery({
        queryKey: ['currency-rates'],
        queryFn: async () => {
            const response = await fetch('https://open.er-api.com/v6/latest/USD');
            if (!response.ok) {
                throw new Error('Failed to fetch exchange rates');
            }
            return response.json() as Promise<ExchangeRates>;
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });
}

export function convertCurrency(
    amount: number,
    from: string,
    to: string,
    rates?: Record<string, number>
): number {
    if (!rates) return amount;
    if (from.toUpperCase() === to.toUpperCase()) return amount;

    const fromRate = rates[from.toUpperCase()];
    const toRate = rates[to.toUpperCase()];

    if (!fromRate || !toRate) return amount;

    // Convert to base (USD) then to target
    const inBase = amount / fromRate;
    return inBase * toRate;
}

export function formatCurrency(
    amount: number,
    currency: string = 'USD',
    locale: string = 'en-US',
    options?: Intl.NumberFormatOptions
): string {
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            ...options,
        }).format(amount);
    } catch {
        return `${amount.toFixed(2)} ${currency}`;
    }
}

export function formatDecimal(
    amount: number,
    locale: string = 'en-US',
    minimumFractionDigits: number = 2,
    maximumFractionDigits: number = 2
): string {
    try {
        return new Intl.NumberFormat(locale, {
            style: 'decimal',
            minimumFractionDigits,
            maximumFractionDigits,
        }).format(amount);
    } catch {
        return amount.toFixed(maximumFractionDigits);
    }
}

export function getCurrencySymbol(currency: string = 'USD'): string {
    try {
        const parts = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).formatToParts(0);
        return parts.find((part) => part.type === 'currency')?.value || '$';
    } catch {
        const symbols: Record<string, string> = {
            USD: '$',
            EUR: '€',
            GBP: '£',
            MAD: 'MAD',
            JPY: '¥',
            CAD: '$',
            AUD: '$',
            CHF: 'Fr',
            CNY: '¥',
        };
        return symbols[currency] || '$';
    }
}
