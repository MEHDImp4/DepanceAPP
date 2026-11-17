import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Lock, Mail, User, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { isAxiosError } from 'axios';

import api from '@/lib/axios';
import { useAuthStore } from '@/store/auth-store';
import { useThemeStore } from '@/store/theme-store';
import { FONT_FAMILY, hexWithOpacity } from '@/constants/theme';
import type { User as UserType } from '@/types';

export default function RegisterScreen() {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const setAuth = useAuthStore((state) => state.setAuth);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const colors = useThemeStore((state) => state.colors);
    const { t } = useTranslation();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/(app)');
        }
    }, [isAuthenticated, router]);

    const handleSubmit = async () => {
        setError('');

        if (!username.trim() || !email.trim() || !password) {
            setError('All fields are required');
            return;
        }

        if (password !== confirmPassword) {
            setError(t('auth.password_mismatch') || 'Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            const { data } = await api.post<{ user: UserType }>(
                '/auth/register',
                {
                    username: username.trim(),
                    email: email.trim(),
                    password,
                }
            );
            setAuth(data.user);
            router.replace('/(app)');
        } catch (err: unknown) {
            const message = isAxiosError<{ error?: string }>(err)
                ? err.response?.data?.error
                : undefined;
            setError(message || 'Failed to register');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView
            style={[styles.safe, { backgroundColor: colors.background }]}
        >
            <View
                pointerEvents="none"
                style={[
                    styles.bgGlow,
                    { backgroundColor: hexWithOpacity(colors.primary, 0.08) },
                ]}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View
                        style={[
                            styles.card,
                            {
                                backgroundColor: hexWithOpacity(colors.card, 0.75),
                                borderColor: colors.whiteBorder,
                            },
                        ]}
                    >
                        <View style={styles.header}>
                            <Text
                                style={[
                                    styles.title,
                                    { color: colors.foreground },
                                ]}
                            >
                                {t('auth.register_title')}
                            </Text>
                            <Text
                                style={[
                                    styles.subtitle,
                                    { color: colors.mutedForeground },
                                ]}
                            >
                                {t('auth.register_subtitle')}
                            </Text>
                        </View>

                        <View style={styles.form}>
                            {error ? (
                                <View
                                    style={[
                                        styles.errorBox,
                                        {
                                            backgroundColor: colors.destructiveSoft,
                                            borderColor: hexWithOpacity(
                                                colors.destructive,
                                                0.25
                                            ),
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.errorText,
                                            { color: colors.destructive },
                                        ]}
                                    >
                                        {error}
                                    </Text>
                                </View>
                            ) : null}

                            <View style={styles.inputsStack}>
                                <View
                                    style={[
                                        styles.inputGroup,
                                        {
                                            backgroundColor: hexWithOpacity(
                                                colors.background,
                                                0.65
                                            ),
                                            borderColor: colors.border,
                                        },
                                    ]}
                                >
                                    <User
                                        size={20}
                                        color={colors.mutedForeground}
                                    />
                                    <TextInput
                                        value={username}
                                        onChangeText={setUsername}
                                        placeholder={t(
                                            'auth.username_placeholder'
                                        )}
                                        placeholderTextColor={hexWithOpacity(
                                            colors.mutedForeground,
                                            0.5
                                        )}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        style={[
                                            styles.input,
                                            { color: colors.foreground },
                                        ]}
                                    />
                                </View>

                                <View
                                    style={[
                                        styles.inputGroup,
                                        {
                                            backgroundColor: hexWithOpacity(
                                                colors.background,
                                                0.65
                                            ),
                                            borderColor: colors.border,
                                        },
                                    ]}
                                >
                                    <Mail
                                        size={20}
                                        color={colors.mutedForeground}
                                    />
                                    <TextInput
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder={t(
                                            'auth.email_placeholder'
                                        )}
                                        placeholderTextColor={hexWithOpacity(
                                            colors.mutedForeground,
                                            0.5
                                        )}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        style={[
                                            styles.input,
                                            { color: colors.foreground },
                                        ]}
                                    />
                                </View>

                                <View
                                    style={[
                                        styles.inputGroup,
                                        {
                                            backgroundColor: hexWithOpacity(
                                                colors.background,
                                                0.65
                                            ),
                                            borderColor: colors.border,
                                        },
                                    ]}
                                >
                                    <Lock
                                        size={20}
                                        color={colors.mutedForeground}
                                    />
                                    <TextInput
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder={t(
                                            'auth.password_placeholder'
                                        )}
                                        placeholderTextColor={hexWithOpacity(
                                            colors.mutedForeground,
                                            0.5
                                        )}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        style={[
                                            styles.input,
                                            { color: colors.foreground },
                                        ]}
                                    />
                                    <Pressable
                                        onPress={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        hitSlop={8}
                                    >
                                        {showPassword ? (
                                            <EyeOff
                                                size={18}
                                                color={colors.mutedForeground}
                                            />
                                        ) : (
                                            <Eye
                                                size={18}
                                                color={colors.mutedForeground}
                                            />
                                        )}
                                    </Pressable>
                                </View>

                                <View
                                    style={[
                                        styles.inputGroup,
                                        {
                                            backgroundColor: hexWithOpacity(
                                                colors.background,
                                                0.65
                                            ),
                                            borderColor: colors.border,
                                        },
                                    ]}
                                >
                                    <Lock
                                        size={20}
                                        color={colors.mutedForeground}
                                    />
                                    <TextInput
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        placeholder={
                                            t(
                                                'auth.confirm_password_placeholder'
                                            ) || 'Confirm Password'
                                        }
                                        placeholderTextColor={hexWithOpacity(
                                            colors.mutedForeground,
                                            0.5
                                        )}
                                        secureTextEntry={!showConfirmPassword}
                                        autoCapitalize="none"
                                        onSubmitEditing={handleSubmit}
                                        style={[
                                            styles.input,
                                            { color: colors.foreground },
                                        ]}
                                    />
                                    <Pressable
                                        onPress={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword
                                            )
                                        }
                                        hitSlop={8}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff
                                                size={18}
                                                color={colors.mutedForeground}
                                            />
                                        ) : (
                                            <Eye
                                                size={18}
                                                color={colors.mutedForeground}
                                            />
                                        )}
                                    </Pressable>
                                </View>
                            </View>

                            <Pressable
                                onPress={handleSubmit}
                                disabled={isLoading}
                                style={({ pressed }) => [
                                    styles.submitBtn,
                                    {
                                        backgroundColor: colors.primary,
                                        shadowColor: colors.primary,
                                        opacity: isLoading
                                            ? 0.5
                                            : pressed
                                            ? 0.9
                                            : 1,
                                    },
                                ]}
                            >
                                {isLoading ? (
                                    <ActivityIndicator
                                        color={colors.primaryForeground}
                                    />
                                ) : (
                                    <>
                                        <Text
                                            style={[
                                                styles.submitText,
                                                {
                                                    color: colors.primaryForeground,
                                                },
                                            ]}
                                        >
                                            {t('auth.register_button')}
                                        </Text>
                                        <ArrowRight
                                            size={18}
                                            color={colors.primaryForeground}
                                            strokeWidth={2.5}
                                        />
                                    </>
                                )}
                            </Pressable>
                        </View>

                        <View style={styles.footer}>
                            <Text
                                style={[
                                    styles.footerText,
                                    { color: colors.mutedForeground },
                                ]}
                            >
                                {t('auth.have_account')}{' '}
                                <Link
                                    href="/(auth)/login"
                                    style={[
                                        styles.footerLink,
                                        { color: colors.primary },
                                    ]}
                                >
                                    {t('auth.login_button')}
                                </Link>
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    bgGlow: {
        position: 'absolute',
        top: -120,
        alignSelf: 'center',
        width: 380,
        height: 380,
        borderRadius: 190,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 16,
    },
    card: {
        width: '100%',
        maxWidth: 448,
        alignSelf: 'center',
        borderRadius: 40,
        padding: 32,
        borderWidth: 1,
        gap: 28,
    },
    header: {
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 30,
        fontFamily: FONT_FAMILY.bold,
        letterSpacing: -0.6,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: FONT_FAMILY.medium,
        textAlign: 'center',
    },
    form: {
        gap: 20,
    },
    errorBox: {
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
    },
    errorText: {
        fontSize: 12,
        fontFamily: FONT_FAMILY.bold,
        textAlign: 'center',
    },
    inputsStack: {
        gap: 16,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontFamily: FONT_FAMILY.medium,
        paddingVertical: 0,
    },
    submitBtn: {
        paddingVertical: 15,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 16,
        elevation: 6,
    },
    submitText: {
        fontSize: 16,
        fontFamily: FONT_FAMILY.bold,
    },
    footer: {
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        fontFamily: FONT_FAMILY.medium,
        textAlign: 'center',
    },
    footerLink: {
        fontFamily: FONT_FAMILY.bold,
    },
});
