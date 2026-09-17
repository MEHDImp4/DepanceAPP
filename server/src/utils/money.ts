export const MONEY_SCALE = 100;
export const MAX_MAJOR_UNITS = 21_000_000;

export const toCents = (amount: number | string | null | undefined): number => {
    if (amount === null || amount === undefined || amount === '') return 0;
    const val = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
    if (!Number.isFinite(val)) return 0;
    return Math.round(val * MONEY_SCALE);
};

export const fromCents = (cents: number | null | undefined): number => {
    if (cents === null || cents === undefined) return 0;
    return cents / MONEY_SCALE;
};

interface CurrencyAmountOptions {
    allowNegative?: boolean;
    allowZero?: boolean;
}

/**
 * The database stores money in a fixed 1/100 scale for all supported currencies.
 * Currencies such as JPY do not support fractional major units in the UI/API, so
 * reject fractions before persisting them instead of silently rounding at display.
 */
export const assertCurrencyAmount = (
    amount: number,
    currency: string,
    options: CurrencyAmountOptions = {}
): void => {
    const { allowNegative = false, allowZero = false } = options;

    if (!Number.isFinite(amount) || Math.abs(amount) > MAX_MAJOR_UNITS) {
        throw Object.assign(new Error('Amount is outside the supported monetary range'), {
            statusCode: 400,
            code: 'AMOUNT_OUT_OF_RANGE'
        });
    }

    if (!allowNegative && amount < 0) {
        throw Object.assign(new Error('Amount must not be negative'), {
            statusCode: 400,
            code: 'AMOUNT_NEGATIVE'
        });
    }

    if (!allowZero && amount === 0) {
        throw Object.assign(new Error('Amount must be greater than zero'), {
            statusCode: 400,
            code: 'AMOUNT_ZERO'
        });
    }

    if (currency.toUpperCase() === 'JPY' && !Number.isInteger(amount)) {
        throw Object.assign(new Error('JPY amounts must use whole yen'), {
            statusCode: 400,
            code: 'CURRENCY_FRACTION_UNSUPPORTED'
        });
    }

    const scaled = toCents(amount);
    if (!Number.isSafeInteger(scaled) || scaled > 2_147_483_647 || scaled < -2_147_483_648) {
        throw Object.assign(new Error('Amount cannot be represented safely'), {
            statusCode: 400,
            code: 'AMOUNT_OUT_OF_RANGE'
        });
    }
};
