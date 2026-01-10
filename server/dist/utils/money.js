"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromCents = exports.toCents = void 0;
/**
 * Converts a monetary amount (e.g. 10.50) to cents (integer) for storage.
 * Handles floating point precision issues using Math.round.
 * @param amount - The amount in standard currency units
 * @returns Cents (integer)
 */
const toCents = (amount) => {
    if (!amount)
        return 0;
    const val = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(val))
        return 0;
    // Multiply by 100 and round to handle floating point noise
    return Math.round(val * 100);
};
exports.toCents = toCents;
/**
 * Converts stored cents (integer) back to a decimal number (float) for display/API.
 * @param cents - The amount in cents
 * @returns Amount in standard currency units (e.g. dollars)
 */
const fromCents = (cents) => {
    if (!cents)
        return 0;
    return cents / 100;
};
exports.fromCents = fromCents;
//# sourceMappingURL=money.js.map