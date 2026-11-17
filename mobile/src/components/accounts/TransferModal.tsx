import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, ArrowRightLeft } from 'lucide-react-native';
import { isAxiosError } from 'axios';
import type { Account } from '@/types';
import { useCreateTransfer } from '@/hooks/use-api';
import { useThemeStore } from '@/store/theme-store';
import { FONT_FAMILY, hexWithOpacity } from '@/constants/theme';
import { ModalWrapper } from '@/components/ui/ModalWrapper';
import { PremiumSelect } from '@/components/ui/PremiumSelect';

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    accounts: Account[];
}

export function TransferModal({ isOpen, onClose, accounts }: TransferModalProps) {
    const { t } = useTranslation();
    const colors = useThemeStore((state) => state.colors);
    const createTransfer = useCreateTransfer();

    const [fromAccountId, setFromAccountId] = useState<number>(0);
    const [toAccountId, setToAccountId] = useState<number>(0);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFromAccountId(0);
            setToAccountId(0);
            setAmount('');
            setDescription('');
            setError('');
        }
    }, [isOpen]);

    const accountOptions = accounts.map((acc) => ({
        value: acc.id,
        label: acc.name,
        secondaryLabel: `${acc.balance.toFixed(2)} ${acc.currency}`,
    }));

    const handleSubmit = () => {
        setError('');

        if (!fromAccountId || !toAccountId) {
            setError('Please select both accounts');
            return;
        }

        if (fromAccountId === toAccountId) {
            setError('Cannot transfer to the same account');
            return;
        }

        const amountNum = parseFloat(amount.replace(',', '.'));
        if (Number.isNaN(amountNum) || amountNum <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        createTransfer.mutate(
            {
                from_account_id: fromAccountId,
                to_account_id: toAccountId,
                amount: amountNum,
                description: description.trim() || undefined,
            },
            {
                onSuccess: () => {
                    onClose();
                },
                onError: (err: unknown) => {
                    setError(
                        (isAxiosError<{ error?: string }>(err) &&
                            err.response?.data?.error) ||
                            'Transfer failed'
                    );
                },
            }
        );
    };

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            title={t('accounts.transfer_funds') || 'Transfer Funds'}
            headerIcon={<ArrowRightLeft size={22} color={colors.primary} />}
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

                <View style={styles.accountsSection}>
                    <View style={styles.field}>
                        <Text
                            style={[
                                styles.label,
                                { color: colors.mutedForeground },
                            ]}
                        >
                            {t('accounts.from_account') || 'From Account'}
                        </Text>
                        <PremiumSelect
                            value={fromAccountId}
                            onChange={(val) => setFromAccountId(Number(val))}
                            placeholder="Select source account"
                            options={accountOptions}
                            style={styles.selectPad}
                        />
                    </View>

                    <View style={styles.swapBadgeWrap}>
                        <View
                            style={[
                                styles.swapBadge,
                                {
                                    backgroundColor: colors.muted,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <ArrowRightLeft
                                size={16}
                                color={colors.mutedForeground}
                                style={{ transform: [{ rotate: '90deg' }] }}
                            />
                        </View>
                    </View>

                    <View style={styles.field}>
                        <Text
                            style={[
                                styles.label,
                                { color: colors.mutedForeground },
                            ]}
                        >
                            {t('accounts.to_account') || 'To Account'}
                        </Text>
                        <PremiumSelect
                            value={toAccountId}
                            onChange={(val) => setToAccountId(Number(val))}
                            placeholder="Select destination account"
                            options={accountOptions}
                            style={styles.selectPad}
                        />
                    </View>
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
                            0.55
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
                        {t('common.description') || 'Description (Optional)'}
                    </Text>
                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        placeholder="e.g. Monthly savings"
                        placeholderTextColor={hexWithOpacity(
                            colors.mutedForeground,
                            0.55
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

                <Pressable
                    onPress={handleSubmit}
                    disabled={createTransfer.isPending}
                    style={({ pressed }) => [
                        styles.submitBtn,
                        {
                            backgroundColor: colors.primary,
                            opacity: createTransfer.isPending
                                ? 0.5
                                : pressed
                                ? 0.9
                                : 1,
                        },
                    ]}
                >
                    {createTransfer.isPending ? (
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
                                {t('accounts.confirm_transfer') ||
                                    'Confirm Transfer'}
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
        padding: 12,
        borderRadius: 12,
    },
    errorText: {
        fontSize: 13,
        fontFamily: FONT_FAMILY.medium,
        textAlign: 'center',
    },
    accountsSection: {
        gap: 8,
    },
    field: {
        gap: 8,
    },
    label: {
        fontSize: 13,
        fontFamily: FONT_FAMILY.medium,
    },
    selectPad: {
        paddingVertical: 13,
    },
    swapBadgeWrap: {
        alignItems: 'center',
        marginVertical: 2,
    },
    swapBadge: {
        padding: 8,
        borderRadius: 999,
        borderWidth: 1,
    },
    input: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
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
