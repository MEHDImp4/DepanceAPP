import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { Transaction } from '@/types';
import { useCategories } from '@/hooks/use-api';
import { useThemeStore } from '@/store/theme-store';
import { FONT_FAMILY, hexWithOpacity } from '@/constants/theme';
import { formatCurrency } from '@/hooks/use-currency';
import { getTransactionDisplayAmount } from '@/lib/transaction-display';

interface RecentTransactionsProps {
    transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const { data: categories = [] } = useCategories();
    const colors = useThemeStore((state) => state.colors);

    return (
        <View style={styles.wrapper}>
            <View style={styles.headerRow}>
                <Text
                    style={[
                        styles.sectionTitle,
                        { color: colors.mutedForeground },
                    ]}
                >
                    {t('dashboard.recent_transactions')}
                </Text>
                <Pressable
                    onPress={() => router.push('/transactions')}
                    hitSlop={8}
                >
                    <Text style={[styles.seeAll, { color: colors.primary }]}>
                        {t('common.see_all')}
                    </Text>
                </Pressable>
            </View>

            {transactions.length > 0 ? (
                <View
                    style={[
                        styles.listCard,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                        },
                    ]}
                >
                    {transactions.map((transaction, index) => {
                        const category = categories.find(
                            (c) => c.id === transaction.category_id
                        );
                        const isIncome = transaction.type === 'income';
                        const badgeBg = isIncome
                            ? hexWithOpacity(colors.emerald, 0.9)
                            : hexWithOpacity(colors.red, 0.9);
                        const formattedDate = new Date(
                            transaction.created_at
                        ).toLocaleDateString(i18n.language, {
                            month: 'short',
                            day: 'numeric',
                        });

                        return (
                            <Pressable
                                key={transaction.id}
                                onPress={() =>
                                    router.push(`/transactions/${transaction.id}`)
                                }
                                style={({ pressed }) => [
                                    styles.row,
                                    index > 0 && {
                                        borderTopWidth: 1,
                                        borderTopColor: hexWithOpacity(colors.border, 0.5),
                                    },
                                    pressed && {
                                        backgroundColor: hexWithOpacity(colors.muted, 0.45),
                                    },
                                ]}
                            >
                                <View style={styles.rowLeft}>
                                    <View
                                        style={[
                                            styles.iconBox,
                                            {
                                                backgroundColor: badgeBg,
                                                shadowColor: badgeBg,
                                            },
                                        ]}
                                    >
                                        <LinearGradient
                                            colors={[
                                                'rgba(255,255,255,0.28)',
                                                'rgba(255,255,255,0)',
                                            ]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.iconGloss}
                                        />
                                        {isIncome ? (
                                            <TrendingUp
                                                size={18}
                                                color="#FFFFFF"
                                                strokeWidth={2.5}
                                            />
                                        ) : (
                                            <TrendingDown
                                                size={18}
                                                color="#FFFFFF"
                                                strokeWidth={2.5}
                                            />
                                        )}
                                    </View>
                                    <View style={styles.textWrap}>
                                        <Text
                                            style={[
                                                styles.description,
                                                { color: colors.foreground },
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {transaction.description}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.category,
                                                { color: colors.mutedForeground },
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {category
                                                ? category.name
                                                : t('transactions.uncategorized')}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.rowRight}>
                                    <Text
                                        style={[
                                            styles.amount,
                                            {
                                                color: isIncome
                                                    ? colors.emerald
                                                    : colors.foreground,
                                            },
                                        ]}
                                    >
                                        {formatCurrency(
                                            getTransactionDisplayAmount(transaction).amount,
                                            getTransactionDisplayAmount(transaction).currency,
                                            i18n.language
                                        )}
                                        {isIncome ? ' +' : ' -'}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.dateText,
                                            {
                                                color: hexWithOpacity(
                                                    colors.mutedForeground,
                                                    0.6
                                                ),
                                            },
                                        ]}
                                    >
                                        {formattedDate}
                                    </Text>
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
            ) : (
                <View
                    style={[
                        styles.emptyCard,
                        {
                            backgroundColor: hexWithOpacity(colors.muted, 0.25),
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.emptyText,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        {t('dashboard.no_transactions')}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        gap: 20,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    sectionTitle: {
        fontSize: 11,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 2.2,
    },
    seeAll: {
        fontSize: 11,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.6,
    },
    listCard: {
        borderRadius: 32,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 16,
        elevation: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
        gap: 12,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flex: 1,
        minWidth: 0,
    },
    iconBox: {
        width: 42,
        height: 42,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
    },
    iconGloss: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    textWrap: {
        flex: 1,
        minWidth: 0,
        gap: 2,
    },
    description: {
        fontSize: 14,
        fontFamily: FONT_FAMILY.semibold,
    },
    category: {
        fontSize: 10,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    rowRight: {
        alignItems: 'flex-end',
        flexShrink: 0,
        gap: 2,
    },
    amount: {
        fontSize: 14,
        fontFamily: FONT_FAMILY.bold,
    },
    dateText: {
        fontSize: 10,
        fontFamily: FONT_FAMILY.medium,
        textTransform: 'uppercase',
    },
    emptyCard: {
        paddingVertical: 40,
        paddingHorizontal: 20,
        borderRadius: 32,
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 12,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.6,
    },
});
