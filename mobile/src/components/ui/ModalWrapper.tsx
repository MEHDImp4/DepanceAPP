import React from 'react';
import {
    Modal,
    View,
    Text,
    Pressable,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import { useThemeStore } from '@/store/theme-store';
import { FONT_FAMILY, hexWithOpacity } from '@/constants/theme';

interface ModalWrapperProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    headerIcon?: React.ReactNode;
    surfaceColor?: string;
    children: React.ReactNode;
}

export function ModalWrapper({
    isOpen,
    onClose,
    title,
    subtitle,
    headerIcon,
    surfaceColor,
    children,
}: ModalWrapperProps) {
    const { theme, colors } = useThemeStore();
    const bg = surfaceColor || colors.card;

    return (
        <Modal
            visible={isOpen}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.root}>
                <Pressable
                    style={styles.backdrop}
                    onPress={onClose}
                    accessibilityLabel="Close modal"
                >
                    <BlurView
                        intensity={28}
                        tint={theme === 'dark' ? 'dark' : 'light'}
                        style={[
                            styles.backdropBlur,
                            { backgroundColor: colors.overlay },
                        ]}
                    />
                </Pressable>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                    pointerEvents="box-none"
                >
                    <View
                        style={[
                            styles.card,
                            {
                                backgroundColor: bg,
                                borderColor:
                                    theme === 'dark'
                                        ? 'rgba(255, 255, 255, 0.12)'
                                        : colors.border,
                            },
                        ]}
                    >
                        <View
                            style={[
                                styles.header,
                                {
                                    borderBottomColor: hexWithOpacity(
                                        colors.border,
                                        0.5
                                    ),
                                },
                            ]}
                        >
                            <View style={styles.titleBlock}>
                                <View style={styles.titleRow}>
                                    {headerIcon}
                                    <Text
                                        style={[
                                            styles.title,
                                            { color: colors.foreground },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {title}
                                    </Text>
                                </View>
                                {subtitle ? (
                                    <Text
                                        style={[
                                            styles.subtitle,
                                            { color: colors.mutedForeground },
                                        ]}
                                    >
                                        {subtitle}
                                    </Text>
                                ) : null}
                            </View>

                            <Pressable
                                onPress={onClose}
                                hitSlop={8}
                                style={({ pressed }) => [
                                    styles.closeBtn,
                                    {
                                        backgroundColor: pressed
                                            ? colors.muted
                                            : colors.whiteSubtle,
                                        transform: [
                                            { scale: pressed ? 0.92 : 1 },
                                        ],
                                    },
                                ]}
                                accessibilityRole="button"
                                accessibilityLabel="Close"
                            >
                                <X size={19} color={colors.mutedForeground} />
                            </Pressable>
                        </View>

                        <ScrollView
                            style={styles.scroll}
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            {children}
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    backdropBlur: {
        flex: 1,
    },
    keyboardView: {
        width: '100%',
        maxWidth: 448,
        maxHeight: '88%',
        justifyContent: 'center',
    },
    card: {
        width: '100%',
        maxHeight: '100%',
        borderRadius: 32,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.4,
        shadowRadius: 28,
        elevation: 18,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 22,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    titleBlock: {
        flex: 1,
        marginRight: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 20,
        fontFamily: FONT_FAMILY.bold,
        letterSpacing: -0.4,
    },
    subtitle: {
        fontSize: 11,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginTop: 4,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scroll: {
        flexGrow: 0,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 28,
    },
});
