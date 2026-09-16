import { advanceRecurringDate } from '../src/services/recurringService';

describe('Recurring date anchors', () => {
    it('keeps a monthly 31st anchor across short months', () => {
        const january = new Date(2027, 0, 31, 12, 0, 0);
        const february = advanceRecurringDate(january, 'monthly', 31);
        const march = advanceRecurringDate(february, 'monthly', 31);

        expect(february.getFullYear()).toBe(2027);
        expect(february.getMonth()).toBe(1);
        expect(february.getDate()).toBe(28);
        expect(march.getMonth()).toBe(2);
        expect(march.getDate()).toBe(31);
    });

    it('restores February 29 for yearly leap-day recurrence', () => {
        const leapDay = new Date(2024, 1, 29, 12, 0, 0);
        const nextYear = advanceRecurringDate(leapDay, 'yearly', 29);
        const nextLeapYear = advanceRecurringDate(
            advanceRecurringDate(
                advanceRecurringDate(nextYear, 'yearly', 29),
                'yearly',
                29
            ),
            'yearly',
            29
        );

        expect(nextYear.getFullYear()).toBe(2025);
        expect(nextYear.getMonth()).toBe(1);
        expect(nextYear.getDate()).toBe(28);
        expect(nextLeapYear.getFullYear()).toBe(2028);
        expect(nextLeapYear.getMonth()).toBe(1);
        expect(nextLeapYear.getDate()).toBe(29);
    });
});
