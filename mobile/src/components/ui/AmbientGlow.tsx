import React, { useId } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

interface AmbientGlowProps {
    color?: string;
    opacity?: number;
    size?: number;
    style?: ViewStyle;
}

export function AmbientGlow({
    color = '#2563EB',
    opacity = 0.16,
    size = 240,
    style,
}: AmbientGlowProps) {
    const rawId = useId();
    const gradId = `glow-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

    return (
        <View
            pointerEvents="none"
            style={[
                styles.container,
                { width: size, height: size },
                style,
            ]}
        >
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <Defs>
                    <RadialGradient
                        id={gradId}
                        cx="50%"
                        cy="50%"
                        rx="50%"
                        ry="50%"
                    >
                        <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
                        <Stop
                            offset="45%"
                            stopColor={color}
                            stopOpacity={opacity * 0.45}
                        />
                        <Stop offset="100%" stopColor={color} stopOpacity={0} />
                    </RadialGradient>
                </Defs>
                <Rect
                    x="0"
                    y="0"
                    width={size}
                    height={size}
                    fill={`url(#${gradId})`}
                />
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
    },
});
