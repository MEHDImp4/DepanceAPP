import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    Image,
    StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, AtSign, User as UserIcon, Banknote } from 'lucide-react-native';

import type { User } from '@/types';
import { useAuthStore } from '@/store/auth-store';
import { useThemeStore } from '@/store/theme-store';
import { useUpdateProfile } from '@/hooks/use-api';
import { queryClient } from '@/lib/query-client';
import { PremiumSelect } from '@/components/ui/PremiumSelect';
import { FONT_FAMILY, hexWithOpacity } from '@/constants/theme';

export default function ProfileInfoScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colors = useThemeStore((state) => state.colors);

    const user = useAuthStore((state) => state.user);
    const setAuth = useAuthStore((state) => state.setAuth);
    const updateProfile = useUpdateProfile();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [avatarFailed, setAvatarFailed] = useState(false);

    const handleCurrencyChange = (currency: string) => {
        setIsSubmitting(true);
        updateProfile.mutate(
            { currency },
            {
                onSuccess: (response: { data: User }) => {
                    setAuth(response.data);
                    queryClient.invalidateQueries({ queryKey: ['transactions'] });
                    queryClient.invalidateQueries({ queryKey: ['recap'] });
                    setIsSubmitting(false);
                },
                onError: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user?.username || 'User'
    )}&background=random&size=200&bold=true`;
    const initials = (user?.username || 'U').slice(0, 2).toUpperCase();

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
                styles.content,
                { paddingBottom: Math.max(insets.bottom, 16) + 128 },
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
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                        },
                    ]}
                    accessibilityLabel="Go back"
                >
                    <ArrowLeft size={20} color={colors.foreground} />
                </Pressable>
                <Text style={[styles.pageTitle, { color: colors.foreground }]}>
                    {t('settings.profile_info') || 'Profile Information'}
                </Text>
            </View>

            {/* Avatar Section */}
            <View style={styles.avatarSection}>
                <View
                    style={[
                        styles.avatarFrame,
                        {
                            borderColor: colors.card,
                            backgroundColor: colors.primary,
                        },
                    ]}
                >
                    {!avatarFailed ? (
                        <Image
                            source={{ uri: avatarUrl }}
                            style={styles.avatarImg}
                            onError={() => setAvatarFailed(true)}
                        />
                    ) : (
                        <Text style={styles.avatarFallbackText}>
                            {initials}
                        </Text>
                    )}
                </View>

                <View style={styles.avatarMeta}>
                    <Text
                        style={[
                            styles.usernameHero,
                            { color: colors.foreground },
                        ]}
                    >
                        {user?.username}
                    </Text>
                    <Text
                        style={[
                            styles.emailHero,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        {user?.email}
                    </Text>
                </View>
            </View>

            {/* Info Card */}
            <View
                style={[
                    styles.card,
                    {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                    },
                ]}
            >
                {/* Username (Read Only) */}
                <View style={styles.field}>
                    <Text
                        style={[
                            styles.fieldLabel,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        {t('auth.username') || 'Username'}
                    </Text>
                    <View
                        style={[
                            styles.readOnlyRow,
                            {
                                backgroundColor: hexWithOpacity(
                                    colors.muted,
                                    0.45
                                ),
                                borderColor: hexWithOpacity(colors.border, 0.7),
                            },
                        ]}
                    >
                        <View
                            style={[
                                styles.iconBox,
                                {
                                    backgroundColor: hexWithOpacity(
                                        '#3B82F6',
                                        0.12
                                    ),
                                },
                            ]}
                        >
                            <UserIcon size={20} color="#3B82F6" />
                        </View>
                        <Text
                            style={[
                                styles.readOnlyValue,
                                { color: colors.foreground },
                            ]}
                        >
                            {user?.username}
                        </Text>
                        <View
                            style={[
                                styles.readOnlyBadge,
                                { backgroundColor: colors.muted },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.readOnlyBadgeText,
                                    { color: colors.mutedForeground },
                                ]}
                            >
                                Read Only
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Email (Read Only) */}
                <View style={styles.field}>
                    <Text
                        style={[
                            styles.fieldLabel,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        {t('auth.email') || 'Email'}
                    </Text>
                    <View
                        style={[
                            styles.readOnlyRow,
                            {
                                backgroundColor: hexWithOpacity(
                                    colors.muted,
                                    0.45
                                ),
                                borderColor: hexWithOpacity(colors.border, 0.7),
                            },
                        ]}
                    >
                        <View
                            style={[
                                styles.iconBox,
                                {
                                    backgroundColor: hexWithOpacity(
                                        '#14B8A6',
                                        0.12
                                    ),
                                },
                            ]}
                        >
                            <AtSign size={20} color="#14B8A6" />
                        </View>
                        <Text
                            style={[
                                styles.readOnlyValue,
                                { color: colors.foreground },
                            ]}
                            numberOfLines={1}
                        >
                            {user?.email}
                        </Text>
                        <View
                            style={[
                                styles.readOnlyBadge,
                                { backgroundColor: colors.muted },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.readOnlyBadgeText,
                                    { color: colors.mutedForeground },
                                ]}
                            >
                                Read Only
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Currency (Editable) */}
                <View style={styles.field}>
                    <Text
                        style={[
                            styles.fieldLabel,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        {t('settings.currency') || 'Currency'}
                    </Text>
                    <View
                        style={[
                            styles.currencyRow,
                            {
                                backgroundColor: isSubmitting
                                    ? hexWithOpacity(colors.muted, 0.5)
                                    : colors.card,
                                borderColor: colors.border,
                                opacity: isSubmitting ? 0.7 : 1,
                            },
                        ]}
                    >
                        <View
                            style={[
                                styles.iconBox,
                                { backgroundColor: colors.emeraldSoft },
                            ]}
                        >
                            <Banknote size={20} color={colors.emerald} />
                        </View>
                        <View style={styles.selectWrap}>
                            <PremiumSelect
                                value={user?.currency || 'USD'}
                                onChange={handleCurrencyChange}
                                options={[
                                    {
                                        label: 'USD - US Dollar',
                                        value: 'USD',
                                    },
                                    { label: 'EUR - Euro', value: 'EUR' },
                                    {
                                        label: 'MAD - Moroccan Dirham',
                                        value: 'MAD',
                                    },
                                    {
                                        label: 'GBP - British Pound',
                                        value: 'GBP',
                                    },
                                    {
                                        label: 'CAD - Canadian Dollar',
                                        value: 'CAD',
                                    },
                                    {
                                        label: 'AUD - Australian Dollar',
                                        value: 'AUD',
                                    },
                                    {
                                        label: 'JPY - Japanese Yen',
                                        value: 'JPY',
                                    },
                                    {
                                        label: 'CHF - Swiss Franc',
                                        value: 'CHF',
                                    },
                                    {
                                        label: 'CNY - Chinese Yuan',
                                        value: 'CNY',
                                    },
                                    {
                                        label: 'SEK - Swedish Krona',
                                        value: 'SEK',
                                    },
                                    {
                                        label: 'NZD - New Zealand Dollar',
                                        value: 'NZD',
                                    },
                                ]}
                            />
                        </View>
                    </View>
                    <Text
                        style={[
                            styles.helperText,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        {t('settings.currency_helper') ||
                            'This will update how values are displayed across the app.'}
                    </Text>
                </View>
            </View>
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
        maxWidth: 512,
        width: '100%',
        alignSelf: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingTop: 8,
    },
    backBtn: {
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    pageTitle: {
        fontSize: 24,
        fontFamily: FONT_FAMILY.bold,
        letterSpacing: -0.4,
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 16,
        gap: 16,
    },
    avatarFrame: {
        width: 128,
        height: 128,
        borderRadius: 40,
        borderWidth: 4,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
    },
    avatarFallbackText: {
        fontSize: 36,
        fontFamily: FONT_FAMILY.bold,
        color: '#FFFFFF',
    },
    avatarMeta: {
        alignItems: 'center',
        gap: 4,
    },
    usernameHero: {
        fontSize: 24,
        fontFamily: FONT_FAMILY.bold,
    },
    emailHero: {
        fontSize: 15,
        fontFamily: FONT_FAMILY.medium,
    },
    card: {
        borderRadius: 32,
        borderWidth: 1,
        padding: 24,
        gap: 24,
    },
    field: {
        gap: 8,
    },
    fieldLabel: {
        fontSize: 12,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginLeft: 4,
    },
    readOnlyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    iconBox: {
        padding: 8,
        borderRadius: 10,
    },
    readOnlyValue: {
        flex: 1,
        fontSize: 15,
        fontFamily: FONT_FAMILY.bold,
    },
    readOnlyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    readOnlyBadgeText: {
        fontSize: 10,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    currencyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
    },
    selectWrap: {
        flex: 1,
    },
    helperText: {
        fontSize: 11,
        marginLeft: 8,
    },
});
