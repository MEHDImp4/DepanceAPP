import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    RefreshControl,
    Alert,
    StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Plus,
    Repeat,
    Trash2,
    ArrowLeft,
    Calendar,
    Wallet,
} from 'lucide-react-native';
import { format, isValid } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

import { useRecurring, useDeleteRecurring } from '@/hooks/use-api';
import { useThemeStore } from '@/store/theme-store';
import { formatCurrency } from '@/hooks/use-currency';
import { FONT_FAMILY, hexWithOpacity, resolveColorHex } from '@/constants/theme';
import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { AddRecurringModal } from '@/components/recurring/AddRecurringModal';

export default function RecurringScreen() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colors = useThemeStore((state) => state.colors);

    const { data: recurring = [], isLoading, refetch } = useRecurring();
    const deleteRecurring = useDeleteRecurring();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refetch();
        } finally {
            setRefreshing(false);
        }
    }, [refetch]);

    const handleDelete = (id: number) => {
        Alert.alert(
            t('common.delete'),
            t('common.confirm_delete') || 'Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: () => deleteRecurring.mutate(id),
                },
            ]
        );
    };

    const dateLocale = i18n.language.startsWith('fr') ? fr : enUS;

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
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Pressable
                        onPress={() => router.back()}
                        style={[
                            styles.backBtn,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                            },
                        ]}
                        accessibilityLabel="Go back"
                    >
                        <ArrowLeft size={20} color={colors.mutedForeground} />
                    </Pressable>
                    <View style={styles.headerTitles}>
                        <Text
                            style={[
                                styles.pageTitle,
                                { color: colors.foreground },
                            ]}
                        >
                            {t('nav.recurring') || 'Recurring'}
                        </Text>
                        <Text
                            style={[
                                styles.subtitle,
                                { color: colors.mutedForeground },
                            ]}
                        >
                            {t('recurring.subtitle') ||
                                'Automate your recurring expenses'}
                        </Text>
                    </View>
                </View>

                <Pressable
                    onPress={() => setIsModalOpen(true)}
                    style={({ pressed }) => [
                        styles.addBtn,
                        {
                            backgroundColor: colors.primary,
                            shadowColor: colors.primary,
                            opacity: pressed ? 0.9 : 1,
                        },
                    ]}
                    accessibilityLabel={t('recurring.add_title')}
                >
                    <Plus
                        size={24}
                        color={colors.primaryForeground}
                        strokeWidth={3}
                    />
                </Pressable>
            </View>

            {/* List */}
            {isLoading ? (
                <View style={styles.loaderWrap}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : recurring.length === 0 ? (
                <View
                    style={[
                        styles.emptyCard,
                        {
                            backgroundColor: hexWithOpacity(colors.card, 0.5),
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.emptyIconBox,
                            { backgroundColor: colors.muted },
                        ]}
                    >
                        <Repeat
                            size={32}
                            color={hexWithOpacity(colors.mutedForeground, 0.4)}
                        />
                    </View>
                    <Text
                        style={[
                            styles.emptyTitle,
                            { color: colors.foreground },
                        ]}
                    >
                        {t('recurring.empty_title') ||
                            'No recurring transactions'}
                    </Text>
                    <Text
                        style={[
                            styles.emptyDesc,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        {t('recurring.empty_desc') ||
                            'Add your first one to start automating'}
                    </Text>
                </View>
            ) : (
                <View style={styles.cardsStack}>
                    {recurring.map((item) => {
                        const badgeColor = resolveColorHex(
                            item.category?.color,
                            colors.primary
                        );
                        const nextRunDate = item.next_run_date
                            ? new Date(item.next_run_date)
                            : null;
                        const nextRunLabel =
                            nextRunDate && isValid(nextRunDate)
                                ? format(nextRunDate, 'dd MMM', {
                                      locale: dateLocale,
                                  })
                                : '-';
                        const isIncome = item.type === 'income';

                        return (
                            <React.Fragment key={item.id}>
                                <View
                                    style={[
                                        styles.card,
                                        {
                                            backgroundColor: colors.card,
                                            borderColor: hexWithOpacity(
                                                colors.border,
                                                0.7
                                            ),
                                        },
                                    ]}
                                >
                                    <AmbientGlow
                                        color={badgeColor}
                                        opacity={0.12}
                                        size={160}
                                        style={{ top: -50, left: -50 }}
                                    />
                                    <Pressable
                                        onPress={() => handleDelete(item.id)}
                                        style={({ pressed }) => [
                                            styles.deleteBtn,
                                            pressed && {
                                                backgroundColor: colors.redSoft,
                                            },
                                        ]}
                                        hitSlop={8}
                                        accessibilityLabel="Delete recurring transaction"
                                    >
                                        <Trash2 size={18} color={colors.red} />
                                    </Pressable>

                                    <View
                                        style={[
                                            styles.iconBadge,
                                            {
                                                backgroundColor: badgeColor,
                                                borderColor: colors.whiteBorder,
                                                shadowColor: badgeColor,
                                            },
                                        ]}
                                    >
                                        <LinearGradient
                                            colors={[
                                                'rgba(255,255,255,0.28)',
                                                'rgba(255,255,255,0)',
                                            ]}
                                            start={{ x: 0, y: 1 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.badgeGloss}
                                        />
                                    <Repeat
                                        size={28}
                                        color="#FFFFFF"
                                        strokeWidth={2.5}
                                    />
                                </View>

                                <View style={styles.metaBlock}>
                                    <Text
                                        style={[
                                            styles.itemTitle,
                                            { color: colors.foreground },
                                        ]}
                                    >
                                        {item.description}
                                    </Text>
                                    <View style={styles.badgesRow}>
                                        <View style={styles.metaTag}>
                                            <Calendar
                                                size={11}
                                                color={hexWithOpacity(
                                                    colors.mutedForeground,
                                                    0.7
                                                )}
                                                strokeWidth={2.5}
                                            />
                                            <Text
                                                style={[
                                                    styles.metaTagText,
                                                    {
                                                        color: hexWithOpacity(
                                                            colors.mutedForeground,
                                                            0.7
                                                        ),
                                                    },
                                                ]}
                                            >
                                                {item.interval}
                                            </Text>
                                        </View>

                                        {item.account?.name ? (
                                            <View style={styles.metaTag}>
                                                <Wallet
                                                    size={11}
                                                    color={hexWithOpacity(
                                                        colors.mutedForeground,
                                                        0.7
                                                    )}
                                                    strokeWidth={2.5}
                                                />
                                                <Text
                                                    style={[
                                                        styles.metaTagText,
                                                        {
                                                            color: hexWithOpacity(
                                                                colors.mutedForeground,
                                                                0.7
                                                            ),
                                                        },
                                                    ]}
                                                >
                                                    {item.account.name}
                                                </Text>
                                            </View>
                                        ) : null}
                                    </View>
                                </View>

                                <View style={styles.amountBlock}>
                                    <Text
                                        style={[
                                            styles.amountText,
                                            {
                                                color: isIncome
                                                    ? colors.emerald
                                                    : colors.foreground,
                                            },
                                        ]}
                                    >
                                        {formatCurrency(
                                            item.amount,
                                            item.account?.currency || 'USD',
                                            i18n.language
                                        )}
                                        {isIncome ? ' +' : ' -'}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.nextRunText,
                                            {
                                                color: hexWithOpacity(
                                                    colors.mutedForeground,
                                                    0.6
                                                ),
                                            },
                                        ]}
                                    >
                                        Next: {nextRunLabel}
                                    </Text>
                                </View>
                                </View>
                            </React.Fragment>
                        );
                    })}
                </View>
            )}

            <AddRecurringModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
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
        gap: 28,
        maxWidth: 480,
        width: '100%',
        alignSelf: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 8,
        gap: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flex: 1,
    },
    backBtn: {
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    headerTitles: {
        flex: 1,
    },
    pageTitle: {
        fontSize: 26,
        fontFamily: FONT_FAMILY.bold,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 13,
        fontFamily: FONT_FAMILY.medium,
        marginTop: 2,
    },
    addBtn: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    loaderWrap: {
        paddingVertical: 48,
        alignItems: 'center',
    },
    emptyCard: {
        borderRadius: 40,
        borderWidth: 1,
        borderStyle: 'dashed',
        padding: 44,
        alignItems: 'center',
        gap: 14,
    },
    emptyIconBox: {
        width: 64,
        height: 64,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: FONT_FAMILY.bold,
        textAlign: 'center',
    },
    emptyDesc: {
        fontSize: 14,
        textAlign: 'center',
        maxWidth: 220,
    },
    cardsStack: {
        gap: 16,
    },
    card: {
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 32,
        borderWidth: 1,
        padding: 24,
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 16,
        elevation: 4,
    },
    deleteBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 8,
        borderRadius: 12,
        zIndex: 10,
    },
    iconBadge: {
        width: 64,
        height: 64,
        borderRadius: 22,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 12,
        elevation: 6,
    },
    badgeGloss: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    metaBlock: {
        alignItems: 'center',
        gap: 6,
    },
    itemTitle: {
        fontSize: 18,
        fontFamily: FONT_FAMILY.bold,
        textAlign: 'center',
    },
    badgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    metaTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaTagText: {
        fontSize: 11,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.4,
    },
    amountBlock: {
        alignItems: 'center',
        gap: 4,
    },
    amountText: {
        fontSize: 22,
        fontFamily: FONT_FAMILY.bold,
        letterSpacing: -0.5,
    },
    nextRunText: {
        fontSize: 11,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.4,
    },
});
