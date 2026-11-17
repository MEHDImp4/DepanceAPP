import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    Pressable,
    ScrollView,
    StyleSheet,
    type ViewStyle,
} from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { useThemeStore } from '@/store/theme-store';
import { FONT_FAMILY, hexWithOpacity } from '@/constants/theme';

export interface SelectOption<T extends string | number> {
    label: string;
    secondaryLabel?: string;
    value: T;
}

interface PremiumSelectProps<T extends string | number> {
    value: T;
    onChange: (value: T) => void;
    options: SelectOption<T>[];
    placeholder?: string;
    style?: ViewStyle;
}

export function PremiumSelect<T extends string | number>({
    value,
    onChange,
    options,
    placeholder = 'Select',
    style,
}: PremiumSelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const colors = useThemeStore((state) => state.colors);

    const selectedOption = options.find((opt) => opt.value === value);

    const handleSelect = (optionValue: T) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <View style={styles.container}>
            <Pressable
                onPress={() => setIsOpen(true)}
                style={({ pressed }) => [
                    styles.trigger,
                    {
                        backgroundColor: pressed
                            ? colors.muted
                            : hexWithOpacity(colors.muted, 0.7),
                    },
                    style,
                ]}
                accessibilityRole="button"
                accessibilityLabel={selectedOption?.label || placeholder}
            >
                <View style={styles.triggerTextWrap}>
                    <Text
                        style={[
                            styles.triggerText,
                            {
                                color: selectedOption
                                    ? colors.foreground
                                    : colors.mutedForeground,
                            },
                        ]}
                        numberOfLines={1}
                    >
                        {selectedOption?.label || placeholder}
                    </Text>
                </View>
                <ChevronDown
                    size={14}
                    color={colors.mutedForeground}
                    style={{
                        transform: [{ rotate: isOpen ? '180deg' : '0deg' }],
                    }}
                />
            </Pressable>

            <Modal
                visible={isOpen}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setIsOpen(false)}
            >
                <View style={styles.modalRoot}>
                    <Pressable
                        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
                        onPress={() => setIsOpen(false)}
                    />
                    <View
                        style={[
                            styles.dropdown,
                            {
                                backgroundColor: colors.popover,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        <ScrollView
                            style={styles.optionsList}
                            showsVerticalScrollIndicator={false}
                        >
                            {options.map((option) => {
                                const isSelected = option.value === value;
                                return (
                                    <Pressable
                                        key={String(option.value)}
                                        onPress={() => handleSelect(option.value)}
                                        style={({ pressed }) => [
                                            styles.optionRow,
                                            {
                                                backgroundColor: isSelected
                                                    ? hexWithOpacity(colors.primary, 0.1)
                                                    : pressed
                                                    ? hexWithOpacity(colors.muted, 0.6)
                                                    : 'transparent',
                                            },
                                        ]}
                                    >
                                        <View style={styles.optionLabels}>
                                            <Text
                                                style={[
                                                    styles.optionText,
                                                    {
                                                        color: isSelected
                                                            ? colors.primary
                                                            : colors.foreground,
                                                    },
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {option.label}
                                            </Text>
                                            {option.secondaryLabel ? (
                                                <Text
                                                    style={[
                                                        styles.optionSecondary,
                                                        { color: colors.mutedForeground },
                                                    ]}
                                                >
                                                    {option.secondaryLabel}
                                                </Text>
                                            ) : null}
                                        </View>
                                        {isSelected ? (
                                            <Check size={16} color={colors.primary} strokeWidth={2.5} />
                                        ) : null}
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        gap: 8,
    },
    triggerTextWrap: {
        flex: 1,
    },
    triggerText: {
        fontSize: 14,
        fontFamily: FONT_FAMILY.semibold,
    },
    modalRoot: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    dropdown: {
        width: '100%',
        maxWidth: 380,
        maxHeight: 340,
        borderRadius: 20,
        borderWidth: 1,
        paddingVertical: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 16,
    },
    optionsList: {
        maxHeight: 320,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    optionLabels: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    optionText: {
        fontSize: 14,
        fontFamily: FONT_FAMILY.medium,
        flexShrink: 1,
    },
    optionSecondary: {
        fontSize: 12,
        fontFamily: FONT_FAMILY.medium,
    },
});
