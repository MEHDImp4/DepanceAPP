import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@/i18n';
import { CapitalCard } from '@/components/dashboard/CapitalCard';
import { AccountCard } from '@/components/accounts/AccountCard';
import { GoalCard } from '@/components/goals/GoalCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';

jest.mock('react-native-reanimated', () => {
    const { View } = require('react-native');
    return {
        __esModule: true,
        default: {
            View,
        },
        useSharedValue: (v: number) => ({ value: v }),
        useAnimatedStyle: (cb: () => Record<string, unknown>) => cb(),
        withTiming: (v: number) => v,
    };
});

jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    }),
    usePathname: () => '/',
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn().mockResolvedValue({ data: [] }),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
    },
}));

async function renderWithQuery(ui: React.ReactElement) {
    const client = new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0 },
        },
    });
    const rendered = await render(
        <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    );
    return { ...rendered, client };
}

describe('Core UI components parity', () => {
    it('renders CapitalCard with formatted balance and currency', async () => {
        const { getByText } = await render(
            <CapitalCard amount={4250.75} currency="EUR" />
        );

        expect(getByText('EUR')).toBeTruthy();
        expect(getByText(/4,250\.75|4\s250,75/)).toBeTruthy();
    });

    it('renders AccountCard and triggers onClick with account payload', async () => {
        const onClick = jest.fn();
        const account = {
            id: 7,
            name: 'Checking Plus',
            type: 'bank',
            currency: 'USD',
            balance: 1500,
            color: 'bg-blue-500',
        };

        const { getByText } = await render(
            <AccountCard account={account} onClick={onClick} />
        );

        expect(getByText('Checking Plus')).toBeTruthy();
        expect(getByText('bank')).toBeTruthy();
        await fireEvent.press(getByText('Checking Plus'));
        expect(onClick).toHaveBeenCalledWith(account);
    });

    it('renders GoalCard progress and triggers edit/delete/add funds', async () => {
        const onEdit = jest.fn();
        const onDelete = jest.fn();
        const onAddMoney = jest.fn();
        const goal = {
            id: 3,
            name: 'Emergency Fund',
            targetAmount: 1000,
            currentAmount: 400,
            currency: 'USD',
            deadline: null,
            icon: '🎯',
            created_at: new Date().toISOString(),
        };

        const { getByText, getByLabelText } = await render(
            <GoalCard
                goal={goal}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddMoney={onAddMoney}
            />
        );

        expect(getByText('Emergency Fund')).toBeTruthy();
        expect(getByText('40%')).toBeTruthy();

        await fireEvent.press(getByText('Add Funds'));
        expect(onAddMoney).toHaveBeenCalledWith(goal);

        await fireEvent.press(getByLabelText('Edit goal'));
        expect(onEdit).toHaveBeenCalledWith(goal);

        await fireEvent.press(getByLabelText('Delete goal'));
        expect(onDelete).toHaveBeenCalledWith(3);
    });

    it('renders RecentTransactions empty state when list is empty', async () => {
        const { getByText, client } = await renderWithQuery(
            <RecentTransactions transactions={[]} />
        );
        await waitFor(() => {
            expect(getByText(/No recent transactions found/i)).toBeTruthy();
        });
        client.clear();
    });
});
