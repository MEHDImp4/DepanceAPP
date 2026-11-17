import React from 'react';
import { Stack } from 'expo-router';
import { useThemeStore } from '@/store/theme-store';

export default function AuthLayout() {
    const colors = useThemeStore((state) => state.colors);

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'fade',
            }}
        />
    );
}
