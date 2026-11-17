import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    Alert,
    StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    X,
    Check,
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
    type LucideIcon,
} from 'lucide-react-native';
import type { Template } from '@/types';
import {
    useCategories,
    useAccounts,
    useDeleteTemplate,
} from '@/hooks/use-api';
import { useThemeStore } from '@/store/theme-store';
import { FONT_FAMILY, hexWithOpacity, resolveColorHex } from '@/constants/theme';
import { ModalWrapper } from '@/components/ui/ModalWrapper';
import { PremiumSelect } from '@/components/ui/PremiumSelect';

interface AddTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (template: Omit<Template, 'id'>) => void;
    onUpdate?: (id: number, template: Omit<Template, 'id'>) => void;
    templateToEdit?: Template | null;
}

const COLORS = [
    'bg-teal-500',
    'bg-emerald-500',
    'bg-lime-500',
    'bg-pink-500',
    'bg-rose-500',
    'bg-slate-500',
];

const ICONS: { name: string; icon: LucideIcon }[] = [
    { name: 'Home', icon: Home },
    { name: 'ShoppingCart', icon: ShoppingCart },
    { name: 'Car', icon: Car },
    { name: 'Wallet', icon: Wallet },
    { name: 'Lightbulb', icon: Lightbulb },
    { name: 'Coffee', icon: Coffee },
    { name: 'Smartphone', icon: Smartphone },
    { name: 'Plane', icon: Plane },
    { name: 'Music', icon: Music },
    { name: 'Tv2', icon: Tv2 },
    { name: 'Film', icon: Film },
    { name: 'PlayCircle', icon: PlayCircle },
    { name: 'Apple', icon: Apple },
    { name: 'MonitorPlay', icon: MonitorPlay },
    { name: 'Dumbbell', icon: Dumbbell },
    { name: 'Shirt', icon: Shirt },
    { name: 'UtensilsCrossed', icon: UtensilsCrossed },
    { name: 'Ghost', icon: Ghost },
];

export function AddTemplateModal({
    isOpen,
    onClose,
    onAdd,
    onUpdate,
    templateToEdit,
}: AddTemplateModalProps) {
    const { t } = useTranslation();
    const colors = useThemeStore((state) => state.colors);
    const { data: categories = [] } = useCategories();
    const { data: accounts = [] } = useAccounts();
    const deleteTemplate = useDeleteTemplate();

    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [accountId, setAccountId] = useState<number | null>(null);
    const [iconName, setIconName] = useState('Home');
    const [color, setColor] = useState('bg-blue-500');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        setError('');
        if (templateToEdit) {
            setName(templateToEdit.name);
            setAmount(templateToEdit.amount.toString());
            setType(templateToEdit.type);
            setCategoryId(templateToEdit.category_id || null);
            setAccountId(templateToEdit.default_account_id || null);
            setIconName(templateToEdit.icon_name || 'Home');
            setColor(templateToEdit.color || 'bg-blue-500');
            setDescription(templateToEdit.description || '');
        } else {
            setName('');
            setAmount('');
            setType('expense');
            setCategoryId(null);
            setAccountId(null);
            setIconName('Home');
            setColor('bg-blue-500');
            setDescription('');
        }
    }, [templateToEdit, isOpen]);

    const handleTypeSwitch = (nextType: 'income' | 'expense') => {
        setType(nextType);
        if (categoryId) {
            const cat = categories.find((c) => c.id === categoryId);
            if (cat && cat.type !== nextType) {
                setCategoryId(null);
            }
        }
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            setError('Template name is required');
            return;
        }
        const parsedAmount = parseFloat(amount.replace(',', '.')) || 0;
        if (parsedAmount <= 0) {
            setError('Amount must be positive');
            return;
        }

        const templateData = {
            name: name.trim(),
            amount: parsedAmount,
            type,
            category_id: categoryId,
            default_account_id: accountId,
            icon_name: iconName,
            color,
            description,
        };

        if (templateToEdit && onUpdate) {
            onUpdate(templateToEdit.id, templateData);
        } else {
            onAdd(templateData);
        }
        onClose();
    };

    const handleDelete = () => {
        if (!templateToEdit) return;
        Alert.alert(
            t('common.delete'),
            t('common.confirm_delete') ||
                'Are you sure you want to delete this template?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: () => {
                        deleteTemplate.mutate(templateToEdit.id, {
                            onSuccess: () => onClose(),
                        });
                    },
                },
            ]
        );
    };

    const matchingCategories = categories.filter((c) => c.type === type);

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            title={
                templateToEdit
                    ? t('templates.edit_template') || 'Edit Template'
                    : t('templates.create_new') || 'Create Template'
            }
        >
            <View style={styles.form}>
                {error ? (
                    <Text
                        style={[
                            styles.errorText,
                            { color: colors.destructive },
                        ]}
                    >
                        {error}
                    </Text>
                ) : null}

                <View style={styles.field}>
                    <Text
                        style={[
                            styles.label,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        {t('common.name') || 'Name'}
                    </Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Monthly Rent"
                        placeholderTextColor={hexWithOpacity(
                            colors.mutedForeground,
                            0.5
                        )}
                        style={[
                            styles.input,
                            {
                                backgroundColor: hexWithOpacity(
                                    colors.muted,
                                    0.6
                                ),
                                color: colors.foreground,
                            },
                        ]}
                    />
                </View>

                <View style={styles.field}>
                    <Text
                        style={[
                            styles.label,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        {t('common.amount') || 'Amount'}
                    </Text>
                    <TextInput
                        value={amount}
                        onChangeText={setAmount}
                        placeholder="0.00"
                        placeholderTextColor={hexWithOpacity(
                            colors.mutedForeground,
                            0.5
                        )}
                        keyboardType="decimal-pad"
                        style={[
                            styles.input,
                            {
                                backgroundColor: hexWithOpacity(
                                    colors.muted,
                                    0.6
                                ),
                                color: colors.foreground,
                            },
                        ]}
                    />
                </View>

                <View style={styles.field}>
                    <Text
                        style={[
                            styles.label,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        {t('transactions.type')}
                    </Text>
                    <View style={styles.typeRow}>
                        <Pressable
                            onPress={() => handleTypeSwitch('expense')}
                            style={[
                                styles.typeBtn,
                                {
                                    borderColor:
                                        type === 'expense'
                                            ? colors.red
                                            : 'transparent',
                                    backgroundColor:
                                        type === 'expense'
                                            ? colors.redSoft
                                            : hexWithOpacity(colors.muted, 0.6),
                                },
                            ]}
                        >
                            <TrendingDown
                                size={16}
                                color={
                                    type === 'expense'
                                        ? colors.red
                                        : colors.mutedForeground
                                }
                            />
                            <Text
                                style={[
                                    styles.typeBtnText,
                                    {
                                        color:
                                            type === 'expense'
                                                ? colors.red
                                                : colors.mutedForeground,
                                    },
                                ]}
                            >
                                {t('transactions.expense')}
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={() => handleTypeSwitch('income')}
                            style={[
                                styles.typeBtn,
                                {
                                    borderColor:
                                        type === 'income'
                                            ? colors.emerald
                                            : 'transparent',
                                    backgroundColor:
                                        type === 'income'
                                            ? colors.emeraldSoft
                                            : hexWithOpacity(colors.muted, 0.6),
                                },
                            ]}
                        >
                            <TrendingUp
                                size={16}
                                color={
                                    type === 'income'
                                        ? colors.emerald
                                        : colors.mutedForeground
                                }
                            />
                            <Text
                                style={[
                                    styles.typeBtnText,
                                    {
                                        color:
                                            type === 'income'
                                                ? colors.emerald
                                                : colors.mutedForeground,
                                    },
                                ]}
                            >
                                {t('transactions.income')}
                            </Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.field}>
                    <Text
                        style={[
                            styles.label,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        {t('transactions.category')}
                    </Text>
                    <PremiumSelect
                        value={categoryId || 0}
                        onChange={(val) =>
                            setCategoryId(Number(val) > 0 ? Number(val) : null)
                        }
                        placeholder={t('transactions.uncategorized')}
                        style={styles.selectPad}
                        options={[
                            {
                                value: 0,
                                label: t('transactions.uncategorized'),
                            },
                            ...matchingCategories.map((c) => ({
                                value: c.id,
                                label: c.name,
                            })),
                        ]}
                    />
                </View>

                <View style={styles.field}>
                    <Text
                        style={[
                            styles.label,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        {t('settings.account')}
                    </Text>
                    <PremiumSelect
                        value={accountId || 0}
                        onChange={(val) =>
                            setAccountId(Number(val) > 0 ? Number(val) : null)
                        }
                        placeholder={
                            t('common.select_account') || 'Select Account'
                        }
                        style={styles.selectPad}
                        options={[
                            {
                                value: 0,
                                label:
                                    t('common.select_account') ||
                                    'Select Account',
                            },
                            ...accounts.map((a) => ({
                                value: a.id,
                                label: a.name,
                                secondaryLabel: a.balance.toFixed(2),
                            })),
                        ]}
                    />
                </View>

                <View style={styles.field}>
                    <Text
                        style={[
                            styles.label,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        Icon
                    </Text>
                    <View style={styles.iconGrid}>
                        {ICONS.map((item) => {
                            const isSelected = iconName === item.name;
                            return (
                                <Pressable
                                    key={item.name}
                                    onPress={() => setIconName(item.name)}
                                    style={({ pressed }) => [
                                        styles.iconCell,
                                        {
                                            borderColor: isSelected
                                                ? colors.primary
                                                : hexWithOpacity(
                                                      colors.border,
                                                      0.5
                                                  ),
                                            backgroundColor: isSelected
                                                ? hexWithOpacity(
                                                      colors.primary,
                                                      0.12
                                                  )
                                                : hexWithOpacity(
                                                      colors.muted,
                                                      0.55
                                                  ),
                                            transform: [
                                                { scale: pressed ? 0.94 : 1 },
                                            ],
                                        },
                                    ]}
                                >
                                    <item.icon
                                        size={20}
                                        color={
                                            isSelected
                                                ? colors.primary
                                                : colors.mutedForeground
                                        }
                                    />
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.field}>
                    <Text
                        style={[
                            styles.label,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        Color
                    </Text>
                    <View style={styles.colorGrid}>
                        {COLORS.map((c) => {
                            const isSelected = color === c;
                            return (
                                <Pressable
                                    key={c}
                                    onPress={() => setColor(c)}
                                    style={[
                                        styles.colorSwatch,
                                        {
                                            backgroundColor:
                                                resolveColorHex(c),
                                            borderColor: isSelected
                                                ? '#FFFFFF'
                                                : 'transparent',
                                            borderWidth: isSelected ? 2.5 : 0,
                                            opacity: isSelected ? 1 : 0.85,
                                            transform: [
                                                { scale: isSelected ? 1.1 : 1 },
                                            ],
                                        },
                                    ]}
                                >
                                    {isSelected ? (
                                        <Check
                                            size={15}
                                            color="#FFFFFF"
                                            strokeWidth={3.5}
                                        />
                                    ) : null}
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                <Pressable
                    onPress={handleSubmit}
                    style={({ pressed }) => [
                        styles.submitBtn,
                        {
                            backgroundColor: colors.primary,
                            opacity: pressed ? 0.9 : 1,
                        },
                    ]}
                >
                    <Check size={20} color={colors.primaryForeground} />
                    <Text
                        style={[
                            styles.submitText,
                            { color: colors.primaryForeground },
                        ]}
                    >
                        {templateToEdit
                            ? t('common.save') || 'Save Changes'
                            : t('templates.create_template')}
                    </Text>
                </Pressable>

                {templateToEdit ? (
                    <Pressable
                        onPress={handleDelete}
                        style={({ pressed }) => [
                            styles.deleteBtn,
                            {
                                backgroundColor: colors.redSoft,
                                opacity: pressed ? 0.85 : 1,
                            },
                        ]}
                    >
                        <X size={20} color={colors.red} />
                        <Text
                            style={[styles.deleteText, { color: colors.red }]}
                        >
                            {t('common.delete') || 'Delete Template'}
                        </Text>
                    </Pressable>
                ) : null}
            </View>
        </ModalWrapper>
    );
}

const styles = StyleSheet.create({
    form: {
        gap: 20,
    },
    errorText: {
        fontSize: 13,
        fontFamily: FONT_FAMILY.bold,
        textAlign: 'center',
    },
    field: {
        gap: 8,
    },
    label: {
        fontSize: 13,
        fontFamily: FONT_FAMILY.medium,
    },
    input: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        fontFamily: FONT_FAMILY.medium,
    },
    selectPad: {
        paddingVertical: 13,
    },
    typeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    typeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
    },
    typeBtnText: {
        fontSize: 12,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 8,
    },
    iconCell: {
        width: '15%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        borderWidth: 1.5,
    },
    colorGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    colorSwatch: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtn: {
        paddingVertical: 16,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    submitText: {
        fontSize: 15,
        fontFamily: FONT_FAMILY.bold,
    },
    deleteBtn: {
        paddingVertical: 16,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    deleteText: {
        fontSize: 15,
        fontFamily: FONT_FAMILY.bold,
    },
});
