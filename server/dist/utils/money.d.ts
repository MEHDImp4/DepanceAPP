/**
 * Converts a monetary amount (e.g. 10.50) to cents (integer) for storage.
 * Handles floating point precision issues using Math.round.
 * @param amount - The amount in standard currency units
 * @returns Cents (integer)
 */
export declare const toCents: (amount: number | string | null | undefined) => number;
/**
 * Converts stored cents (integer) back to a decimal number (float) for display/API.
 * @param cents - The amount in cents
 * @returns Amount in standard currency units (e.g. dollars)
 */
export declare const fromCents: (cents: number | null | undefined) => number;
//# sourceMappingURL=money.d.ts.map