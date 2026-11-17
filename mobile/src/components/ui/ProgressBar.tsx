import React, { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useThemeStore } from '@/store/theme-store';
import { hexWithOpacity, resolveColorHex } from '@/constants/theme';

interface ProgressBarProps {
    value: number;
    max: number;
    color?: string;
    style?: ViewStyle;
}

export function ProgressBar({ value, max, color, style }: ProgressBarProps) {
    const colors = useThemeStore((state) => state.colors);
    const safeMax = max > 0 ? max : 1;
    const targetPct = Math.min(Math.max((value / safeMax) * 100, 0), 100);
    const progress = useSharedValue(targetPct);

    useEffect(() => {
        progress.value = withTiming(targetPct, { duration: 500 });
    }, [targetPct, progress]);

    const barColor = resolveColorHex(color, colors.primary);

    const animatedStyle = useAnimatedStyle(() => ({
        width: `${progress.value}%`,
    }));

    return (
        <View
            style={[
                styles.track,
                { backgroundColor: hexWithOpacity(colors.secondary, 0.35) },
                style,
            ]}
        >
            <Animated.View
                style={[
                    styles.fill,
                    { backgroundColor: barColor },
                    animatedStyle,
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    track: {
        height: 8,
        width: '100%',
        borderRadius: 999,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: 999,
    },
});
