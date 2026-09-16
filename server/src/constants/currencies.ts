export const SUPPORTED_CURRENCIES = [
    'USD',
    'EUR',
    'GBP',
    'MAD',
    'CAD',
    'AUD',
    'CHF',
    'CNY',
    'AED'
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
