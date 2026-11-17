import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
    Wallet,
    CreditCard,
    Building,
    ChevronRight,
    PiggyBank,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { Account } from '@/types';
import { useThemeStore } from '@/store/theme-store';
import { FONT_FAMILY, hexWithOpacity, resolveColorHex } from '@/constants/theme';
import { formatDecimal } from '@/hooks/use-currency';

interface AccountCardProps {
    account: Account;
    onClick?: (account: Account) => void;
    showTopBorder?: boolean;
}

export function AccountCard({ account, onClick, showTopBorder }: AccountCardProps) {
    const { t, i18n } = useTranslation();
    const colors = useThemeStore((state) => state.colors);

    const Icon =
        account.type === 'bank'
            ? Building
            : account.type === 'credit'
            ? CreditCard
            : account.type === 'savings'
            ? PiggyBank
            : Wallet;

    const badgeColor = resolveColorHex(account.color, colors.primary);

    return (
        <Pressable
            onPress={() => onClick?.(account)}
            style={({ pressed }) => [
                styles.row,
                showTopBorder && {
                    borderTopWidth: 1,
                    borderTopColor: hexWithOpacity(colors.border, 0.5),
                },
                pressed && {
                    backgroundColor: hexWithOpacity(colors.muted, 0.45),
                },
            ]}
        >
            <View style={styles.left}>
                <View
                    style={[
                        styles.iconBadge,
                        { backgroundColor: badgeColor },
                    ]}
                >
                    <Icon size={20} color="#FFFFFF" />
                </View>
                <View style={styles.nameBlock}>
                    <Text
                        style={[styles.name, { color: colors.foreground }]}
                        numberOfLines={1}
                    >
                        {account.name}
                    </Text>
                    <Text
                        style={[
                            styles.type,
                            { color: hexWithOpacity(colors.mutedForeground, 0.7) },
                        ]}
                    >
                        {account.type}
                    </Text>
                </View>
            </View>

            <View style={styles.right}>
                <View style={styles.balanceBlock}>
                    <Text
                        style={[styles.balance, { color: colors.foreground }]}
                        numberOfLines={1}
                    >
                        {formatDecimal(account.balance, i18n.language, 2, 2)}{' '}
                        {account.currency}
                    </Text>
                    <View style={styles.activeRow}>
                        <View
                            style={[
                                styles.activeDot,
                                { backgroundColor: colors.emerald },
                            ]}
                        />
                        <Text
                            style={[
                                styles.activeLabel,
                                { color: hexWithOpacity(colors.mutedForeground, 0.55) },
                            ]}
                        >
                            {t('accounts.active')}
                        </Text>
                    </View>
                </View>
                <ChevronRight
                    size={18}
                    color={hexWithOpacity(colors.mutedForeground, 0.4)}
                />
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        gap: 12,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flex: 1,
        minWidth: 0,
    },
    iconBadge: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    nameBlock: {
        flex: 1,
        minWidth: 0,
    },
    name: {
        fontSize: 15,
        fontFamily: FONT_FAMILY.bold,
    },
    type: {
        fontSize: 12,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginTop: 2,
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
    },
    balanceBlock: {
        alignItems: 'flex-end',
    },
    balance: {
        fontSize: 17,
        fontFamily: FONT_FAMILY.bold,
        letterSpacing: -0.3,
    },
    activeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    activeLabel: {
        fontSize: 11,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
});
