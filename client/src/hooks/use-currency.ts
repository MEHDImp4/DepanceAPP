import { useQuery } from "@tanstack/react-query";

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
        queryKey: ["currency-rates"],
        queryFn: async () => {
            const response = await fetch("https://open.er-api.com/v6/latest/USD");
            if (!response.ok) {
                throw new Error("Failed to fetch exchange rates");
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

    const fromRate = rates[from];
    const toRate = rates[to];

    if (!fromRate || !toRate) return amount;

    // Convert to base (USD) then to target
    const inBase = amount / fromRate;
    return inBase * toRate;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount);
}
