import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import {
    useFonts,
    IBMPlexSans_300Light,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
} from '@expo-google-fonts/ibm-plex-sans';

import '@/i18n';
import { hydrateLanguage } from '@/i18n';
import { queryClient } from '@/lib/query-client';
import api from '@/lib/axios';
import { hydrateSessionTokens } from '@/lib/token-storage';
import { useAuthStore } from '@/store/auth-store';
import { useThemeStore } from '@/store/theme-store';
import type { User } from '@/types';

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        IBMPlexSans_300Light,
        IBMPlexSans_400Regular,
        IBMPlexSans_500Medium,
        IBMPlexSans_600SemiBold,
        IBMPlexSans_700Bold,
    });

    const router = useRouter();
    const segments = useSegments();

    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isInitialized = useAuthStore((state) => state.isInitialized);
    const setAuth = useAuthStore((state) => state.setAuth);
    const logout = useAuthStore((state) => state.logout);

    const theme = useThemeStore((state) => state.theme);
    const colors = useThemeStore((state) => state.colors);
    const hydrateTheme = useThemeStore((state) => state.hydrateTheme);

    const [bootstrapReady, setBootstrapReady] = useState(false);

    useEffect(() => {
        SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
    }, [colors.background]);

    useEffect(() => {
        let cancelled = false;

        async function bootstrap() {
            await Promise.all([
                hydrateTheme(),
                hydrateLanguage(),
                hydrateSessionTokens(),
            ]);

            if (!cancelled) {
                setBootstrapReady(true);
            }

            if (useAuthStore.getState().isInitialized) {
                return;
            }

            try {
                const { data } = await api.get<User>('/auth/profile');
                if (!cancelled) setAuth(data);
            } catch {
                if (!cancelled) logout();
            }
        }

        bootstrap();

        return () => {
            cancelled = true;
        };
    }, [hydrateTheme, setAuth, logout]);

    useEffect(() => {
        if (!bootstrapReady || !isInitialized) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!isAuthenticated && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (isAuthenticated && inAuthGroup) {
            router.replace('/(app)');
        }
    }, [bootstrapReady, isInitialized, isAuthenticated, segments, router]);

    const fontsReady = fontsLoaded || Boolean(fontError);

    return (
        <GestureHandlerRootView
            style={[styles.flex, { backgroundColor: colors.background }]}
        >
            <SafeAreaProvider>
                <QueryClientProvider client={queryClient}>
                    <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
                    {!bootstrapReady || !isInitialized || !fontsReady ? (
                        <View
                            style={[
                                styles.loaderScreen,
                                { backgroundColor: colors.background },
                            ]}
                        >
                            <ActivityIndicator
                                size="large"
                                color={colors.primary}
                            />
                        </View>
                    ) : (
                        <Slot />
                    )}
                </QueryClientProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    loaderScreen: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
