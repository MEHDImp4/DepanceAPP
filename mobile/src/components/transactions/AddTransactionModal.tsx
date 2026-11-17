import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { Check, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { Transaction } from '@/types';
import {
    useAccounts,
    useCategories,
    useCreateCategory,
} from '@/hooks/use-api';
import { formatCurrency, getCurrencySymbol } from '@/hooks/use-currency';
import { useThemeStore } from '@/store/theme-store';
import { FONT_FAMILY, hexWithOpacity } from '@/constants/theme';
import { ModalWrapper } from '@/components/ui/ModalWrapper';
import { PremiumSelect } from '@/components/ui/PremiumSelect';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (
        transaction: Omit<Transaction, 'id' | 'created_at'> & {
            account_id: number;
        }
    ) => void;
    initialData?: Partial<Transaction>;
}

export function AddTransactionModal({
    isOpen,
    onClose,
    onAdd,
    initialData,
}: AddTransactionModalProps) {
    const { t } = useTranslation();
    const colors = useThemeStore((state) => state.colors);
    const { data: accounts = [] } = useAccounts();
    const { data: categories = [] } = useCategories();
    const createCategory = useCreateCategory();

    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        type: 'expense' as 'income' | 'expense',
        account_id: accounts[0]?.id || 0,
        category_id: 0,
    });

    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setError('');
            setIsAddingCategory(false);
            setNewCategoryName('');
            if (initialData) {
                setFormData({
                    amount: initialData.amount?.toString() || '',
                    description: initialData.description || '',
                    type:
                        (initialData.type as 'income' | 'expense') || 'expense',
                    account_id:
                        initialData.account_id || accounts[0]?.id || 0,
                    category_id: initialData.category_id || 0,
                });
            } else {
                setFormData({
                    amount: '',
                    description: '',
                    type: 'expense',
                    account_id: accounts[0]?.id || 0,
                    category_id: 0,
                });
            }
        }
    }, [isOpen, initialData, accounts]);

    useEffect(() => {
        if (!initialData && accounts.length > 0 && formData.account_id === 0) {
            setFormData((prev) => ({ ...prev, account_id: accounts[0].id }));
        }
    }, [accounts, formData.account_id, initialData]);

    const handleCreateCategory = () => {
        if (!newCategoryName.trim()) return;

        const iconMap: Record<string, string> = {
            food: 'Utensils',
            restaurant: 'Utensils',
            groceries: 'ShoppingBag',
            shopping: 'ShoppingPalette',
            transport: 'Car',
            rent: 'Home',
            salary: 'Banknote',
            gift: 'Gift',
            health: 'Stethoscope',
        };

        const defaultIcon =
            iconMap[newCategoryName.toLowerCase().trim()] ||
            (formData.type === 'income' ? 'TrendingUp' : 'TrendingDown');

        createCategory.mutate(
            {
                name: newCategoryName.trim(),
                type: formData.type,
                icon: defaultIcon,
                color: '#3b82f6',
                user_id: 0,
            },
            {
                onSuccess: (data) => {
                    setFormData((prev) => ({ ...prev, category_id: data.id }));
                    setIsAddingCategory(false);
                    setNewCategoryName('');
                },
            }
        );
    };

    const selectedAccount = accounts.find(
        (a) => a.id === (formData.account_id || accounts[0]?.id)
    );
    const currencySymbol = getCurrencySymbol(selectedAccount?.currency || 'USD');

    const filteredCategories = categories.filter(
        (c) => c.type === formData.type
    );

    const handleTypeChange = (nextType: 'income' | 'expense') => {
        const currentCategoryValid = categories.some(
            (c) => c.id === formData.category_id && c.type === nextType
        );
        setFormData((prev) => ({
            ...prev,
            type: nextType,
            category_id: currentCategoryValid ? prev.category_id : 0,
        }));
    };

    const handleSubmit = () => {
        const parsedAmount = parseFloat(formData.amount.replace(',', '.'));
        if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
            setError('Please enter a valid positive amount');
            return;
        }
        if (!formData.account_id) {
            setError(t('accounts.select_account'));
            return;
        }
        if (!formData.description.trim()) {
            setError('Description is required');
            return;
        }

        setError('');
        onAdd({
            description: formData.description.trim(),
            type: formData.type,
            amount: parsedAmount,
            account_id: Number(formData.account_id),
            category_id:
                formData.category_id > 0
                    ? Number(formData.category_id)
                    : undefined,
        });
        onClose();
    };

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            title={t('transactions.add_new')}
        >
            <View style={styles.form}>
                {error ? (
                    <View
                        style={[
                            styles.errorBanner,
                            { backgroundColor: colors.destructiveSoft },
                        ]}
                    >
                        <Text
                            style={[
                                styles.errorText,
                                { color: colors.destructive },
                            ]}
                        >
                            {error}
                        </Text>
                    </View>
                ) : null}

                {/* Type Toggle */}
                <View
                    style={[
                        styles.toggleWrap,
                        { backgroundColor: colors.muted },
                    ]}
                >
                    <Pressable
                        onPress={() => handleTypeChange('expense')}
                        style={[
                            styles.toggleBtn,
                            formData.type === 'expense' && {
                                backgroundColor: colors.background,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.toggleText,
                                {
                                    color:
                                        formData.type === 'expense'
                                            ? colors.foreground
                                            : colors.mutedForeground,
                                },
                            ]}
                        >
                            {t('transactions.expense')}
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => handleTypeChange('income')}
                        style={[
                            styles.toggleBtn,
                            formData.type === 'income' && {
                                backgroundColor: colors.background,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.toggleText,
                                {
                                    color:
                                        formData.type === 'income'
                                            ? colors.foreground
                                            : colors.mutedForeground,
                                },
                            ]}
                        >
                            {t('transactions.income')}
                        </Text>
                    </Pressable>
                </View>

                {/* Amount Input */}
                <View style={styles.field}>
                    <Text
                        style={[
                            styles.label,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        {t('transactions.amount')}
                    </Text>
                    <View
                        style={[
                            styles.amountBox,
                            {
                                backgroundColor: hexWithOpacity(colors.muted, 0.65),
                                borderColor: hexWithOpacity(colors.border, 0.7),
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.currencySymbol,
                                { color: colors.mutedForeground },
                            ]}
                        >
                            {currencySymbol}
                        </Text>
                        <TextInput
                            value={formData.amount}
                            onChangeText={(text) =>
                                setFormData((prev) => ({ ...prev, amount: text }))
                            }
                            placeholder="0.00"
                            placeholderTextColor={hexWithOpacity(
                                colors.mutedForeground,
                                0.45
                            )}
                            keyboardType="decimal-pad"
                            style={[
                                styles.amountInput,
                                { color: colors.foreground },
                            ]}
                        />
                    </View>
                </View>

                {/* Account Selection */}
                <View style={styles.field}>
                    <Text
                        style={[
                            styles.label,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        {t('accounts.title')}
                    </Text>
                    <PremiumSelect
                        value={formData.account_id}
                        onChange={(val) =>
                            setFormData((prev) => ({
                                ...prev,
                                account_id: Number(val),
                            }))
                        }
                        placeholder={t('accounts.select_account')}
                        style={styles.selectPad}
                        options={accounts.map((acc) => ({
                            value: acc.id,
                            label: acc.name,
                            secondaryLabel: formatCurrency(
                                acc.balance,
                                acc.currency
                            ),
                        }))}
                    />
                </View>

                {/* Category Selection */}
                <View style={styles.field}>
                    <View style={styles.categoryHeader}>
                        <Text
                            style={[
                                styles.label,
                                { color: colors.mutedForeground },
                            ]}
                        >
                            {t('transactions.category')}
                        </Text>
                        <Pressable
                            onPress={() =>
                                setIsAddingCategory(!isAddingCategory)
                            }
                            style={styles.addCatLink}
                            hitSlop={8}
                        >
                            <Plus size={13} color={colors.primary} />
                            <Text
                                style={[
                                    styles.addCatText,
                                    { color: colors.primary },
                                ]}
                            >
                                {t('common.add')}
                            </Text>
                        </Pressable>
                    </View>

                    {isAddingCategory ? (
                        <View style={styles.newCatRow}>
                            <TextInput
                                value={newCategoryName}
                                onChangeText={setNewCategoryName}
                                placeholder="New Category Name"
                                placeholderTextColor={hexWithOpacity(
                                    colors.mutedForeground,
                                    0.5
                                )}
                                autoFocus
                                style={[
                                    styles.newCatInput,
                                    {
                                        backgroundColor: hexWithOpacity(
                                            colors.muted,
                                            0.6
                                        ),
                                        color: colors.foreground,
                                    },
                                ]}
                            />
                            <Pressable
                                onPress={handleCreateCategory}
                                disabled={createCategory.isPending}
                                style={[
                                    styles.newCatBtn,
                                    { backgroundColor: colors.primary },
                                ]}
                            >
                                {createCategory.isPending ? (
                                    <ActivityIndicator
                                        size="small"
                                        color={colors.primaryForeground}
                                    />
                                ) : (
                                    <Check
                                        size={18}
                                        color={colors.primaryForeground}
                                    />
                                )}
                            </Pressable>
                        </View>
                    ) : (
                        <PremiumSelect
                            value={formData.category_id}
                            onChange={(val) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    category_id: Number(val),
                                }))
                            }
                            placeholder={t('transactions.select_category')}
                            style={styles.selectPad}
                            options={[
                                {
                                    value: 0,
                                    label: t('transactions.select_category'),
                                },
                                ...filteredCategories.map((cat) => ({
                                    value: cat.id,
                                    label: cat.name,
                                })),
                            ]}
                        />
                    )}
                </View>

                {/* Description Input */}
                <View style={styles.field}>
                    <Text
                        style={[
                            styles.label,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        {t('transactions.description')}
                    </Text>
                    <TextInput
                        value={formData.description}
                        onChangeText={(text) =>
                            setFormData((prev) => ({
                                ...prev,
                                description: text,
                            }))
                        }
                        placeholder={t('transactions.description_placeholder')}
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

                {/* Submit Button */}
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
                        {t('transactions.save')}
                    </Text>
                </Pressable>
            </View>
        </ModalWrapper>
    );
}

const styles = StyleSheet.create({
    form: {
        gap: 20,
    },
    errorBanner: {
        padding: 10,
        borderRadius: 12,
    },
    errorText: {
        fontSize: 13,
        fontFamily: FONT_FAMILY.medium,
        textAlign: 'center',
    },
    toggleWrap: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 12,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    toggleText: {
        fontSize: 14,
        fontFamily: FONT_FAMILY.medium,
    },
    field: {
        gap: 6,
    },
    label: {
        fontSize: 12,
        fontFamily: FONT_FAMILY.medium,
    },
    amountBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
    },
    currencySymbol: {
        fontSize: 22,
        fontFamily: FONT_FAMILY.bold,
    },
    amountInput: {
        flex: 1,
        fontSize: 28,
        fontFamily: FONT_FAMILY.bold,
        paddingVertical: 4,
    },
    selectPad: {
        paddingVertical: 13,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    addCatLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    addCatText: {
        fontSize: 12,
        fontFamily: FONT_FAMILY.bold,
    },
    newCatRow: {
        flexDirection: 'row',
        gap: 8,
    },
    newCatInput: {
        flex: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        fontFamily: FONT_FAMILY.medium,
    },
    newCatBtn: {
        paddingHorizontal: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 13,
        fontSize: 15,
        fontFamily: FONT_FAMILY.medium,
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
});
