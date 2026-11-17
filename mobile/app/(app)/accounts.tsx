import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    RefreshControl,
    StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Plus, ArrowRightLeft } from 'lucide-react-native';

import { AccountCard } from '@/components/accounts/AccountCard';
import { AddAccountModal } from '@/components/accounts/AddAccountModal';
import { TransferModal } from '@/components/accounts/TransferModal';
import {
    useAccounts,
    useAccountSummary,
    useCreateAccount,
    useUpdateAccount,
} from '@/hooks/use-api';
import { formatDecimal } from '@/hooks/use-currency';
import { useAuthStore } from '@/store/auth-store';
import { useThemeStore } from '@/store/theme-store';
import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { FONT_FAMILY, hexWithOpacity } from '@/constants/theme';
import type { Account } from '@/types';
import { isAxiosError } from 'axios';

export default function AccountsScreen() {
    const { t, i18n } = useTranslation();
    const insets = useSafeAreaInsets();
    const user = useAuthStore((state) => state.user);
    const { theme, colors } = useThemeStore();

    const { data: accounts = [], isLoading, refetch } = useAccounts();
    const createAccount = useCreateAccount();
    const updateAccount = useUpdateAccount();
    const { data: accountSummary, refetch: refetchSummary } = useAccountSummary();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [accountSubmitError, setAccountSubmitError] = useState('');
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([refetch(), refetchSummary()]);
        } finally {
            setRefreshing(false);
        }
    }, [refetch, refetchSummary]);

    const handleSave = (accountData: Omit<Account, 'id'> | Account) => {
        if (createAccount.isPending || updateAccount.isPending) return;
        setAccountSubmitError('');
        const onSuccess = () => {
            setIsModalOpen(false);
            setSelectedAccount(null);
        };
        const onError = (error: unknown) => {
            setAccountSubmitError(
                isAxiosError<{ error?: string }>(error)
                    ? error.response?.data?.error || 'Could not save account'
                    : 'Could not save account'
            );
        };
        if ('id' in accountData) {
            updateAccount.mutate(accountData as Account, { onSuccess, onError });
        } else {
            createAccount.mutate(accountData, { onSuccess, onError });
        }
    };

    const handleEditAccount = (account: Account) => {
        setAccountSubmitError('');
        setSelectedAccount(account);
        setIsModalOpen(true);
    };

    const handleAddClick = () => {
        setAccountSubmitError('');
        setSelectedAccount(null);
        setIsModalOpen(true);
    };



    if (isLoading) {
        return (
            <View style={styles.centerScreen}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    // Never show an incorrect mixed-currency total if server conversion is unavailable.
    const formattedNetWorth = accountSummary
        ? formatDecimal(accountSummary.totalBalance, i18n.language, 2, 2)
        : '—';
    const len = formattedNetWorth.length;
    const netWorthFontSize = len > 13 ? 24 : len > 10 ? 30 : len > 7 ? 36 : 46;

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
                styles.content,
                { paddingBottom: Math.max(insets.bottom, 16) + 128 },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.primary}
                />
            }
        >
            <View style={styles.header}>
                <Text
                    style={[styles.pageTitle, { color: colors.foreground }]}
                >
                    {t('accounts.title')}
                </Text>
                <View style={styles.headerActions}>
                    <Pressable
                        onPress={() => setIsTransferModalOpen(true)}
                        style={({ pressed }) => [
                            styles.headerIconBtn,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                opacity: pressed ? 0.8 : 1,
                            },
                        ]}
                        accessibilityLabel={
                            t('accounts.transfer_funds') || 'Transfer Funds'
                        }
                    >
                        <ArrowRightLeft
                            size={22}
                            color={colors.foreground}
                            strokeWidth={2.5}
                        />
                    </Pressable>
                    <Pressable
                        onPress={handleAddClick}
                        style={({ pressed }) => [
                            styles.headerIconBtn,
                            {
                                backgroundColor: colors.primary,
                                borderColor: colors.primary,
                                opacity: pressed ? 0.85 : 1,
                            },
                        ]}
                        accessibilityLabel={t('accounts.add_account')}
                    >
                        <Plus
                            size={24}
                            color={colors.primaryForeground}
                            strokeWidth={3}
                        />
                    </Pressable>
                </View>
            </View>

            {/* Total Net Worth Overview Card */}
            <View
                style={[
                    styles.overviewCard,
                    {
                        backgroundColor: colors.card,
                        borderColor:
                            theme === 'dark'
                                ? 'rgba(255, 255, 255, 0.08)'
                                : colors.border,
                    },
                ]}
            >
                <AmbientGlow
                    color={colors.primary}
                    opacity={theme === 'dark' ? 0.16 : 0.1}
                    size={240}
                    style={{ top: -90, right: -85 }}
                />
                <View style={styles.overviewContent}>
                    <Text
                        style={[
                            styles.overviewLabel,
                            {
                                color: hexWithOpacity(
                                    colors.mutedForeground,
                                    0.7
                                ),
                            },
                        ]}
                    >
                        {t('accounts.total_net_worth')}
                    </Text>
                    <View style={styles.netWorthRow}>
                        <Text
                            style={[
                                styles.netWorthAmount,
                                {
                                    color: colors.foreground,
                                    fontSize: netWorthFontSize,
                                    lineHeight: netWorthFontSize * 1.15,
                                },
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {formattedNetWorth}
                        </Text>
                        <View
                            style={[
                                styles.currencyTag,
                                {
                                    backgroundColor: hexWithOpacity(
                                        colors.muted,
                                        0.65
                                    ),
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.currencyText,
                                    { color: colors.mutedForeground },
                                ]}
                            >
                                {accountSummary?.currency || user?.currency || 'USD'}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Accounts List */}
            <View style={styles.listSection}>
                <Text
                    style={[
                        styles.sectionLabel,
                        {
                            color: hexWithOpacity(
                                colors.mutedForeground,
                                0.7
                            ),
                        },
                    ]}
                >
                    {t('accounts.my_accounts')}
                </Text>

                <View
                    style={[
                        styles.accountsCard,
                        {
                            backgroundColor: hexWithOpacity(colors.card, 0.75),
                            borderColor: colors.border,
                        },
                    ]}
                >
                    {accounts.map((account, index) => (
                        <AccountCard
                            key={account.id}
                            account={account}
                            onClick={handleEditAccount}
                            showTopBorder={index > 0}
                        />
                    ))}
                </View>
            </View>

            <AddAccountModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedAccount(null);
                }}
                onAdd={handleSave}
                account={selectedAccount}
                isSubmitting={createAccount.isPending || updateAccount.isPending}
                submitError={accountSubmitError}
            />

            <TransferModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                accounts={accounts}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 32,
        maxWidth: 448,
        width: '100%',
        alignSelf: 'center',
    },
    centerScreen: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 96,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 8,
        paddingHorizontal: 4,
    },
    pageTitle: {
        fontSize: 30,
        fontFamily: FONT_FAMILY.bold,
        letterSpacing: -0.5,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    headerIconBtn: {
        width: 48,
        height: 48,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    overviewCard: {
        position: 'relative',
        overflow: 'hidden',
        borderWidth: 1,
        borderRadius: 40,
        padding: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 6,
    },
    overviewContent: {
        gap: 12,
    },
    overviewLabel: {
        fontSize: 12,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 3.8,
    },
    netWorthRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    netWorthAmount: {
        fontFamily: FONT_FAMILY.bold,
        letterSpacing: -1,
        flexShrink: 1,
    },
    currencyTag: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    currencyText: {
        fontSize: 13,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.6,
    },
    listSection: {
        gap: 14,
    },
    sectionLabel: {
        fontSize: 12,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 2.2,
        paddingHorizontal: 8,
    },
    accountsCard: {
        borderRadius: 32,
        borderWidth: 1,
        overflow: 'hidden',
    },
});
