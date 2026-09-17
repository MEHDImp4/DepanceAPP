import { describe, expect, it } from 'vitest';
import type { Transaction } from '@/types';
import { getTransactionDisplayMoney } from './transaction-money';

const baseTransaction: Transaction = {
    id: 1,
    amount: 100,
    description: 'Test',
    type: 'expense',
    account_id: 1,
    created_at: '2026-09-17T10:00:00.000Z',
    account: { name: 'MAD wallet', currency: 'MAD' }
};

describe('getTransactionDisplayMoney', () => {
    it('uses backend-normalized amount and currency together', () => {
        expect(getTransactionDisplayMoney({
            ...baseTransaction,
            convertedAmount: 10,
            convertedCurrency: 'USD'
        }, 'EUR')).toEqual({ amount: 10, currency: 'USD' });
    });

    it('falls back to the account currency when no conversion was returned', () => {
        expect(getTransactionDisplayMoney(baseTransaction, 'USD')).toEqual({
            amount: 100,
            currency: 'MAD'
        });
    });
});
