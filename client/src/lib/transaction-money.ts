import type { Transaction } from '@/types';

export const getTransactionDisplayMoney = (
    transaction: Transaction,
    fallbackCurrency = 'USD'
) => ({
    amount: transaction.convertedAmount ?? transaction.amount,
    currency:
        transaction.convertedCurrency ??
        transaction.account?.currency ??
        fallbackCurrency
});
