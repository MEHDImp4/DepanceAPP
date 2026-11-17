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
import {
    Check,
    Building,
    Wallet,
    CreditCard,
    PiggyBank,
    Trash2,
    AlertTriangle,
} from 'lucide-react-native';
import { isAxiosError } from 'axios';
import type { Account } from '@/types';
import { useDeleteAccount } from '@/hooks/use-api';
import { useThemeStore } from '@/store/theme-store';
import { FONT_FAMILY, hexWithOpacity, resolveColorHex } from '@/constants/theme';
import { ModalWrapper } from '@/components/ui/ModalWrapper';
import { PremiumSelect } from '@/components/ui/PremiumSelect';

interface AddAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (account: Omit<Account, 'id'> | Account) => void;
    account?: Account | null;
}

const COLORS = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-emerald-500',
    'bg-lime-500',
    'bg-pink-500',
    'bg-rose-500',
    'bg-slate-500',
];

const TYPES = [
    { value: 'bank', icon: Building },
    { value: 'cash', icon: Wallet },
    { value: 'credit', icon: CreditCard },
    { value: 'savings', icon: PiggyBank },
];

const CURRENCY_OPTIONS = [
    { label: 'USD ($)', value: 'USD' },
    { label: 'EUR (€)', value: 'EUR' },
    { label: 'GBP (£)', value: 'GBP' },
    { label: 'MAD (DH)', value: 'MAD' },
    { label: 'JPY (¥)', value: 'JPY' },
    { label: 'CAD ($)', value: 'CAD' },
    { label: 'CHF (Fr)', value: 'CHF' },
    { label: 'AUD ($)', value: 'AUD' },
    { label: 'CNY (¥)', value: 'CNY' },
];

export function AddAccountModal({
    isOpen,
    onClose,
    onAdd,
    account,
}: AddAccountModalProps) {
    const { t } = useTranslation();
    const colors = useThemeStore((state) => state.colors);
    const deleteAccount = useDeleteAccount();

    const [name, setName] = useState('');
    const [balance, setBalance] = useState('');
    const [type, setType] = useState('bank');
    const [currency, setCurrency] = useState('USD');
    const [color, setColor] = useState('bg-blue-500');
    const [isDeleting, setIsDeleting] = useState(false);
    const [password, setPassword] = useState('');
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        if (account) {
            setName(account.name);
            setBalance(account.balance.toString());
            setType(account.type);
            setCurrency(account.currency);
            setColor(account.color || 'bg-blue-500');
        } else {
            setName('');
            setBalance('');
            setType('bank');
            setCurrency('USD');
            setColor('bg-blue-500');
        }
        setIsDeleting(false);
        setPassword('');
        setDeleteError(null);
        setFormError(null);
    }, [account, isOpen]);

    const handleSubmit = () => {
        if (!name.trim()) {
            setFormError('Account name is required');
            return;
        }
        setFormError(null);

        const accountData = {
            name: name.trim(),
            balance: parseFloat(balance.replace(',', '.')) || 0,
            type,
            currency,
            color,
        };

        if (account) {
            onAdd({ ...accountData, id: account.id });
        } else {
            onAdd(accountData);
        }

        onClose();
    };

    const handleDelete = () => {
        if (!account || !password) return;
        setDeleteError(null);

        deleteAccount.mutate(
            { id: account.id, password },
            {
                onSuccess: () => {
                    onClose();
                },
                onError: (error: unknown) => {
                    setDeleteError(
                        (isAxiosError<{ error?: string }>(error) &&
                            error.response?.data?.error) ||
                            'Failed to delete account'
                    );
                },
            }
        );
    };

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            title={
                account
                    ? t('accounts.edit_account') || 'Edit Account'
                    : t('accounts.add_account')
            }
        >
            {isDeleting ? (
                <View style={styles.deleteView}>
                    <View
                        style={[
                            styles.alertIconWrap,
                            { backgroundColor: colors.destructiveSoft },
                        ]}
                    >
                        <AlertTriangle size={32} color={colors.destructive} />
                    </View>
                    <View style={styles.deleteTextBlock}>
                        <Text
                            style={[
                                styles.deleteTitle,
                                { color: colors.foreground },
                            ]}
                        >
                            {t('common.confirm_delete') || 'Delete Account?'}
                        </Text>
                        <Text
                            style={[
                                styles.deleteDesc,
                                { color: colors.mutedForeground },
                            ]}
                        >
                            To delete this account, please enter your password. This
                            action cannot be undone.
                        </Text>
                    </View>

                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        placeholderTextColor={hexWithOpacity(
                            colors.mutedForeground,
                            0.6
                        )}
                        secureTextEntry
                        style={[
                            styles.input,
                            styles.centeredInput,
                            {
                                backgroundColor: hexWithOpacity(colors.muted, 0.6),
                                color: colors.foreground,
                            },
                        ]}
                    />

                    {deleteError ? (
                        <Text
                            style={[
                                styles.errorText,
                                { color: colors.destructive },
                            ]}
                        >
                            {deleteError}
                        </Text>
                    ) : null}

                    <View style={styles.deleteActions}>
                        <Pressable
                            onPress={() => setIsDeleting(false)}
                            style={[
                                styles.actionBtn,
                                { backgroundColor: colors.muted },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.actionBtnText,
                                    { color: colors.foreground },
                                ]}
                            >
                                Cancel
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={handleDelete}
                            disabled={deleteAccount.isPending || !password}
                            style={[
                                styles.actionBtn,
                                {
                                    backgroundColor: colors.destructive,
                                    opacity:
                                        deleteAccount.isPending || !password
                                            ? 0.5
                                            : 1,
                                },
                            ]}
                        >
                            {deleteAccount.isPending ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <>
                                    <Trash2 size={18} color="#FFFFFF" />
                                    <Text style={styles.actionBtnWhiteText}>
                                        Delete
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    </View>
                </View>
            ) : (
                <View style={styles.form}>
                    {formError ? (
                        <Text
                            style={[
                                styles.errorText,
                                { color: colors.destructive },
                            ]}
                        >
                            {formError}
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
                            placeholder="e.g. Chase Sapphire"
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

                    <View style={styles.rowTwoCols}>
                        <View style={styles.col}>
                            <Text
                                style={[
                                    styles.label,
                                    { color: colors.mutedForeground },
                                ]}
                            >
                                {t('common.amount') || 'Balance'}
                            </Text>
                            <TextInput
                                value={balance}
                                onChangeText={setBalance}
                                placeholder="0.00"
                                placeholderTextColor={hexWithOpacity(
                                    colors.mutedForeground,
                                    0.55
                                )}
                                keyboardType="decimal-pad"
                                editable={!account}
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: hexWithOpacity(
                                            colors.muted,
                                            0.6
                                        ),
                                        color: colors.foreground,
                                        opacity: account ? 0.5 : 1,
                                    },
                                ]}
                            />
                        </View>

                        <View style={styles.col}>
                            <Text
                                style={[
                                    styles.label,
                                    { color: colors.mutedForeground },
                                ]}
                            >
                                Currency
                            </Text>
                            <PremiumSelect
                                value={currency}
                                onChange={setCurrency}
                                options={CURRENCY_OPTIONS}
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
                            Type
                        </Text>
                        <View style={styles.typeGrid}>
                            {TYPES.map((tItem) => {
                                const isSelected = type === tItem.value;
                                return (
                                    <Pressable
                                        key={tItem.value}
                                        onPress={() => setType(tItem.value)}
                                        style={[
                                            styles.typeBtn,
                                            {
                                                borderColor: isSelected
                                                    ? colors.primary
                                                    : 'transparent',
                                                backgroundColor: isSelected
                                                    ? hexWithOpacity(
                                                          colors.primary,
                                                          0.08
                                                      )
                                                    : hexWithOpacity(
                                                          colors.muted,
                                                          0.6
                                                      ),
                                            },
                                        ]}
                                    >
                                        <tItem.icon
                                            size={22}
                                            color={
                                                isSelected
                                                    ? colors.primary
                                                    : colors.mutedForeground
                                            }
                                        />
                                        <Text
                                            style={[
                                                styles.typeText,
                                                {
                                                    color: isSelected
                                                        ? colors.primary
                                                        : colors.mutedForeground,
                                                },
                                            ]}
                                        >
                                            {tItem.value}
                                        </Text>
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
                            {COLORS.map((c, idx) => {
                                const isSelected = color === c;
                                return (
                                    <Pressable
                                        key={`${c}-${idx}`}
                                        onPress={() => setColor(c)}
                                        style={[
                                            styles.colorSwatch,
                                            {
                                                backgroundColor:
                                                    resolveColorHex(c),
                                                borderColor: isSelected
                                                    ? colors.primary
                                                    : 'transparent',
                                                borderWidth: isSelected ? 3 : 0,
                                                transform: [
                                                    { scale: isSelected ? 1.08 : 1 },
                                                ],
                                            },
                                        ]}
                                    />
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
                            {account
                                ? t('common.save') || 'Save Changes'
                                : t('accounts.add_account') || 'Add Account'}
                        </Text>
                    </Pressable>

                    {account ? (
                        <Pressable
                            onPress={() => setIsDeleting(true)}
                            style={({ pressed }) => [
                                styles.deleteTriggerBtn,
                                {
                                    backgroundColor: colors.destructiveSoft,
                                    opacity: pressed ? 0.85 : 1,
                                },
                            ]}
                        >
                            <Trash2 size={20} color={colors.destructive} />
                            <Text
                                style={[
                                    styles.deleteTriggerText,
                                    { color: colors.destructive },
                                ]}
                            >
                                {t('common.delete') || 'Delete Account'}
                            </Text>
                        </Pressable>
                    ) : null}
                </View>
            )}
        </ModalWrapper>
    );
}

const styles = StyleSheet.create({
    form: {
        gap: 20,
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
    centeredInput: {
        textAlign: 'center',
    },
    rowTwoCols: {
        flexDirection: 'row',
        gap: 12,
    },
    col: {
        flex: 1,
        gap: 8,
    },
    selectPad: {
        paddingVertical: 13,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeBtn: {
        width: '31%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 2,
        gap: 4,
    },
    typeText: {
        fontSize: 12,
        fontFamily: FONT_FAMILY.medium,
        textTransform: 'capitalize',
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    colorSwatch: {
        width: '14%',
        aspectRatio: 1,
        borderRadius: 999,
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
    deleteTriggerBtn: {
        paddingVertical: 16,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    deleteTriggerText: {
        fontSize: 15,
        fontFamily: FONT_FAMILY.bold,
    },
    deleteView: {
        alignItems: 'center',
        gap: 20,
    },
    alertIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteTextBlock: {
        alignItems: 'center',
        gap: 6,
    },
    deleteTitle: {
        fontSize: 18,
        fontFamily: FONT_FAMILY.bold,
    },
    deleteDesc: {
        fontSize: 14,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 13,
        fontFamily: FONT_FAMILY.bold,
        textAlign: 'center',
    },
    deleteActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    actionBtnText: {
        fontSize: 15,
        fontFamily: FONT_FAMILY.bold,
    },
    actionBtnWhiteText: {
        fontSize: 15,
        fontFamily: FONT_FAMILY.bold,
        color: '#FFFFFF',
    },
});
