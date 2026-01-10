/**
 * Converts a monetary amount (e.g. 10.50) to cents (integer) for storage.
 * Handles floating point precision issues using Math.round.
 * @param amount - The amount in standard currency units
 * @returns Cents (integer)
 */
export const toCents = (amount: number | string | null | undefined): number => {
    if (!amount) return 0;
    const val = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(val)) return 0;
    // Multiply by 100 and round to handle floating point noise
    return Math.round(val * 100);
};

/**
 * Converts stored cents (integer) back to a decimal number (float) for display/API.
 * @param cents - The amount in cents
 * @returns Amount in standard currency units (e.g. dollars)
 */
export const fromCents = (cents: number | null | undefined): number => {
    if (!cents) return 0;
    return cents / 100;
};
