import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/store/theme-store';
import { FONT_FAMILY, hexWithOpacity } from '@/constants/theme';
import { formatDecimal } from '@/hooks/use-currency';

interface CapitalCardProps {
    amount: number;
    currency: string;
}

export function CapitalCard({ amount, currency }: CapitalCardProps) {
    const { t, i18n } = useTranslation();
    const colors = useThemeStore((state) => state.colors);

    const formattedAmount = formatDecimal(amount, i18n.language, 2, 2);
    const length = formattedAmount.length;
    const fontSize = length > 13 ? 24 : length > 10 ? 30 : length > 7 ? 36 : 46;

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                },
            ]}
        >
            {/* Decorative Mesh Gradient Accent */}
            <View
                pointerEvents="none"
                style={[
                    styles.glowCircle,
                    { backgroundColor: hexWithOpacity(colors.primary, 0.08) },
                ]}
            />

            <View style={styles.content}>
                <Text
                    style={[
                        styles.title,
                        { color: colors.mutedForeground },
                    ]}
                >
                    {t('dashboard.total_capital')}
                </Text>

                <View style={styles.amountRow}>
                    <Text
                        style={[
                            styles.amount,
                            {
                                color: colors.foreground,
                                fontSize,
                                lineHeight: fontSize * 1.15,
                            },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {formattedAmount}
                    </Text>
                    <View
                        style={[
                            styles.currencyBadge,
                            { backgroundColor: colors.muted },
                        ]}
                    >
                        <Text
                            style={[
                                styles.currencyText,
                                { color: colors.mutedForeground },
                            ]}
                        >
                            {currency}
                        </Text>
                    </View>
                </View>

                <View style={styles.liveRow}>
                    <View
                        style={[
                            styles.liveDot,
                            {
                                backgroundColor: colors.emerald,
                                shadowColor: colors.emerald,
                            },
                        ]}
                    />
                    <Text
                        style={[
                            styles.liveText,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        {t('dashboard.live_balance')}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        position: 'relative',
        overflow: 'hidden',
        borderWidth: 1,
        borderRadius: 40,
        padding: 32,
    },
    glowCircle: {
        position: 'absolute',
        top: -96,
        right: -96,
        width: 240,
        height: 240,
        borderRadius: 120,
    },
    content: {
        gap: 12,
    },
    title: {
        fontSize: 11,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 3.3,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    amount: {
        fontFamily: FONT_FAMILY.bold,
        letterSpacing: -1,
        flexShrink: 1,
    },
    currencyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    currencyText: {
        fontSize: 13,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.8,
    },
    liveRow: {
        paddingTop: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
        elevation: 3,
    },
    liveText: {
        fontSize: 10,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.6,
    },
});
