import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    Image,
    Switch,
    StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
    Moon,
    Sun,
    User as UserIcon,
    Bell,
    Shield,
    ChevronRight,
    LogOut,
    Globe,
    Repeat,
    Target,
    type LucideIcon,
} from 'lucide-react-native';

import api from '@/lib/axios';
import { clearSessionTokens } from '@/lib/token-storage';
import { queryClient } from '@/lib/query-client';
import { setAppLanguage } from '@/i18n';
import { useAuthStore } from '@/store/auth-store';
import { useThemeStore } from '@/store/theme-store';
import { useUpdateProfile } from '@/hooks/use-api';
import { PremiumSelect } from '@/components/ui/PremiumSelect';
import { FONT_FAMILY, hexWithOpacity } from '@/constants/theme';
import type { User } from '@/types';

interface SettingsItem {
    icon: LucideIcon;
    label: string;
    value?: string;
    action?: React.ReactNode;
    onPress?: () => void;
    color: string;
}

interface SettingsSection {
    title: string;
    items: SettingsItem[];
}

export default function SettingsScreen() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme, toggleTheme, colors } = useThemeStore();

    const user = useAuthStore((state) => state.user);
    const setAuth = useAuthStore((state) => state.setAuth);
    const logoutStore = useAuthStore((state) => state.logout);
    const updateProfile = useUpdateProfile();
    const [avatarFailed, setAvatarFailed] = useState(false);

    const handleLanguageChange = (lng: string) => {
        setAppLanguage(lng);
    };

    const handleCurrencyChange = (currency: string) => {
        updateProfile.mutate(
            { currency },
            {
                onSuccess: (response: { data: User }) => {
                    setAuth(response.data);
                    queryClient.invalidateQueries({ queryKey: ['transactions'] });
                    queryClient.invalidateQueries({ queryKey: ['recap'] });
                },
            }
        );
    };

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // Proceed with local sign-out even if server is unreachable
        }
        await clearSessionTokens();
        queryClient.clear();
        logoutStore();
        router.replace('/(auth)/login');
    };

    const sections: SettingsSection[] = [
        {
            title: t('settings.tools', 'Tools'),
            items: [
                {
                    icon: Repeat,
                    label: t('nav.recurring') || 'Recurring Transactions',
                    color: '#F97316',
                    onPress: () => router.push('/recurring'),
                },
                {
                    icon: Target,
                    label: t('nav.goals') || 'Goals',
                    color: '#EC4899',
                    onPress: () => router.push('/goals'),
                },
            ],
        },
        {
            title: t('settings.app_settings'),
            items: [
                {
                    icon: theme === 'light' ? Moon : Sun,
                    label: t('settings.dark_mode'),
                    color: '#6366F1',
                    action: (
                        <Switch
                            value={theme === 'dark'}
                            onValueChange={toggleTheme}
                            trackColor={{
                                false: colors.muted,
                                true: '#4F46E5',
                            }}
                            thumbColor="#FFFFFF"
                        />
                    ),
                },
                {
                    icon: Globe,
                    label: t('settings.language'),
                    color: '#3B82F6',
                    action: (
                        <View style={styles.selectBox}>
                            <PremiumSelect
                                value={i18n.language.split('-')[0]}
                                onChange={handleLanguageChange}
                                options={[
                                    { label: 'English', value: 'en' },
                                    { label: 'Français', value: 'fr' },
                                ]}
                            />
                        </View>
                    ),
                },
                {
                    icon: Globe,
                    label: t('settings.currency'),
                    color: '#10B981',
                    action: (
                        <View style={styles.selectBox}>
                            <PremiumSelect
                                value={user?.currency || 'USD'}
                                onChange={handleCurrencyChange}
                                options={[
                                    { label: 'USD ($)', value: 'USD' },
                                    { label: 'EUR (€)', value: 'EUR' },
                                    { label: 'MAD (DH)', value: 'MAD' },
                                    { label: 'GBP (£)', value: 'GBP' },
                                    { label: 'CAD ($)', value: 'CAD' },
                                    { label: 'AUD ($)', value: 'AUD' },
                                    { label: 'JPY (¥)', value: 'JPY' },
                                    { label: 'CHF (Fr)', value: 'CHF' },
                                    { label: 'CNY (¥)', value: 'CNY' },
                                    { label: 'SEK (kr)', value: 'SEK' },
                                    { label: 'NZD ($)', value: 'NZD' },
                                ]}
                            />
                        </View>
                    ),
                },
                {
                    icon: Bell,
                    label: t('settings.notifications'),
                    value: t('settings.on'),
                    color: '#F87171',
                },
            ],
        },
        {
            title: t('settings.account'),
            items: [
                {
                    icon: UserIcon,
                    label: t('settings.profile_info'),
                    color: '#9CA3AF',
                    onPress: () => router.push('/settings/profile'),
                },
                {
                    icon: Shield,
                    label: t('settings.security_privacy'),
                    color: '#F59E0B',
                    onPress: () => router.push('/settings/security'),
                },
            ],
        },
    ];

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user?.username || 'User'
    )}&background=random&size=160&bold=true`;
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
            <View style={styles.header}>
                <Text style={[styles.pageTitle, { color: colors.foreground }]}>
                    {t('settings.title')}
                </Text>
            </View>

            {/* Profile Card */}
            <View
                style={[
                    styles.profileCard,
                    {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                    },
                ]}
            >
                <View
                    pointerEvents="none"
                    style={[
                        styles.profileGlowTop,
                        { backgroundColor: hexWithOpacity(colors.primary, 0.08) },
                    ]}
                />
                <View
                    pointerEvents="none"
                    style={[
                        styles.profileGlowBottom,
                        { backgroundColor: hexWithOpacity(colors.primary, 0.06) },
                    ]}
                />

                <View style={styles.profileInner}>
                    <View style={styles.avatarWrapper}>
                        <View
                            style={[
                                styles.avatarFrame,
                                {
                                    borderColor: colors.background,
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
                        <View
                            style={[
                                styles.onlineDot,
                                {
                                    backgroundColor: colors.emerald,
                                    borderColor: colors.card,
                                },
                            ]}
                        />
                    </View>

                    <View style={styles.profileInfo}>
                        <Text
                            style={[
                                styles.profileName,
                                { color: colors.foreground },
                            ]}
                            numberOfLines={1}
                        >
                            {user?.username || 'User'}
                        </Text>
                        <Text
                            style={[
                                styles.profileEmail,
                                { color: colors.mutedForeground },
                            ]}
                            numberOfLines={1}
                        >
                            {user?.email}
                        </Text>
                        <View style={styles.memberBadge}>
                            <Text style={styles.memberBadgeText}>
                                {t('settings.member')}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Sections */}
            <View style={styles.sectionsStack}>
                {sections.map((section, idx) => (
                    <View key={idx} style={styles.section}>
                        <Text
                            style={[
                                styles.sectionTitle,
                                {
                                    color: hexWithOpacity(
                                        colors.mutedForeground,
                                        0.7
                                    ),
                                },
                            ]}
                        >
                            {section.title}
                        </Text>
                        <View
                            style={[
                                styles.sectionCard,
                                {
                                    backgroundColor: hexWithOpacity(
                                        colors.card,
                                        0.75
                                    ),
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            {section.items.map((item, itemIdx) => {
                                const Icon = item.icon;
                                const content = (
                                    <View
                                        style={[
                                            styles.itemRow,
                                            itemIdx > 0 && {
                                                borderTopWidth: 1,
                                                borderTopColor: hexWithOpacity(
                                                    colors.border,
                                                    0.45
                                                ),
                                            },
                                        ]}
                                    >
                                        <View style={styles.itemLeft}>
                                            <View
                                                style={[
                                                    styles.itemIconWrap,
                                                    {
                                                        backgroundColor:
                                                            item.color,
                                                    },
                                                ]}
                                            >
                                                <Icon
                                                    size={20}
                                                    color="#FFFFFF"
                                                />
                                            </View>
                                            <Text
                                                style={[
                                                    styles.itemLabel,
                                                    { color: colors.foreground },
                                                ]}
                                            >
                                                {item.label}
                                            </Text>
                                        </View>

                                        <View style={styles.itemRight}>
                                            {item.value ? (
                                                <Text
                                                    style={[
                                                        styles.itemValue,
                                                        {
                                                            color: colors.mutedForeground,
                                                        },
                                                    ]}
                                                >
                                                    {item.value}
                                                </Text>
                                            ) : null}
                                            {item.action ? (
                                                item.action
                                            ) : (
                                                <ChevronRight
                                                    size={18}
                                                    color={hexWithOpacity(
                                                        colors.mutedForeground,
                                                        0.5
                                                    )}
                                                />
                                            )}
                                        </View>
                                    </View>
                                );

                                if (item.onPress) {
                                    return (
                                        <Pressable
                                            key={itemIdx}
                                            onPress={item.onPress}
                                            style={({ pressed }) =>
                                                pressed && {
                                                    backgroundColor:
                                                        hexWithOpacity(
                                                            colors.muted,
                                                            0.5
                                                        ),
                                                }
                                            }
                                        >
                                            {content}
                                        </Pressable>
                                    );
                                }

                                return <View key={itemIdx}>{content}</View>;
                            })}
                        </View>
                    </View>
                ))}
            </View>

            {/* Logout Button */}
            <Pressable
                onPress={handleLogout}
                style={({ pressed }) => [
                    styles.logoutBtn,
                    {
                        backgroundColor: pressed
                            ? colors.red
                            : hexWithOpacity(colors.red, 0.08),
                        borderColor: hexWithOpacity(colors.red, 0.2),
                    },
                ]}
            >
                {({ pressed }) => (
                    <>
                        <LogOut
                            size={22}
                            color={pressed ? '#FFFFFF' : colors.red}
                        />
                        <Text
                            style={[
                                styles.logoutText,
                                { color: pressed ? '#FFFFFF' : colors.red },
                            ]}
                        >
                            {t('settings.logout')}
                        </Text>
                    </>
                )}
            </Pressable>

            <View style={styles.versionWrap}>
                <Text
                    style={[
                        styles.versionText,
                        { color: hexWithOpacity(colors.mutedForeground, 0.5) },
                    ]}
                >
                    {t('app.version')}
                </Text>
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
        paddingTop: 8,
        paddingHorizontal: 4,
    },
    pageTitle: {
        fontSize: 30,
        fontFamily: FONT_FAMILY.bold,
        letterSpacing: -0.5,
    },
    profileCard: {
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 40,
        borderWidth: 1,
        padding: 32,
    },
    profileGlowTop: {
        position: 'absolute',
        top: -96,
        right: -96,
        width: 240,
        height: 240,
        borderRadius: 120,
    },
    profileGlowBottom: {
        position: 'absolute',
        bottom: -96,
        left: -96,
        width: 240,
        height: 240,
        borderRadius: 120,
    },
    profileInner: {
        alignItems: 'center',
        gap: 16,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatarFrame: {
        width: 80,
        height: 80,
        borderRadius: 32,
        borderWidth: 2,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: '3deg' }],
    },
    avatarImg: {
        width: '100%',
        height: '100%',
    },
    avatarFallbackText: {
        fontSize: 24,
        fontFamily: FONT_FAMILY.bold,
        color: '#FFFFFF',
    },
    onlineDot: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 4,
    },
    profileInfo: {
        alignItems: 'center',
        gap: 4,
        width: '100%',
    },
    profileName: {
        fontSize: 24,
        fontFamily: FONT_FAMILY.bold,
        letterSpacing: -0.4,
    },
    profileEmail: {
        fontSize: 14,
        fontFamily: FONT_FAMILY.medium,
    },
    memberBadge: {
        marginTop: 6,
        backgroundColor: '#4ADE80',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 999,
    },
    memberBadgeText: {
        fontSize: 10,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        color: '#052E16',
    },
    sectionsStack: {
        gap: 28,
    },
    section: {
        gap: 14,
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 2.4,
        paddingHorizontal: 8,
    },
    sectionCard: {
        borderRadius: 32,
        borderWidth: 1,
        overflow: 'hidden',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        gap: 10,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flex: 1,
    },
    itemIconWrap: {
        padding: 10,
        borderRadius: 12,
    },
    itemLabel: {
        fontSize: 14,
        fontFamily: FONT_FAMILY.bold,
        flexShrink: 1,
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    itemValue: {
        fontSize: 14,
        fontFamily: FONT_FAMILY.semibold,
    },
    selectBox: {
        minWidth: 120,
    },
    logoutBtn: {
        padding: 16,
        borderRadius: 32,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    logoutText: {
        fontSize: 18,
        fontFamily: FONT_FAMILY.bold,
    },
    versionWrap: {
        alignItems: 'center',
        paddingTop: 4,
        paddingBottom: 16,
    },
    versionText: {
        fontSize: 10,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 3,
    },
});
