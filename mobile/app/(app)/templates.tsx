import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    RefreshControl,
    Alert,
    StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Plus,
    Wallet,
    ShoppingCart,
    Home,
    Car,
    Lightbulb,
    Coffee,
    Smartphone,
    Plane,
    TrendingUp,
    TrendingDown,
    Music,
    Tv2,
    Film,
    Ghost,
    PlayCircle,
    Apple,
    MonitorPlay,
    Dumbbell,
    Shirt,
    UtensilsCrossed,
    Settings2,
    Check,
    type LucideIcon,
} from 'lucide-react-native';

import {
    useTemplates,
    useCreateTemplate,
    useUpdateTemplate,
    useCreateTransaction,
} from '@/hooks/use-api';
import { useThemeStore } from '@/store/theme-store';
import { formatCurrency } from '@/hooks/use-currency';
import { FONT_FAMILY, hexWithOpacity, resolveColorHex } from '@/constants/theme';
import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { AddTemplateModal } from '@/components/templates/AddTemplateModal';
import type { Template } from '@/types';

const ICON_MAP: Record<string, LucideIcon> = {
    Home,
    ShoppingCart,
    Car,
    Wallet,
    Lightbulb,
    Coffee,
    Smartphone,
    Plane,
    TrendingUp,
    TrendingDown,
    Music,
    Tv2,
    Film,
    Ghost,
    PlayCircle,
    Apple,
    MonitorPlay,
    Dumbbell,
    Shirt,
    UtensilsCrossed,
    Default: Wallet,
};

export default function TemplatesScreen() {
    const { t, i18n } = useTranslation();
    const insets = useSafeAreaInsets();
    const colors = useThemeStore((state) => state.colors);

    const { data: templates = [], isLoading, refetch } = useTemplates();
    const createTemplate = useCreateTemplate();
    const updateTemplate = useUpdateTemplate();
    const createTransaction = useCreateTransaction();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [applyingId, setApplyingId] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState<Template | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refetch();
        } finally {
            setRefreshing(false);
        }
    }, [refetch]);

    const handleAddTemplate = (newTemplate: Omit<Template, 'id'>) => {
        createTemplate.mutate(newTemplate, {
            onSuccess: () => setIsModalOpen(false),
        });
    };

    const handleUpdateTemplate = (
        id: number,
        updatedTemplate: Omit<Template, 'id'>
    ) => {
        updateTemplate.mutate(
            { id, ...updatedTemplate },
            {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setTemplateToEdit(null);
                },
            }
        );
    };

    const handleApplyTemplate = (template: Template) => {
        if (!template.default_account_id) {
            Alert.alert(
                t('templates.title'),
                t('templates.no_account_error') ||
                    'Please set a default account for this template'
            );
            return;
        }

        setApplyingId(template.id);
        createTransaction.mutate(
            {
                amount: template.amount,
                description: template.name,
                type: template.type,
                account_id: template.default_account_id,
                category_id: template.category_id || undefined,
            },
            {
                onSuccess: () => {
                    setTimeout(() => setApplyingId(null), 1000);
                },
                onError: () => {
                    setApplyingId(null);
                    Alert.alert('Error', 'Error applying template');
                },
            }
        );
    };

    if (isLoading) {
        return (
            <View style={styles.centerScreen}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
                styles.content,
                { paddingBottom: Math.max(insets.bottom, 16) + 128 },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.primary}
                />
            }
        >
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <Text
                        style={[
                            styles.pageTitle,
                            { color: colors.foreground },
                        ]}
                    >
                        {t('templates.title')}
                    </Text>
                    <Text
                        style={[
                            styles.subtitle,
                            {
                                color: hexWithOpacity(
                                    colors.mutedForeground,
                                    0.7
                                ),
                            },
                        ]}
                    >
                        {t('templates.subtitle')}
                    </Text>
                </View>

                <View style={styles.headerActions}>
                    <Pressable
                        onPress={() => {
                            setIsEditMode(!isEditMode);
                            if (isEditMode) setTemplateToEdit(null);
                        }}
                        style={[
                            styles.headerIconBtn,
                            {
                                backgroundColor: isEditMode
                                    ? colors.emerald
                                    : colors.card,
                                borderColor: isEditMode
                                    ? colors.emerald
                                    : colors.border,
                            },
                        ]}
                        accessibilityLabel="Manage Templates"
                    >
                        {isEditMode ? (
                            <Check size={22} color="#FFFFFF" strokeWidth={3} />
                        ) : (
                            <Settings2
                                size={22}
                                color={colors.mutedForeground}
                                strokeWidth={2.5}
                            />
                        )}
                    </Pressable>

                    <Pressable
                        onPress={() => {
                            setTemplateToEdit(null);
                            setIsModalOpen(true);
                        }}
                        style={[
                            styles.headerIconBtn,
                            {
                                backgroundColor: colors.primary,
                                borderColor: colors.primary,
                            },
                        ]}
                        accessibilityLabel={t('templates.add_template')}
                    >
                        <Plus
                            size={24}
                            color={colors.primaryForeground}
                            strokeWidth={3}
                        />
                    </Pressable>
                </View>
            </View>

            <View style={styles.cardsStack}>
                {templates.map((template) => {
                    const IconComponent =
                        ICON_MAP[template.icon_name || 'Default'] || Wallet;
                    const isApplying = applyingId === template.id;
                    const badgeBg = resolveColorHex(
                        template.color,
                        colors.primary
                    );
                    const isIncome = template.type === 'income';

                    return (
                        <Pressable
                            key={template.id}
                            disabled={isApplying}
                            onPress={() => {
                                if (isEditMode) {
                                    setTemplateToEdit(template);
                                    setIsModalOpen(true);
                                } else {
                                    handleApplyTemplate(template);
                                }
                            }}
                            style={({ pressed }) => [
                                styles.templateCard,
                                {
                                    backgroundColor: isApplying
                                        ? hexWithOpacity(colors.primary, 0.08)
                                        : isEditMode
                                        ? hexWithOpacity(colors.emerald, 0.06)
                                        : hexWithOpacity(colors.card, 0.85),
                                    borderColor: isApplying
                                        ? hexWithOpacity(colors.primary, 0.5)
                                        : isEditMode
                                        ? hexWithOpacity(colors.emerald, 0.35)
                                        : colors.whiteBorder,
                                    opacity: pressed ? 0.9 : 1,
                                },
                            ]}
                        >
                            <AmbientGlow
                                color={badgeBg}
                                opacity={0.14}
                                size={170}
                                style={{ top: -55, right: -55 }}
                            />

                            <View
                                style={[
                                    styles.iconBadge,
                                    {
                                        backgroundColor: badgeBg,
                                        borderColor: colors.whiteBorder,
                                        shadowColor: badgeBg,
                                    },
                                ]}
                            >
                                <LinearGradient
                                    colors={[
                                        'rgba(255,255,255,0.28)',
                                        'rgba(255,255,255,0)',
                                    ]}
                                    start={{ x: 0, y: 1 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.badgeGloss}
                                />
                                {isApplying ? (
                                    <Plus
                                        size={28}
                                        color="#FFFFFF"
                                        strokeWidth={3}
                                    />
                                ) : (
                                    <IconComponent
                                        size={28}
                                        color="#FFFFFF"
                                        strokeWidth={2.6}
                                    />
                                )}
                            </View>

                            <View style={styles.cardMeta}>
                                <Text
                                    style={[
                                        styles.cardTitle,
                                        { color: colors.foreground },
                                    ]}
                                >
                                    {template.name}
                                </Text>
                                <View style={styles.accountRow}>
                                    <Text
                                        style={[
                                            styles.accountText,
                                            {
                                                color: hexWithOpacity(
                                                    colors.mutedForeground,
                                                    0.7
                                                ),
                                            },
                                        ]}
                                    >
                                        {template.default_account?.name ||
                                            'No Account'}
                                    </Text>
                                    {isEditMode ? (
                                        <View
                                            style={[
                                                styles.editDot,
                                                {
                                                    backgroundColor:
                                                        colors.emerald,
                                                },
                                            ]}
                                        >
                                            <Settings2
                                                size={10}
                                                color="#FFFFFF"
                                                strokeWidth={3}
                                            />
                                        </View>
                                    ) : null}
                                </View>
                            </View>

                            <View style={styles.amountRow}>
                                <Text
                                    style={[
                                        styles.amountText,
                                        {
                                            color: isIncome
                                                ? colors.emerald
                                                : colors.foreground,
                                        },
                                    ]}
                                >
                                    {formatCurrency(
                                        template.amount,
                                        template.default_account?.currency ||
                                            'USD',
                                        i18n.language,
                                        { maximumFractionDigits: 0 }
                                    )}
                                </Text>
                                <Text
                                    style={[
                                        styles.signText,
                                        {
                                            color: isIncome
                                                ? colors.emerald
                                                : colors.foreground,
                                            opacity: 0.45,
                                        },
                                    ]}
                                >
                                    {isIncome ? ' +' : ' -'}
                                </Text>
                            </View>
                        </Pressable>
                    );
                })}

                <Pressable
                    onPress={() => {
                        setTemplateToEdit(null);
                        setIsModalOpen(true);
                    }}
                    style={({ pressed }) => [
                        styles.placeholderCard,
                        {
                            borderColor: hexWithOpacity(
                                colors.mutedForeground,
                                0.25
                            ),
                            backgroundColor: pressed
                                ? hexWithOpacity(colors.muted, 0.3)
                                : 'transparent',
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.placeholderIcon,
                            {
                                backgroundColor: hexWithOpacity(
                                    colors.muted,
                                    0.45
                                ),
                            },
                        ]}
                    >
                        <Plus size={24} color={colors.mutedForeground} />
                    </View>
                    <Text
                        style={[
                            styles.placeholderText,
                            {
                                color: hexWithOpacity(
                                    colors.mutedForeground,
                                    0.6
                                ),
                            },
                        ]}
                    >
                        {t('templates.create_new')}
                    </Text>
                </Pressable>
            </View>

            <AddTemplateModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setTemplateToEdit(null);
                }}
                onAdd={handleAddTemplate}
                onUpdate={handleUpdateTemplate}
                templateToEdit={templateToEdit}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 32,
        maxWidth: 448,
        width: '100%',
        alignSelf: 'center',
    },
    centerScreen: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 96,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 8,
        paddingHorizontal: 4,
        gap: 12,
    },
    headerText: {
        flex: 1,
        gap: 4,
    },
    pageTitle: {
        fontSize: 30,
        fontFamily: FONT_FAMILY.bold,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 10,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 2.8,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 10,
    },
    headerIconBtn: {
        width: 48,
        height: 48,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardsStack: {
        gap: 16,
    },
    templateCard: {
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 32,
        borderWidth: 1,
        padding: 24,
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
        elevation: 5,
    },
    iconBadge: {
        width: 64,
        height: 64,
        borderRadius: 22,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    badgeGloss: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    cardMeta: {
        alignItems: 'center',
        gap: 4,
    },
    cardTitle: {
        fontSize: 18,
        fontFamily: FONT_FAMILY.bold,
        textAlign: 'center',
    },
    accountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    accountText: {
        fontSize: 11,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    editDot: {
        padding: 4,
        borderRadius: 999,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
    },
    amountText: {
        fontSize: 22,
        fontFamily: FONT_FAMILY.bold,
        letterSpacing: -0.5,
    },
    signText: {
        fontSize: 16,
        fontFamily: FONT_FAMILY.bold,
    },
    placeholderCard: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 32,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    placeholderIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        fontSize: 11,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.6,
    },
});
