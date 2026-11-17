import React, { useState } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    useWindowDimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    const colors = useThemeStore((state) => state.colors);
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
                        bottom: Math.max(insets.bottom, 12) + 10,
                    },
                ]}
            >
                <View
                    style={[
                        styles.navBar,
                        {
                            backgroundColor: colors.navGlass,
                            borderColor: colors.navBorder,
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
                                        backgroundColor: hexWithOpacity(colors.primary, 0.15),
                                    },
                                    pressed && !isActive && { opacity: 0.7 },
                                ]}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: isActive }}
                                accessibilityLabel={label}
                            >
                                <View
                                    style={[
                                        styles.iconContainer,
                                        isActive && { transform: [{ scale: 1.08 }] },
                                    ]}
                                >
                                    <Icon
                                        size={22}
                                        color={isActive ? colors.primary : colors.mutedForeground}
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
                                backgroundColor: hexWithOpacity(colors.primary, 0.15),
                            },
                            pressed && !isMoreActive && { opacity: 0.7 },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={t('nav.more', 'More')}
                    >
                        <View
                            style={[
                                styles.iconContainer,
                                isMoreActive && { transform: [{ scale: 1.08 }] },
                            ]}
                        >
                            <Menu
                                size={22}
                                color={isMoreActive ? colors.primary : colors.mutedForeground}
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
            </View>

            <MoreMenuDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
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
    navBar: {
        width: '100%',
        maxWidth: 448,
        borderRadius: 40,
        padding: 8,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
        elevation: 16,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 24,
    },
    iconContainer: {
        padding: 4,
        borderRadius: 16,
    },
    label: {
        fontSize: 10,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginTop: 2,
    },
});
