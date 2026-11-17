import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    Pressable,
    StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ArrowLeft,
    Lock,
    KeyRound,
    ShieldCheck,
    History,
    Laptop,
    Smartphone,
} from 'lucide-react-native';
import { formatDistanceToNow, isValid } from 'date-fns';
import { isAxiosError } from 'axios';

import { useChangePassword, useLoginHistory } from '@/hooks/use-api';
import { useThemeStore } from '@/store/theme-store';
import { FONT_FAMILY, hexWithOpacity } from '@/constants/theme';
import type { LoginHistoryEntry } from '@/types';

export default function SecurityPrivacyScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colors = useThemeStore((state) => state.colors);

    const changePassword = useChangePassword();
    const { data: loginHistory = [] } = useLoginHistory();

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    const handlePasswordChange = () => {
        setMessage(null);

        if (!oldPassword) {
            setMessage({
                type: 'error',
                text: 'Current password is required',
            });
            return;
        }

        if (newPassword.length < 8) {
            setMessage({
                type: 'error',
                text: t(
                    'auth.password_min_length',
                    'Password must be at least 8 characters long'
                ),
            });
            return;
        }

        changePassword.mutate(
            { oldPassword, newPassword },
            {
                onSuccess: () => {
                    setMessage({
                        type: 'success',
                        text: t(
                            'settings.password_changed',
                            'Password updated successfully'
                        ),
                    });
                    setOldPassword('');
                    setNewPassword('');
                },
                onError: (err: unknown) => {
                    const text = isAxiosError<{ error?: string }>(err)
                        ? err.response?.data?.error
                        : undefined;
                    setMessage({
                        type: 'error',
                        text: text || 'Failed to update password',
                    });
                },
            }
        );
    };

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
                styles.content,
                { paddingBottom: Math.max(insets.bottom, 16) + 128 },
            ]}
            keyboardShouldPersistTaps="handled"
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
                    {t('settings.security_privacy') || 'Security & Privacy'}
                </Text>
            </View>

            {/* Change Password Section */}
            <View style={styles.section}>
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
                    {t('settings.change_password', 'Change Password')}
                </Text>

                <View
                    style={[
                        styles.card,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <View style={styles.form}>
                        <View style={styles.field}>
                            <Text
                                style={[
                                    styles.fieldLabel,
                                    { color: colors.mutedForeground },
                                ]}
                            >
                                {t('auth.current_password', 'Current Password')}
                            </Text>
                            <View
                                style={[
                                    styles.inputGroup,
                                    {
                                        backgroundColor: hexWithOpacity(
                                            colors.muted,
                                            0.45
                                        ),
                                        borderColor: colors.border,
                                    },
                                ]}
                            >
                                <Lock
                                    size={18}
                                    color={hexWithOpacity(
                                        colors.mutedForeground,
                                        0.65
                                    )}
                                />
                                <TextInput
                                    value={oldPassword}
                                    onChangeText={setOldPassword}
                                    placeholder="••••••••"
                                    placeholderTextColor={hexWithOpacity(
                                        colors.mutedForeground,
                                        0.5
                                    )}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    style={[
                                        styles.input,
                                        { color: colors.foreground },
                                    ]}
                                />
                            </View>
                        </View>

                        <View style={styles.field}>
                            <Text
                                style={[
                                    styles.fieldLabel,
                                    { color: colors.mutedForeground },
                                ]}
                            >
                                {t('auth.new_password', 'New Password')}
                            </Text>
                            <View
                                style={[
                                    styles.inputGroup,
                                    {
                                        backgroundColor: hexWithOpacity(
                                            colors.muted,
                                            0.45
                                        ),
                                        borderColor: colors.border,
                                    },
                                ]}
                            >
                                <KeyRound
                                    size={18}
                                    color={hexWithOpacity(
                                        colors.mutedForeground,
                                        0.65
                                    )}
                                />
                                <TextInput
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="••••••••"
                                    placeholderTextColor={hexWithOpacity(
                                        colors.mutedForeground,
                                        0.5
                                    )}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    style={[
                                        styles.input,
                                        { color: colors.foreground },
                                    ]}
                                />
                            </View>
                        </View>

                        {message ? (
                            <View
                                style={[
                                    styles.messageBox,
                                    {
                                        backgroundColor:
                                            message.type === 'success'
                                                ? colors.emeraldSoft
                                                : colors.redSoft,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.messageText,
                                        {
                                            color:
                                                message.type === 'success'
                                                    ? colors.emerald
                                                    : colors.red,
                                        },
                                    ]}
                                >
                                    {message.text}
                                </Text>
                            </View>
                        ) : null}

                        <Pressable
                            onPress={handlePasswordChange}
                            disabled={changePassword.isPending}
                            style={({ pressed }) => [
                                styles.gradientBtnWrap,
                                { opacity: pressed ? 0.9 : 1 },
                            ]}
                        >
                            <LinearGradient
                                colors={
                                    changePassword.isPending
                                        ? [colors.muted, colors.muted]
                                        : ['#F59E0B', '#F97316']
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientBtn}
                            >
                                <Text
                                    style={[
                                        styles.submitText,
                                        {
                                            color: changePassword.isPending
                                                ? colors.mutedForeground
                                                : '#FFFFFF',
                                        },
                                    ]}
                                >
                                    {changePassword.isPending
                                        ? 'Updating...'
                                        : t(
                                              'settings.update_password',
                                              'Update Password'
                                          )}
                                </Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
                </View>
            </View>

            {/* Login History Section */}
            <View style={styles.section}>
                <View style={styles.historyHeader}>
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
                        {t('settings.login_history', 'Login History')}
                    </Text>
                    <ShieldCheck size={14} color={colors.mutedForeground} />
                </View>

                <View
                    style={[
                        styles.historyCard,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                        },
                    ]}
                >
                    {loginHistory.length === 0 ? (
                        <View style={styles.emptyHistory}>
                            <Text
                                style={[
                                    styles.emptyHistoryText,
                                    { color: colors.mutedForeground },
                                ]}
                            >
                                No login history available.
                            </Text>
                        </View>
                    ) : (
                        (loginHistory as LoginHistoryEntry[]).map(
                            (login, idx) => {
                                const isMobile =
                                    login.device?.toLowerCase() === 'mobile';
                                const loginDate = login.createdAt
                                    ? new Date(login.createdAt)
                                    : null;
                                const timeAgo =
                                    loginDate && isValid(loginDate)
                                        ? formatDistanceToNow(loginDate, {
                                              addSuffix: true,
                                          })
                                        : 'Unknown time';

                                const uaText =
                                    login.userAgent &&
                                    login.userAgent.length > 30
                                        ? `${login.userAgent.substring(0, 30)}...`
                                        : login.userAgent || 'Unknown Device';

                                return (
                                    <View
                                        key={login.id}
                                        style={[
                                            styles.historyRow,
                                            idx > 0 && {
                                                borderTopWidth: 1,
                                                borderTopColor: hexWithOpacity(
                                                    colors.border,
                                                    0.45
                                                ),
                                            },
                                        ]}
                                    >
                                        <View style={styles.historyLeft}>
                                            <View
                                                style={[
                                                    styles.deviceIconBox,
                                                    {
                                                        backgroundColor: isMobile
                                                            ? hexWithOpacity(
                                                                  '#3B82F6',
                                                                  0.12
                                                              )
                                                            : colors.slateSoft,
                                                    },
                                                ]}
                                            >
                                                {isMobile ? (
                                                    <Smartphone
                                                        size={18}
                                                        color="#3B82F6"
                                                    />
                                                ) : (
                                                    <Laptop
                                                        size={18}
                                                        color={colors.slate}
                                                    />
                                                )}
                                            </View>
                                            <View style={styles.deviceInfo}>
                                                <Text
                                                    style={[
                                                        styles.ipText,
                                                        {
                                                            color: colors.foreground,
                                                        },
                                                    ]}
                                                >
                                                    {login.ipAddress ||
                                                        'Unknown IP'}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.uaText,
                                                        {
                                                            color: colors.mutedForeground,
                                                        },
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {uaText}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.historyRight}>
                                            <View
                                                style={[
                                                    styles.statusBadge,
                                                    {
                                                        backgroundColor:
                                                            login.success
                                                                ? colors.emeraldSoft
                                                                : colors.redSoft,
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.statusText,
                                                        {
                                                            color: login.success
                                                                ? colors.emerald
                                                                : colors.red,
                                                        },
                                                    ]}
                                                >
                                                    {login.success
                                                        ? 'Success'
                                                        : 'Failed'}
                                                </Text>
                                            </View>
                                            <View style={styles.timeRow}>
                                                <History
                                                    size={10}
                                                    color={
                                                        colors.mutedForeground
                                                    }
                                                />
                                                <Text
                                                    style={[
                                                        styles.timeText,
                                                        {
                                                            color: colors.mutedForeground,
                                                        },
                                                    ]}
                                                >
                                                    {timeAgo}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            }
                        )
                    )}
                </View>

                <Text
                    style={[
                        styles.securityNotice,
                        { color: colors.mutedForeground },
                    ]}
                >
                    {t(
                        'settings.security_notice',
                        'If you see suspicious activity, change your password immediately.'
                    )}
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
    section: {
        gap: 14,
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 2.2,
        paddingHorizontal: 6,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 8,
    },
    card: {
        borderRadius: 32,
        borderWidth: 1,
        padding: 24,
    },
    form: {
        gap: 16,
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
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontFamily: FONT_FAMILY.medium,
        paddingVertical: 0,
    },
    messageBox: {
        padding: 12,
        borderRadius: 12,
    },
    messageText: {
        fontSize: 14,
        fontFamily: FONT_FAMILY.bold,
        textAlign: 'center',
    },
    gradientBtnWrap: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientBtn: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitText: {
        fontSize: 15,
        fontFamily: FONT_FAMILY.bold,
    },
    historyCard: {
        borderRadius: 32,
        borderWidth: 1,
        overflow: 'hidden',
    },
    emptyHistory: {
        padding: 32,
        alignItems: 'center',
    },
    emptyHistoryText: {
        fontSize: 14,
    },
    historyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        gap: 10,
    },
    historyLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        minWidth: 0,
    },
    deviceIconBox: {
        padding: 10,
        borderRadius: 12,
        flexShrink: 0,
    },
    deviceInfo: {
        flex: 1,
        minWidth: 0,
    },
    ipText: {
        fontSize: 14,
        fontFamily: FONT_FAMILY.bold,
    },
    uaText: {
        fontSize: 10,
        fontFamily: FONT_FAMILY.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginTop: 2,
    },
    historyRight: {
        alignItems: 'flex-end',
        flexShrink: 0,
        gap: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeText: {
        fontSize: 10,
        fontFamily: FONT_FAMILY.medium,
    },
    securityNotice: {
        fontSize: 11,
        textAlign: 'center',
        paddingHorizontal: 16,
    },
});
