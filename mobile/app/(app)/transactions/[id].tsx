import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Alert,
    StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft,
    Calendar,
    Wallet,
    Tag,
    TrendingUp,
    TrendingDown,
    RefreshCcw,
} from 'lucide-react-native';
import { isAxiosError } from 'axios';

import {
    useTransaction,
    useAccounts,
    useCategories,
    useCreateTransaction,
    useDeleteTransaction,
} from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth-store';
import { useThemeStore } from '@/store/theme-store';
import { formatCurrency } from '@/hooks/use-currency';
import { FONT_FAMILY, hexWithOpacity } from '@/constants/theme';
import type { Transaction } from '@/types';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';

export default function TransactionDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t, i18n } = useTranslation();
    const user = useAuthStore((state) => state.user);
    const colors = useThemeStore((state) => state.colors);

    const [isRedoModalOpen, setIsRedoModalOpen] = useState(false);
    const { mutate: createTransaction } = useCreateTransaction();
    const { mutateAsync: deleteTransaction } = useDeleteTransaction();

    const transactionId = Number(id);
    const {
        data: transaction,
        isLoading,
        isError,
    } = useTransaction(transactionId);
    const { data: accounts = [] } = useAccounts();
    const { data: categories = [] } = useCategories();

    const handleRedoTransaction = (
        transactionData: Omit<Transaction, 'id' | 'created_at'> & {
            account_id: number;
        }
    ) => {
        createTransaction(transactionData, {
            onSuccess: () => {
                setIsRedoModalOpen(false);
                router.replace('/transactions');
            },
        });
    };

    const handleDelete = () => {
        if (!transaction) return;
        Alert.alert(
            t('transactions.delete'),
            'Delete this transaction?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: t('transactions.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteTransaction(transaction.id);
                            router.back();
                        } catch (err: unknown) {
                            const msg =
                                (isAxiosError<{ error?: string }>(err) &&
                                    err.response?.data?.error) ||
                                'Error deleting transaction';
                            Alert.alert('Error', msg);
                        }
                    },
                },
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={styles.centerScreen}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (isError || !transaction) {
        return (
            <View style={styles.centerScreen}>
                <Text style={{ color: colors.mutedForeground }}>
                    {t('transactions.no_results')}
                </Text>
                <Pressable onPress={() => router.back()} style={styles.backLink}>
                    <Text style={{ color: colors.primary, fontFamily: FONT_FAMILY.bold }}>
                        {t('common.retry')}
                    </Text>
                </Pressable>
            </View>
        );
    }

    const account = accounts.find((a) => a.id === transaction.account_id);
    const category = categories.find((c) => c.id === transaction.category_id);
    const currency = account?.currency || user?.currency || 'USD';
    const isIncome = transaction.type === 'income';

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
                styles.content,
                { paddingBottom: Math.max(insets.bottom, 16) + 120 },
            ]}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    onPress={() => router.back()}
                    style={[
                        styles.backBtn,
                        {
                            backgroundColor: hexWithOpacity(colors.card, 0.7),
                            borderColor: colors.border,
                        },
                    ]}
                    accessibilityLabel="Go back"
                >
                    <ArrowLeft size={20} color={colors.foreground} />
                </Pressable>

                <View style={styles.headerTitleBlock}>
                    <Text
                        style={[
                            styles.headerSub,
                            { color: hexWithOpacity(colors.mutedForeground, 0.6) },
                        ]}
                    >
                        {t('transactions.title')}
                    </Text>
                    <Text
                        style={[styles.headerId, { color: colors.foreground }]}
                    >
                        #{transaction.id}
                    </Text>
                </View>

                <View style={styles.spacer} />
            </View>

            {/* Hero */}
            <View style={styles.hero}>
                <View
                    style={[
                        styles.heroBadge,
                        {
                            backgroundColor: isIncome
                                ? colors.emerald
                                : colors.red,
                            borderColor: colors.background,
                            shadowColor: isIncome ? colors.emerald : colors.red,
                        },
                    ]}
                >
                    {isIncome ? (
                        <TrendingUp size={40} color="#FFFFFF" strokeWidth={2.5} />
                    ) : (
                        <TrendingDown
                            size={40}
                            color="#FFFFFF"
                            strokeWidth={2.5}
                        />
                    )}
                </View>

                <View style={styles.heroAmountBlock}>
                    <Text
                        style={[
                            styles.heroAmount,
                            {
                                color: isIncome
                                    ? colors.emerald
                                    : colors.foreground,
                            },
                        ]}
                    >
                        {formatCurrency(
                            transaction.amount,
                            currency,
                            i18n.language
                        )}
                        {isIncome ? ' +' : ' -'}
                    </Text>
                    <Text
                        style={[
                            styles.heroDescription,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        {transaction.description}
                    </Text>
                </View>
            </View>

            {/* Details */}
            <View style={styles.detailsSection}>
                <Text
                    style={[
                        styles.sectionLabel,
                        { color: hexWithOpacity(colors.mutedForeground, 0.55) },
                    ]}
                >
                    {t('common.details', 'Details')}
                </Text>

                <View
                    style={[
                        styles.detailsCard,
                        {
                            backgroundColor: hexWithOpacity(colors.card, 0.65),
                            borderColor: hexWithOpacity(colors.border, 0.65),
                        },
                    ]}
                >
                    {/* Date & Time */}
                    <View style={styles.detailRow}>
                        <View style={styles.detailLeft}>
                            <View
                                style={[
                                    styles.detailIconBox,
                                    {
                                        backgroundColor: hexWithOpacity(
                                            colors.muted,
                                            0.6
                                        ),
                                    },
                                ]}
                            >
                                <Calendar
                                    size={18}
                                    color={colors.mutedForeground}
                                    strokeWidth={2.5}
                                />
                            </View>
                            <Text
                                style={[
                                    styles.detailLabel,
                                    { color: colors.mutedForeground },
                                ]}
                            >
                                {t('transactions.date', 'Date')}
                            </Text>
                        </View>
                        <View style={styles.detailRight}>
                            <Text
                                style={[
                                    styles.detailValue,
                                    { color: colors.foreground },
                                ]}
                            >
                                {new Date(
                                    transaction.created_at
                                ).toLocaleDateString(i18n.language, {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </Text>
                            <Text
                                style={[
                                    styles.detailTime,
                                    {
                                        color: hexWithOpacity(
                                            colors.mutedForeground,
                                            0.55
                                        ),
                                    },
                                ]}
                            >
                                {new Date(
                                    transaction.created_at
                                ).toLocaleTimeString(i18n.language, {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </Text>
                        </View>
                    </View>

                    <View
                        style={[
                            styles.divider,
                            { backgroundColor: hexWithOpacity(colors.border, 0.4) },
                        ]}
                    />

                    {/* Category */}
                    <View style={styles.detailRow}>
                        <View style={styles.detailLeft}>
                            <View
                                style={[
                                    styles.detailIconBox,
                                    {
                                        backgroundColor: hexWithOpacity(
                                            colors.muted,
                                            0.6
                                        ),
                                    },
                                ]}
                            >
                                <Tag
                                    size={18}
                                    color={colors.mutedForeground}
                                    strokeWidth={2.5}
                                />
                            </View>
                            <Text
                                style={[
                                    styles.detailLabel,
                                    { color: colors.mutedForeground },
                                ]}
                            >
                                {t('transactions.category')}
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.categoryPill,
                                {
                                    backgroundColor: hexWithOpacity(
                                        colors.muted,
                                        0.5
                                    ),
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.categoryPillText,
                                    { color: colors.foreground },
                                ]}
                            >
                                {category?.name ||
                                    t('transactions.uncategorized')}
                            </Text>
                        </View>
                    </View>

                    <View
                        style={[
                            styles.divider,
                            { backgroundColor: hexWithOpacity(colors.border, 0.4) },
                        ]}
                    />

                    {/* Type */}
                    <View style={styles.detailRow}>
                        <View style={styles.detailLeft}>
                            <View
                                style={[
                                    styles.detailIconBox,
                                    {
                                        backgroundColor: hexWithOpacity(
                                            colors.muted,
                                            0.6
                                        ),
                                    },
                                ]}
                            >
                                <TrendingUp
                                    size={18}
                                    color={colors.mutedForeground}
                                    strokeWidth={2.5}
                                />
                            </View>
                            <Text
                                style={[
                                    styles.detailLabel,
                                    { color: colors.mutedForeground },
                                ]}
                            >
                                {t('transactions.type')}
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.typePill,
                                {
                                    backgroundColor: isIncome
                                        ? colors.emeraldSoft
                                        : colors.redSoft,
                                    borderColor: isIncome
                                        ? hexWithOpacity(colors.emerald, 0.25)
                                        : hexWithOpacity(colors.red, 0.25),
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.typePillText,
                                    {
                                        color: isIncome
                                            ? colors.emerald
                                            : colors.red,
                                    },
                                ]}
                            >
                                {isIncome
                                    ? t('transactions.income')
                                    : t('transactions.expense')}
                            </Text>
                        </View>
                    </View>

                    <View
                        style={[
                            styles.divider,
                            { backgroundColor: hexWithOpacity(colors.border, 0.4) },
                        ]}
                    />

                    {/* Account */}
                    <View style={styles.detailRow}>
                        <View style={styles.detailLeft}>
                            <View
                                style={[
                                    styles.detailIconBox,
                                    {
                                        backgroundColor: hexWithOpacity(
                                            colors.muted,
                                            0.6
                                        ),
                                    },
                                ]}
                            >
                                <Wallet
                                    size={18}
                                    color={colors.mutedForeground}
                                    strokeWidth={2.5}
                                />
                            </View>
                            <Text
                                style={[
                                    styles.detailLabel,
                                    { color: colors.mutedForeground },
                                ]}
                            >
                                {t('settings.account')}
                            </Text>
                        </View>
                        <Text
                            style={[
                                styles.accountName,
                                { color: colors.foreground },
                            ]}
                        >
                            {account?.name || '—'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <Pressable
                    onPress={() => setIsRedoModalOpen(true)}
                    style={({ pressed }) => [
                        styles.repeatBtn,
                        {
                            backgroundColor: colors.primary,
                            shadowColor: colors.primary,
                            opacity: pressed ? 0.9 : 1,
                        },
                    ]}
                >
                    <RefreshCcw
                        size={18}
                        color={colors.primaryForeground}
                        strokeWidth={2.5}
                    />
                    <Text
                        style={[
                            styles.repeatText,
                            { color: colors.primaryForeground },
                        ]}
                    >
                        {t(
                            'transactions.repeat_transaction',
                            'Repeat Transaction'
                        )}
                    </Text>
                </Pressable>

                <Pressable
                    onPress={handleDelete}
                    style={({ pressed }) => [
                        styles.deleteBtn,
                        {
                            backgroundColor: colors.redSoft,
                            borderColor: hexWithOpacity(colors.red, 0.25),
                            opacity: pressed ? 0.85 : 1,
                        },
                    ]}
                >
                    <Text style={[styles.deleteText, { color: colors.red }]}>
                        {t('transactions.delete')}
                    </Text>
                </Pressable>
            </View>

            <AddTransactionModal
                isOpen={isRedoModalOpen}
                onClose={() => setIsRedoModalOpen(false)}
                onAdd={handleRedoTransaction}
                initialData={transaction}
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
        maxWidth: 480,
        width: '100%',
        alignSelf: 'center',
    },
    centerScreen: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    backLink: {
        padding: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleBlock: {
        alignItems: 'center',
    },
    headerSub: {
        fontSize: 10,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    headerId: {
        fontSize: 14,
        fontFamily: FONT_FAMILY.bold,
    },
    spacer: {
        width: 40,
        height: 40,
    },
    hero: {
        alignItems: 'center',
        gap: 20,
    },
    heroBadge: {
        width: 96,
        height: 96,
        borderRadius: 40,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.28,
        shadowRadius: 18,
        elevation: 10,
    },
    heroAmountBlock: {
        alignItems: 'center',
        gap: 4,
    },
    heroAmount: {
        fontSize: 24,
        fontFamily: FONT_FAMILY.bold,
        letterSpacing: -0.4,
    },
    heroDescription: {
        fontSize: 17,
        fontFamily: FONT_FAMILY.bold,
        textAlign: 'center',
    },
    detailsSection: {
        gap: 14,
    },
    sectionLabel: {
        fontSize: 10,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 3,
        paddingHorizontal: 8,
    },
    detailsCard: {
        borderRadius: 40,
        borderWidth: 1,
        overflow: 'hidden',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        gap: 12,
    },
    detailLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    detailIconBox: {
        width: 40,
        height: 40,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailLabel: {
        fontSize: 13,
        fontFamily: FONT_FAMILY.bold,
    },
    detailRight: {
        alignItems: 'flex-end',
    },
    detailValue: {
        fontSize: 13,
        fontFamily: FONT_FAMILY.bold,
    },
    detailTime: {
        fontSize: 11,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginTop: 2,
    },
    divider: {
        height: 1,
        marginHorizontal: 20,
    },
    categoryPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
    },
    categoryPillText: {
        fontSize: 12,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    typePill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
    },
    typePillText: {
        fontSize: 10,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    accountName: {
        fontSize: 13,
        fontFamily: FONT_FAMILY.bold,
    },
    actions: {
        gap: 12,
    },
    repeatBtn: {
        paddingVertical: 18,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 14,
        elevation: 6,
    },
    repeatText: {
        fontSize: 15,
        fontFamily: FONT_FAMILY.bold,
    },
    deleteBtn: {
        paddingVertical: 16,
        borderRadius: 24,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteText: {
        fontSize: 11,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
});
