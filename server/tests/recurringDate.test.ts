import { advanceRecurringDate } from '../src/services/recurringService';

describe('Recurring date anchors', () => {
    it('keeps a monthly 31st anchor across short months', () => {
        const january = new Date('2027-01-31T12:00:00.000Z');
        const february = advanceRecurringDate(january, 'monthly', 31, 'UTC');
        const march = advanceRecurringDate(february, 'monthly', 31, 'UTC');

        expect(february.toISOString()).toBe('2027-02-28T12:00:00.000Z');
        expect(march.toISOString()).toBe('2027-03-31T12:00:00.000Z');
    });

    it('restores February 29 for yearly leap-day recurrence', () => {
        const leapDay = new Date('2024-02-29T12:00:00.000Z');
        const nextYear = advanceRecurringDate(leapDay, 'yearly', 29, 'UTC');
        const nextLeapYear = advanceRecurringDate(
            advanceRecurringDate(
                advanceRecurringDate(nextYear, 'yearly', 29, 'UTC'),
                'yearly',
                29,
                'UTC'
            ),
            'yearly',
            29,
            'UTC'
        );

        expect(nextYear.toISOString()).toBe('2025-02-28T12:00:00.000Z');
        expect(nextLeapYear.toISOString()).toBe('2028-02-29T12:00:00.000Z');
    });

    it('preserves local wall-clock time across daylight-saving changes', () => {
        // 09:00 New York is 14:00Z before DST and 13:00Z after the March transition.
        const beforeDst = new Date('2026-03-01T14:00:00.000Z');
        const afterDst = advanceRecurringDate(beforeDst, 'weekly', 1, 'America/New_York');

        expect(afterDst.toISOString()).toBe('2026-03-08T13:00:00.000Z');
    });
});
