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
import { Wallet } from 'lucide-react-native';

import { CapitalCard } from '@/components/dashboard/CapitalCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { useSummary, useAccounts } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth-store';
import { useThemeStore } from '@/store/theme-store';
import { useCurrencyRates, convertCurrency } from '@/hooks/use-currency';
import { FONT_FAMILY, hexWithOpacity } from '@/constants/theme';

export default function DashboardScreen() {
    const { t, i18n } = useTranslation();
    const insets = useSafeAreaInsets();
    const colors = useThemeStore((state) => state.colors);
    const user = useAuthStore((state) => state.user);

    const {
        data: summary,
        isLoading: isSummaryLoading,
        error,
        refetch: refetchSummary,
    } = useSummary();
    const { data: accounts = [], refetch: refetchAccounts } = useAccounts();
    const { data: ratesData, refetch: refetchRates } = useCurrencyRates();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                refetchSummary(),
                refetchAccounts(),
                refetchRates(),
            ]);
        } finally {
            setRefreshing(false);
        }
    }, [refetchSummary, refetchAccounts, refetchRates]);

    if (isSummaryLoading) {
        return (
            <View style={styles.centerScreen}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorScreen}>
                <View
                    style={[
                        styles.errorIconCircle,
                        { backgroundColor: colors.redSoft },
                    ]}
                >
                    <Text style={styles.warningEmoji}>⚠️</Text>
                </View>
                <Text
                    style={[styles.errorTitle, { color: colors.foreground }]}
                >
                    {t('common.error_dashboard_title')}
                </Text>
                <Text
                    style={[
                        styles.errorDesc,
                        { color: colors.mutedForeground },
                    ]}
                >
                    {t('common.error_dashboard_desc')}
                </Text>
                <Pressable
                    onPress={() => refetchSummary()}
                    style={({ pressed }) => [
                        styles.retryBtn,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            opacity: pressed ? 0.8 : 1,
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.retryText,
                            { color: colors.foreground },
                        ]}
                    >
                        {t('common.retry')}
                    </Text>
                </Pressable>
            </View>
        );
    }

    const totalCapital = accounts.reduce((acc, curr) => {
        const convertedBalance = convertCurrency(
            curr.balance,
            curr.currency,
            user?.currency || 'USD',
            ratesData?.rates
        );
        return acc + convertedBalance;
    }, 0);

    const transactions = summary?.transactions?.slice(0, 5) || [];
    const todayLabel = new Date().toLocaleDateString(i18n.language, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
                styles.content,
                { paddingBottom: Math.max(insets.bottom, 16) + 120 },
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
                <View
                    style={[
                        styles.logoBadge,
                        {
                            backgroundColor: hexWithOpacity(colors.primary, 0.12),
                            borderColor: hexWithOpacity(colors.primary, 0.25),
                        },
                    ]}
                >
                    <Wallet size={32} color={colors.primary} strokeWidth={1.5} />
                </View>
                <View style={styles.headerText}>
                    <Text
                        style={[
                            styles.dateText,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        {todayLabel}
                    </Text>
                    <Text
                        style={[
                            styles.pageTitle,
                            { color: colors.foreground },
                        ]}
                    >
                        {t('nav.dashboard')}
                    </Text>
                </View>
            </View>

            <CapitalCard
                amount={totalCapital}
                currency={user?.currency || 'USD'}
            />

            <RecentTransactions transactions={transactions} />
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
    errorScreen: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingBottom: 96,
        gap: 12,
    },
    errorIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    warningEmoji: {
        fontSize: 26,
    },
    errorTitle: {
        fontSize: 20,
        fontFamily: FONT_FAMILY.bold,
        textAlign: 'center',
    },
    errorDesc: {
        fontSize: 14,
        textAlign: 'center',
        maxWidth: 280,
    },
    retryBtn: {
        marginTop: 12,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
    },
    retryText: {
        fontSize: 12,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.6,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 16,
        gap: 16,
    },
    logoBadge: {
        width: 56,
        height: 56,
        borderRadius: 24,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {
        alignItems: 'center',
        gap: 4,
    },
    dateText: {
        fontSize: 11,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 3,
        textAlign: 'center',
    },
    pageTitle: {
        fontSize: 24,
        fontFamily: FONT_FAMILY.bold,
        letterSpacing: -0.4,
    },
});
