import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth-store';
import { useThemeStore } from '@/store/theme-store';
import { BottomNav } from '@/components/layout/BottomNav';
import { AmbientGlow } from '@/components/ui/AmbientGlow';

export default function AppLayout() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isInitialized = useAuthStore((state) => state.isInitialized);
    const { theme, colors } = useThemeStore();

    if (isInitialized && !isAuthenticated) {
        return <Redirect href="/(auth)/login" />;
    }

    return (
        <SafeAreaView
            edges={['top']}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            {/* Subtle Background Decorative Element matching MobileLayout.tsx */}
            <AmbientGlow
                color={colors.primary}
                opacity={theme === 'dark' ? 0.14 : 0.08}
                size={340}
                style={{ top: -110, left: -110 }}
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
    content: {
        flex: 1,
    },
});
