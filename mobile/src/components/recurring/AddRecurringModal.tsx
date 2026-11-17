import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    Platform,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import DateTimePicker, {
    type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { Check, Calendar } from 'lucide-react-native';
import { isAxiosError } from 'axios';
import {
    useCategories,
    useAccounts,
    useCreateRecurring,
} from '@/hooks/use-api';
import { formatCurrency, getCurrencySymbol } from '@/hooks/use-currency';
import { useThemeStore } from '@/store/theme-store';
import { FONT_FAMILY, hexWithOpacity } from '@/constants/theme';
import { ModalWrapper } from '@/components/ui/ModalWrapper';
import { PremiumSelect } from '@/components/ui/PremiumSelect';

interface AddRecurringModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddRecurringModal({ isOpen, onClose }: AddRecurringModalProps) {
    const { t } = useTranslation();
    const colors = useThemeStore((state) => state.colors);
    const { data: categories = [] } = useCategories();
    const { data: accounts = [] } = useAccounts();
    const createRecurring = useCreateRecurring();

    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [interval, setInterval] = useState<'weekly' | 'monthly' | 'yearly'>(
        'monthly'
    );
    const [categoryId, setCategoryId] = useState<number>(0);
    const [accountId, setAccountId] = useState<number>(0);
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (accounts.length > 0 && accountId === 0) {
            setAccountId(accounts[0].id);
        }
    }, [accounts, accountId]);

    const resetForm = () => {
        setDescription('');
        setAmount('');
        setType('expense');
        setInterval('monthly');
        setCategoryId(0);
        setAccountId(accounts[0]?.id || 0);
        setStartDate(new Date());
        setShowDatePicker(false);
        setError('');
    };

    const handleTypeSwitch = (nextType: 'income' | 'expense') => {
        setType(nextType);
        const stillMatches = categories.some(
            (c) => c.id === categoryId && c.type === nextType
        );
        if (!stillMatches) setCategoryId(0);
    };

    const handleDateChange = (
        event: DateTimePickerEvent,
        selected?: Date
    ) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (event.type !== 'dismissed' && selected) {
            setStartDate(selected);
        }
    };

    const handleSubmit = () => {
        if (!accountId) {
            setError(t('accounts.select_account'));
            return;
        }
        const parsedAmount = parseFloat(amount.replace(',', '.'));
        if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
            setError('Amount must be positive');
            return;
        }
        if (!description.trim()) {
            setError('Description is required');
            return;
        }
        setError('');

        createRecurring.mutate(
            {
                description: description.trim(),
                amount: parsedAmount,
                type,
                interval,
                start_date: startDate.toISOString(),
                account_id: accountId,
                category_id: categoryId > 0 ? categoryId : null,
            },
            {
                onSuccess: () => {
                    onClose();
                    resetForm();
                },
                onError: (err: unknown) => {
                    setError(
                        (isAxiosError<{ error?: string }>(err) &&
                            err.response?.data?.error) ||
                            'Failed to create recurring transaction'
                    );
                },
            }
        );
    };

    const selectedAccount = accounts.find((a) => a.id === accountId);
    const currencySymbol = getCurrencySymbol(selectedAccount?.currency || 'USD');
    const filteredCategories = categories.filter((c) => c.type === type);

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            title={t('recurring.add_title') || 'Add Recurring Transaction'}
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
                        onPress={() => handleTypeSwitch('expense')}
                        style={[
                            styles.toggleBtn,
                            type === 'expense' && {
                                backgroundColor: colors.background,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.toggleText,
                                {
                                    color:
                                        type === 'expense'
                                            ? colors.foreground
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
                            styles.toggleBtn,
                            type === 'income' && {
                                backgroundColor: colors.background,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.toggleText,
                                {
                                    color:
                                        type === 'income'
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
                            value={amount}
                            onChangeText={setAmount}
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

                {/* Interval & Start Date */}
                <View style={styles.rowTwoCols}>
                    <View style={styles.col}>
                        <Text
                            style={[
                                styles.label,
                                { color: colors.mutedForeground },
                            ]}
                        >
                            {t('recurring.interval')}
                        </Text>
                        <PremiumSelect
                            value={interval}
                            onChange={setInterval}
                            options={[
                                { value: 'weekly', label: t('recurring.weekly') },
                                {
                                    value: 'monthly',
                                    label: t('recurring.monthly'),
                                },
                                { value: 'yearly', label: t('recurring.yearly') },
                            ]}
                            style={styles.selectPad}
                        />
                    </View>

                    <View style={styles.col}>
                        <Text
                            style={[
                                styles.label,
                                { color: colors.mutedForeground },
                            ]}
                        >
                            {t('recurring.start_date')}
                        </Text>
                        <Pressable
                            onPress={() => setShowDatePicker((prev) => !prev)}
                            style={[
                                styles.dateBtn,
                                {
                                    backgroundColor: hexWithOpacity(
                                        colors.muted,
                                        0.6
                                    ),
                                },
                            ]}
                        >
                            <Calendar
                                size={15}
                                color={colors.mutedForeground}
                            />
                            <Text
                                style={[
                                    styles.dateBtnText,
                                    { color: colors.foreground },
                                ]}
                            >
                                {startDate.toISOString().split('T')[0]}
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {showDatePicker ? (
                    <View style={styles.pickerWrap}>
                        <DateTimePicker
                            value={startDate}
                            mode="date"
                            display={
                                Platform.OS === 'ios' ? 'spinner' : 'default'
                            }
                            themeVariant={colors.mode}
                            onChange={handleDateChange}
                        />
                        {Platform.OS === 'ios' ? (
                            <Pressable
                                onPress={() => setShowDatePicker(false)}
                                style={[
                                    styles.doneBtn,
                                    { backgroundColor: colors.primary },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.doneBtnText,
                                        { color: colors.primaryForeground },
                                    ]}
                                >
                                    Done
                                </Text>
                            </Pressable>
                        ) : null}
                    </View>
                ) : null}

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
                        value={accountId}
                        onChange={(val) => setAccountId(Number(val))}
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
                    <Text
                        style={[
                            styles.label,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        {t('transactions.category')}
                    </Text>
                    <PremiumSelect
                        value={categoryId}
                        onChange={(val) => setCategoryId(Number(val))}
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
                        value={description}
                        onChangeText={setDescription}
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
                    disabled={createRecurring.isPending}
                    style={({ pressed }) => [
                        styles.submitBtn,
                        {
                            backgroundColor: colors.primary,
                            opacity: createRecurring.isPending
                                ? 0.5
                                : pressed
                                ? 0.9
                                : 1,
                        },
                    ]}
                >
                    {createRecurring.isPending ? (
                        <ActivityIndicator color={colors.primaryForeground} />
                    ) : (
                        <>
                            <Check size={20} color={colors.primaryForeground} />
                            <Text
                                style={[
                                    styles.submitText,
                                    { color: colors.primaryForeground },
                                ]}
                            >
                                {t('recurring.create_button') ||
                                    'Create Recurring'}
                            </Text>
                        </>
                    )}
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
    rowTwoCols: {
        flexDirection: 'row',
        gap: 12,
    },
    col: {
        flex: 1,
        gap: 6,
    },
    selectPad: {
        paddingVertical: 12,
    },
    dateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    dateBtnText: {
        fontSize: 14,
        fontFamily: FONT_FAMILY.semibold,
    },
    pickerWrap: {
        gap: 8,
    },
    doneBtn: {
        alignSelf: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    doneBtnText: {
        fontSize: 13,
        fontFamily: FONT_FAMILY.bold,
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
