import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    Pressable,
    ActivityIndicator,
    RefreshControl,
    StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
    Plus,
    Search,
    Filter,
    TrendingUp,
    TrendingDown,
} from 'lucide-react-native';

import type { Transaction } from '@/types';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import {
    useTransactions,
    useCreateTransaction,
    useCategories,
} from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth-store';
import { useThemeStore } from '@/store/theme-store';
import { formatCurrency } from '@/hooks/use-currency';
import { FONT_FAMILY, hexWithOpacity } from '@/constants/theme';

function groupTransactionsByDate(
    transactions: Transaction[],
    locale: string
): Record<string, Transaction[]> {
    const groups: Record<string, Transaction[]> = {};
    transactions.forEach((transaction) => {
        const date = new Date(transaction.created_at).toLocaleDateString(
            locale,
            {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }
        );
        if (!groups[date]) groups[date] = [];
        groups[date].push(transaction);
    });
    return groups;
}

export default function TransactionsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t, i18n } = useTranslation();
    const colors = useThemeStore((state) => state.colors);
    const user = useAuthStore((state) => state.user);

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    } = useTransactions();
    const transactions = data?.pages.flatMap((page) => page.items) ?? [];

    const { data: categories = [] } = useCategories();
    const { mutate: createTransaction } = useCreateTransaction();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refetch();
        } finally {
            setRefreshing(false);
        }
    }, [refetch]);

    const handleAddTransaction = (
        transactionData: Omit<Transaction, 'id' | 'created_at'> & {
            account_id: number;
        }
    ) => {
        createTransaction(transactionData, {
            onSuccess: () => setIsAddModalOpen(false),
        });
    };

    const filteredTransactions = transactions.filter((item) => {
        const matchesSearch = item.description
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchesCategory =
            categoryFilter === 'all' || item.category_id === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const groupedTransactions = groupTransactionsByDate(
        filteredTransactions,
        i18n.language
    );

    if (isLoading) {
        return (
            <View style={styles.centerScreen}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                    styles.content,
                    { paddingBottom: Math.max(insets.bottom, 16) + 140 },
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
                    <View style={styles.headerTop}>
                        <Text
                            style={[
                                styles.pageTitle,
                                { color: colors.foreground },
                            ]}
                        >
                            {t('nav.transactions')}
                        </Text>
                        <Pressable
                            onPress={() => setIsFilterOpen(!isFilterOpen)}
                            style={[
                                styles.filterBtn,
                                {
                                    backgroundColor: isFilterOpen
                                        ? colors.primary
                                        : colors.card,
                                    borderColor: isFilterOpen
                                        ? colors.primary
                                        : colors.border,
                                },
                            ]}
                            accessibilityLabel="Toggle filters"
                        >
                            <Filter
                                size={20}
                                color={
                                    isFilterOpen
                                        ? colors.primaryForeground
                                        : colors.mutedForeground
                                }
                                strokeWidth={2}
                            />
                        </Pressable>
                    </View>

                    {isFilterOpen ? (
                        <View
                            style={[
                                styles.filterCard,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <View style={styles.filterGroup}>
                                <Text
                                    style={[
                                        styles.filterLabel,
                                        { color: colors.mutedForeground },
                                    ]}
                                >
                                    {t('common.search', {
                                        defaultValue: 'Search',
                                    })}
                                </Text>
                                <View
                                    style={[
                                        styles.searchWrap,
                                        {
                                            backgroundColor: hexWithOpacity(
                                                colors.muted,
                                                0.6
                                            ),
                                            borderColor: colors.border,
                                        },
                                    ]}
                                >
                                    <Search
                                        size={16}
                                        color={colors.mutedForeground}
                                    />
                                    <TextInput
                                        value={search}
                                        onChangeText={setSearch}
                                        placeholder={t(
                                            'transactions.search_placeholder'
                                        )}
                                        placeholderTextColor={hexWithOpacity(
                                            colors.mutedForeground,
                                            0.55
                                        )}
                                        style={[
                                            styles.searchInput,
                                            { color: colors.foreground },
                                        ]}
                                    />
                                </View>
                            </View>

                            <View style={styles.filterGroup}>
                                <Text
                                    style={[
                                        styles.filterLabel,
                                        { color: colors.mutedForeground },
                                    ]}
                                >
                                    {t('transactions.category')}
                                </Text>
                                <View style={styles.chipsWrap}>
                                    <Pressable
                                        onPress={() => setCategoryFilter('all')}
                                        style={[
                                            styles.chip,
                                            {
                                                backgroundColor:
                                                    categoryFilter === 'all'
                                                        ? colors.primary
                                                        : colors.background,
                                                borderColor:
                                                    categoryFilter === 'all'
                                                        ? colors.primary
                                                        : colors.border,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                {
                                                    color:
                                                        categoryFilter === 'all'
                                                            ? colors.primaryForeground
                                                            : colors.mutedForeground,
                                                },
                                            ]}
                                        >
                                            {t('common.all', {
                                                defaultValue: 'All',
                                            })}
                                        </Text>
                                    </Pressable>

                                    {categories.map((category) => {
                                        const isSelected =
                                            categoryFilter === category.id;
                                        return (
                                            <Pressable
                                                key={category.id}
                                                onPress={() =>
                                                    setCategoryFilter(
                                                        category.id
                                                    )
                                                }
                                                style={[
                                                    styles.chip,
                                                    {
                                                        backgroundColor: isSelected
                                                            ? colors.primary
                                                            : colors.background,
                                                        borderColor: isSelected
                                                            ? colors.primary
                                                            : colors.border,
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.chipText,
                                                        {
                                                            color: isSelected
                                                                ? colors.primaryForeground
                                                                : colors.mutedForeground,
                                                        },
                                                    ]}
                                                >
                                                    {category.name}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>
                    ) : null}
                </View>

                {filteredTransactions.length === 0 ? (
                    <View
                        style={[
                            styles.emptyBox,
                            {
                                backgroundColor: hexWithOpacity(
                                    colors.muted,
                                    0.2
                                ),
                                borderColor: hexWithOpacity(
                                    colors.border,
                                    0.6
                                ),
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.emptyText,
                                { color: colors.mutedForeground },
                            ]}
                        >
                            {t('transactions.no_results')}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.groupsStack}>
                        {Object.entries(groupedTransactions).map(
                            ([date, items]) => (
                                <View key={date} style={styles.dateGroup}>
                                    <Text
                                        style={[
                                            styles.dateHeading,
                                            { color: colors.mutedForeground },
                                        ]}
                                    >
                                        {date}
                                    </Text>
                                    <View
                                        style={[
                                            styles.groupCard,
                                            {
                                                backgroundColor: colors.card,
                                                borderColor: colors.border,
                                            },
                                        ]}
                                    >
                                        {items.map((transaction, idx) => {
                                            const category = categories.find(
                                                (c) =>
                                                    c.id ===
                                                    transaction.category_id
                                            );
                                            const isIncome =
                                                transaction.type === 'income';
                                            return (
                                                <Pressable
                                                    key={transaction.id}
                                                    onPress={() =>
                                                        router.push(
                                                            `/transactions/${transaction.id}`
                                                        )
                                                    }
                                                    style={({ pressed }) => [
                                                        styles.txRow,
                                                        idx > 0 && {
                                                            borderTopWidth: 1,
                                                            borderTopColor:
                                                                hexWithOpacity(
                                                                    colors.border,
                                                                    0.5
                                                                ),
                                                        },
                                                        pressed && {
                                                            backgroundColor:
                                                                hexWithOpacity(
                                                                    colors.muted,
                                                                    0.45
                                                                ),
                                                        },
                                                    ]}
                                                >
                                                    <View
                                                        style={styles.txLeft}
                                                    >
                                                        <View
                                                            style={[
                                                                styles.txIconBox,
                                                                {
                                                                    backgroundColor:
                                                                        isIncome
                                                                            ? hexWithOpacity(
                                                                                  colors.emerald,
                                                                                  0.9
                                                                              )
                                                                            : hexWithOpacity(
                                                                                  colors.red,
                                                                                  0.9
                                                                              ),
                                                                },
                                                            ]}
                                                        >
                                                            {isIncome ? (
                                                                <TrendingUp
                                                                    size={18}
                                                                    color="#FFFFFF"
                                                                    strokeWidth={
                                                                        2.5
                                                                    }
                                                                />
                                                            ) : (
                                                                <TrendingDown
                                                                    size={18}
                                                                    color="#FFFFFF"
                                                                    strokeWidth={
                                                                        2.5
                                                                    }
                                                                />
                                                            )}
                                                        </View>
                                                        <View
                                                            style={
                                                                styles.txMeta
                                                            }
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.txDesc,
                                                                    {
                                                                        color: colors.foreground,
                                                                    },
                                                                ]}
                                                                numberOfLines={
                                                                    1
                                                                }
                                                            >
                                                                {
                                                                    transaction.description
                                                                }
                                                            </Text>
                                                            <Text
                                                                style={[
                                                                    styles.txCategory,
                                                                    {
                                                                        color: colors.mutedForeground,
                                                                    },
                                                                ]}
                                                                numberOfLines={
                                                                    1
                                                                }
                                                            >
                                                                {category
                                                                    ? category.name
                                                                    : t(
                                                                          'transactions.uncategorized'
                                                                      )}
                                                            </Text>
                                                        </View>
                                                    </View>

                                                    <Text
                                                        style={[
                                                            styles.txAmount,
                                                            {
                                                                color: isIncome
                                                                    ? colors.emerald
                                                                    : colors.foreground,
                                                            },
                                                        ]}
                                                    >
                                                        {formatCurrency(
                                                            transaction.amount,
                                                            user?.currency ||
                                                                'USD',
                                                            i18n.language
                                                        )}
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                </View>
                            )
                        )}
                    </View>
                )}

                {hasNextPage ? (
                    <View style={styles.loadMoreWrap}>
                        <Pressable
                            onPress={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            style={[
                                styles.loadMoreBtn,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                    opacity: isFetchingNextPage ? 0.5 : 1,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.loadMoreText,
                                    { color: colors.foreground },
                                ]}
                            >
                                {isFetchingNextPage
                                    ? t('common.loading', {
                                          defaultValue: 'Loading...',
                                      })
                                    : t('common.load_more', {
                                          defaultValue: 'Load more',
                                      })}
                            </Text>
                        </Pressable>
                    </View>
                ) : null}
            </ScrollView>

            {/* Floating Action Button positioned above BottomNav */}
            <Pressable
                onPress={() => setIsAddModalOpen(true)}
                style={({ pressed }) => [
                    styles.fab,
                    {
                        bottom: Math.max(insets.bottom, 12) + 88,
                        backgroundColor: colors.primary,
                        shadowColor: colors.primary,
                        transform: [{ scale: pressed ? 0.94 : 1 }],
                    },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('transactions.add_new')}
            >
                <Plus size={28} color={colors.primaryForeground} strokeWidth={2.5} />
            </Pressable>

            <AddTransactionModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddTransaction}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 24,
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
        paddingHorizontal: 6,
        paddingTop: 8,
        gap: 16,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pageTitle: {
        fontSize: 24,
        fontFamily: FONT_FAMILY.bold,
        letterSpacing: -0.4,
    },
    filterBtn: {
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    filterCard: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        gap: 16,
    },
    filterGroup: {
        gap: 8,
    },
    filterLabel: {
        fontSize: 10,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginLeft: 2,
    },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        fontFamily: FONT_FAMILY.medium,
        paddingVertical: 0,
    },
    chipsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 11,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    emptyBox: {
        paddingVertical: 48,
        borderRadius: 32,
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
    },
    groupsStack: {
        gap: 28,
    },
    dateGroup: {
        gap: 12,
    },
    dateHeading: {
        fontSize: 11,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 2.5,
        paddingHorizontal: 8,
    },
    groupCard: {
        borderWidth: 1,
        borderRadius: 32,
        overflow: 'hidden',
    },
    txRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        gap: 12,
    },
    txLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flex: 1,
        minWidth: 0,
    },
    txIconBox: {
        width: 40,
        height: 40,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    txMeta: {
        flex: 1,
        minWidth: 0,
        gap: 2,
    },
    txDesc: {
        fontSize: 14,
        fontFamily: FONT_FAMILY.semibold,
    },
    txCategory: {
        fontSize: 10,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    txAmount: {
        fontSize: 14,
        fontFamily: FONT_FAMILY.bold,
        flexShrink: 0,
    },
    loadMoreWrap: {
        alignItems: 'center',
    },
    loadMoreBtn: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    loadMoreText: {
        fontSize: 14,
        fontFamily: FONT_FAMILY.semibold,
    },
    fab: {
        position: 'absolute',
        right: 16,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 10,
        zIndex: 40,
    },
});
