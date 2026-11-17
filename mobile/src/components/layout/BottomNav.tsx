import React, { useState } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {
    LayoutDashboard,
    ArrowRightLeft,
    Wallet,
    LayoutGrid,
    Menu,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/store/theme-store';
import { FONT_FAMILY, hexWithOpacity } from '@/constants/theme';
import { MoreMenuDrawer } from './MoreMenuDrawer';

export function BottomNav() {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const { theme, colors } = useThemeStore();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const showLabels = width >= 380;

    const navItems = [
        { icon: LayoutDashboard, label: t('nav.home'), path: '/' as const },
        { icon: ArrowRightLeft, label: t('nav.transact'), path: '/transactions' as const },
        { icon: Wallet, label: t('nav.accounts'), path: '/accounts' as const },
        { icon: LayoutGrid, label: t('nav.templates'), path: '/templates' as const },
    ];

    const isMoreActive =
        pathname.startsWith('/settings') ||
        pathname.startsWith('/goals') ||
        pathname.startsWith('/recurring');

    const isPathActive = (path: string) => {
        if (path === '/') {
            return pathname === '/' || pathname === '/index';
        }
        return pathname === path || pathname.startsWith(`${path}/`);
    };

    return (
        <>
            <View
                pointerEvents="box-none"
                style={[
                    styles.container,
                    {
                        bottom: Math.max(insets.bottom, 12) + 8,
                    },
                ]}
            >
                <View
                    style={[
                        styles.navOuter,
                        {
                            borderColor:
                                theme === 'dark'
                                    ? 'rgba(255, 255, 255, 0.12)'
                                    : 'rgba(24, 24, 27, 0.09)',
                            backgroundColor:
                                Platform.OS === 'android'
                                    ? hexWithOpacity(colors.card, 0.92)
                                    : 'transparent',
                        },
                    ]}
                >
                    <BlurView
                        intensity={75}
                        tint={theme === 'dark' ? 'dark' : 'light'}
                        style={styles.blurFill}
                    >
                        <View
                            style={[
                                styles.navInner,
                                {
                                    backgroundColor:
                                        theme === 'dark'
                                            ? 'rgba(24, 24, 27, 0.55)'
                                            : 'rgba(255, 255, 255, 0.72)',
                                },
                            ]}
                        >
                            {navItems.map(({ icon: Icon, label, path }) => {
                                const isActive = isPathActive(path);
                                return (
                                    <Pressable
                                        key={path}
                                        onPress={() => router.replace(path)}
                                        style={({ pressed }) => [
                                            styles.tabButton,
                                            isActive && {
                                                backgroundColor: hexWithOpacity(
                                                    colors.primary,
                                                    0.15
                                                ),
                                            },
                                            pressed && {
                                                transform: [{ scale: 0.94 }],
                                                opacity: isActive ? 1 : 0.75,
                                            },
                                        ]}
                                        accessibilityRole="tab"
                                        accessibilityState={{ selected: isActive }}
                                        accessibilityLabel={label}
                                    >
                                        <View
                                            style={[
                                                styles.iconContainer,
                                                isActive && {
                                                    transform: [{ scale: 1.08 }],
                                                },
                                            ]}
                                        >
                                            <Icon
                                                size={21}
                                                color={
                                                    isActive
                                                        ? colors.primary
                                                        : colors.mutedForeground
                                                }
                                                strokeWidth={isActive ? 2.5 : 2}
                                            />
                                        </View>
                                        {showLabels ? (
                                            <Text
                                                style={[
                                                    styles.label,
                                                    {
                                                        color: isActive
                                                            ? colors.primary
                                                            : colors.mutedForeground,
                                                    },
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {label}
                                            </Text>
                                        ) : null}
                                    </Pressable>
                                );
                            })}

                            <Pressable
                                onPress={() => setDrawerOpen(true)}
                                style={({ pressed }) => [
                                    styles.tabButton,
                                    isMoreActive && {
                                        backgroundColor: hexWithOpacity(
                                            colors.primary,
                                            0.15
                                        ),
                                    },
                                    pressed && {
                                        transform: [{ scale: 0.94 }],
                                        opacity: isMoreActive ? 1 : 0.75,
                                    },
                                ]}
                                accessibilityRole="button"
                                accessibilityLabel={t('nav.more', 'More')}
                            >
                                <View
                                    style={[
                                        styles.iconContainer,
                                        isMoreActive && {
                                            transform: [{ scale: 1.08 }],
                                        },
                                    ]}
                                >
                                    <Menu
                                        size={21}
                                        color={
                                            isMoreActive
                                                ? colors.primary
                                                : colors.mutedForeground
                                        }
                                        strokeWidth={isMoreActive ? 2.5 : 2}
                                    />
                                </View>
                                {showLabels ? (
                                    <Text
                                        style={[
                                            styles.label,
                                            {
                                                color: isMoreActive
                                                    ? colors.primary
                                                    : colors.mutedForeground,
                                            },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {t('nav.more', 'More')}
                                    </Text>
                                ) : null}
                            </Pressable>
                        </View>
                    </BlurView>
                </View>
            </View>

            <MoreMenuDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        alignItems: 'center',
        zIndex: 50,
    },
    navOuter: {
        width: '100%',
        maxWidth: 448,
        borderRadius: 40,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.42,
        shadowRadius: 24,
        elevation: 16,
    },
    blurFill: {
        width: '100%',
    },
    navInner: {
        padding: 7,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 2,
        borderRadius: 24,
    },
    iconContainer: {
        padding: 3,
        borderRadius: 14,
    },
    label: {
        fontSize: 9.5,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.1,
        marginTop: 2,
    },
});
