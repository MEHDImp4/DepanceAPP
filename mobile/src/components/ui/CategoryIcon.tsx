import React from 'react';
import { Text, type TextStyle } from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

interface CategoryIconProps {
    icon: string;
    size?: number;
    color?: string;
    strokeWidth?: number;
    style?: TextStyle;
}

export function CategoryIcon({
    icon,
    size = 20,
    color = '#FAFAFA',
    strokeWidth = 2,
    style,
}: CategoryIconProps) {
    const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon | undefined>)[icon];

    if (IconComponent) {
        return <IconComponent size={size} color={color} strokeWidth={strokeWidth} />;
    }

    return (
        <Text
            style={[
                {
                    fontSize: size,
                    width: size + 4,
                    height: size + 4,
                    lineHeight: size + 4,
                    textAlign: 'center',
                    color,
                },
                style,
            ]}
        >
            {icon}
        </Text>
    );
}
