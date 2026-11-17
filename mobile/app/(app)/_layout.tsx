import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth-store';
import { useThemeStore } from '@/store/theme-store';
import { hexWithOpacity } from '@/constants/theme';
import { BottomNav } from '@/components/layout/BottomNav';

export default function AppLayout() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isInitialized = useAuthStore((state) => state.isInitialized);
    const colors = useThemeStore((state) => state.colors);

    if (isInitialized && !isAuthenticated) {
        return <Redirect href="/(auth)/login" />;
    }

    return (
        <SafeAreaView
            edges={['top']}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            {/* Subtle Background Decorative Element matching MobileLayout.tsx */}
            <View
                pointerEvents="none"
                style={[
                    styles.bgGlow,
                    { backgroundColor: hexWithOpacity(colors.primary, 0.05) },
                ]}
            />

            <View style={styles.content}>
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: 'transparent' },
                        animation: 'fade',
                    }}
                />
            </View>

            <BottomNav />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    bgGlow: {
        position: 'absolute',
        top: -80,
        left: -80,
        width: 260,
        height: 260,
        borderRadius: 130,
    },
    content: {
        flex: 1,
    },
});
