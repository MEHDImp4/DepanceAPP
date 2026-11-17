import { getTransactionDisplayAmount } from '@/lib/transaction-display';
import type { Transaction } from '@/types';

const original: Transaction = {
    id: 1, amount: 100, description: 'Travel', type: 'expense', account_id: 1,
    created_at: '2026-11-17T08:00:00.000Z', account: { name: 'Euro card', currency: 'EUR' },
};

describe('transaction display currencies', () => {
    it('matches converted amount to its currency', () => {
        expect(getTransactionDisplayAmount({ ...original, convertedAmount: 1050, convertedCurrency: 'MAD' }))
            .toEqual({ amount: 1050, currency: 'MAD' });
    });
    it('retains the original currency when conversion is unavailable', () => {
        expect(getTransactionDisplayAmount(original)).toEqual({ amount: 100, currency: 'EUR' });
    });
    it('keeps valid zero converted amounts', () => {
        expect(getTransactionDisplayAmount({ ...original, convertedAmount: 0, convertedCurrency: 'MAD' }))
            .toEqual({ amount: 0, currency: 'MAD' });
    });
});
