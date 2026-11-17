import React from 'react';
import {
    Modal,
    View,
    Text,
    Pressable,
    StyleSheet,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Target, Repeat, Settings, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/store/theme-store';
import { FONT_FAMILY, hexWithOpacity } from '@/constants/theme';

interface MoreMenuDrawerProps {
    open: boolean;
    onClose: () => void;
}

export function MoreMenuDrawer({ open, onClose }: MoreMenuDrawerProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const { theme, colors } = useThemeStore();

    const menuItems = [
        {
            icon: Settings,
            label: t('nav.settings'),
            path: '/settings' as const,
            matchPrefix: '/settings',
            color: colors.slate,
            bg: colors.slateSoft,
        },
        {
            icon: Target,
            label: t('nav.goals', 'Goals'),
            path: '/goals' as const,
            matchPrefix: '/goals',
            color: colors.pink,
            bg: colors.pinkSoft,
        },
        {
            icon: Repeat,
            label: t('nav.recurring', 'Recurring'),
            path: '/recurring' as const,
            matchPrefix: '/recurring',
            color: colors.orange,
            bg: colors.orangeSoft,
        },
    ];

    const handleNavigate = (path: '/settings' | '/goals' | '/recurring') => {
        onClose();
        router.push(path);
    };

    return (
        <Modal
            visible={open}
            transparent
            animationType="slide"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.root}>
                <Pressable
                    style={styles.backdrop}
                    onPress={onClose}
                    accessibilityLabel="Close menu"
                >
                    <BlurView
                        intensity={25}
                        tint={theme === 'dark' ? 'dark' : 'light'}
                        style={[
                            styles.backdropBlur,
                            { backgroundColor: 'rgba(0, 0, 0, 0.68)' },
                        ]}
                    />
                </Pressable>

                <View
                    style={[
                        styles.sheet,
                        {
                            backgroundColor: colors.card,
                            borderTopColor:
                                theme === 'dark'
                                    ? 'rgba(255, 255, 255, 0.12)'
                                    : colors.border,
                            paddingBottom: Math.max(insets.bottom, 24) + 18,
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.handle,
                            {
                                backgroundColor: hexWithOpacity(
                                    colors.mutedForeground,
                                    0.35
                                ),
                            },
                        ]}
                    />
                    <Text style={[styles.title, { color: colors.foreground }]}>
                        {t('nav.more_options', 'More Options')}
                    </Text>

                    <View style={styles.list}>
                        {menuItems.map(
                            ({
                                icon: Icon,
                                label,
                                path,
                                matchPrefix,
                                color,
                                bg,
                            }) => {
                                const isActive =
                                    pathname.startsWith(matchPrefix);
                                return (
                                    <Pressable
                                        key={path}
                                        onPress={() => handleNavigate(path)}
                                        style={({ pressed }) => [
                                            styles.itemRow,
                                            {
                                                backgroundColor: isActive
                                                    ? hexWithOpacity(
                                                          colors.primary,
                                                          0.12
                                                      )
                                                    : pressed
                                                    ? hexWithOpacity(
                                                          colors.muted,
                                                          0.8
                                                      )
                                                    : hexWithOpacity(
                                                          colors.muted,
                                                          0.4
                                                      ),
                                                borderColor: isActive
                                                    ? hexWithOpacity(
                                                          colors.primary,
                                                          0.3
                                                      )
                                                    : colors.whiteBorder,
                                                transform: [
                                                    {
                                                        scale: pressed
                                                            ? 0.97
                                                            : 1,
                                                    },
                                                ],
                                            },
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.iconWrap,
                                                {
                                                    backgroundColor: isActive
                                                        ? colors.primary
                                                        : bg,
                                                },
                                            ]}
                                        >
                                            <Icon
                                                size={22}
                                                color={
                                                    isActive
                                                        ? colors.primaryForeground
                                                        : color
                                                }
                                            />
                                        </View>
                                        <Text
                                            style={[
                                                styles.itemLabel,
                                                {
                                                    color: isActive
                                                        ? colors.primary
                                                        : colors.foreground,
                                                },
                                            ]}
                                        >
                                            {label}
                                        </Text>
                                        <ChevronRight
                                            size={20}
                                            color={hexWithOpacity(
                                                colors.mutedForeground,
                                                0.5
                                            )}
                                        />
                                    </Pressable>
                                );
                            }
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    backdropBlur: {
        flex: 1,
    },
    sheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderTopWidth: 1,
        paddingHorizontal: 20,
        paddingTop: 14,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 20,
    },
    handle: {
        width: 84,
        height: 5,
        borderRadius: 3,
        marginBottom: 18,
    },
    title: {
        fontSize: 18,
        fontFamily: FONT_FAMILY.bold,
        marginBottom: 18,
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    list: {
        width: '100%',
        maxWidth: 400,
        gap: 12,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        gap: 16,
    },
    iconWrap: {
        padding: 10,
        borderRadius: 12,
    },
    itemLabel: {
        flex: 1,
        fontSize: 16,
        fontFamily: FONT_FAMILY.bold,
    },
});
