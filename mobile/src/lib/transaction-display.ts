import type { Transaction } from '@/types';

/** Preserve the original currency when the server has not converted an amount. */
export function getTransactionDisplayAmount(transaction: Transaction): { amount: number; currency: string } {
    if (typeof transaction.convertedAmount === 'number' &&
        Number.isFinite(transaction.convertedAmount) && transaction.convertedCurrency) {
        return { amount: transaction.convertedAmount, currency: transaction.convertedCurrency };
    }
    return { amount: transaction.amount, currency: transaction.account?.currency || 'USD' };
}
