/**
 * Converts a monetary amount (e.g. 10.50) to cents (integer) for storage.
 * Handles floating point precision issues using Math.round.
 * @param {number|string} amount 
 * @returns {number} Cents (integer)
 */
exports.toCents = (amount) => {
    if (!amount) return 0;
    // Ensure we work with a number
    const val = parseFloat(amount);
    if (isNaN(val)) return 0;
    // Multiply by 100 and round to handle floating point noise (e.g. 10.55 * 100 = 1054.9999...)
    return Math.round(val * 100);
};

/**
 * Converts stored cents (integer) back to a decimal number (float) for display/API.
 * @param {number} cents 
 * @returns {number} Amount in standard currency units (e.g. dollars)
 */
exports.fromCents = (cents) => {
    if (!cents) return 0;
    return cents / 100;
};
