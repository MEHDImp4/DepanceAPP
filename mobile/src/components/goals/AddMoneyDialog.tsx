import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { Check, Wallet, Plus } from 'lucide-react-native';
import type { Goal } from '@/types';
import { useUpdateGoal, useAccounts } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth-store';
import { useThemeStore } from '@/store/theme-store';
import { formatCurrency } from '@/hooks/use-currency';
import { FONT_FAMILY, hexWithOpacity } from '@/constants/theme';
import { ModalWrapper } from '@/components/ui/ModalWrapper';

interface AddMoneyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    goal: Goal | null;
}

export function AddMoneyDialog({ isOpen, onClose, goal }: AddMoneyDialogProps) {
    const user = useAuthStore((state) => state.user);
    const colors = useThemeStore((state) => state.colors);
    const currency = user?.currency || 'USD';
    const { mutate: updateGoal, isPending } = useUpdateGoal();
    const { data: accounts = [] } = useAccounts();

    const [amount, setAmount] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
        null
    );

    useEffect(() => {
        if (!isOpen) {
            setAmount('');
            setSelectedAccountId(null);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (!goal || !amount) return;
        const value = parseFloat(amount.replace(',', '.'));
        if (Number.isNaN(value) || value <= 0) return;

        updateGoal(
            {
                id: goal.id,
                currentAmount: goal.currentAmount + value,
            },
            {
                onSuccess: () => {
                    onClose();
                },
            }
        );
    };

    const handleQuickAdd = (value: number) => {
        setAmount(value.toString());
    };

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            title="Add Money"
            subtitle={`Fund your ${goal?.name || ''}`}
            surfaceColor={colors.modalSurface}
        >
            <View style={styles.form}>
                <View style={styles.amountHero}>
                    <TextInput
                        value={amount}
                        onChangeText={setAmount}
                        placeholder="0"
                        placeholderTextColor={hexWithOpacity(
                            colors.mutedForeground,
                            0.25
                        )}
                        keyboardType="decimal-pad"
                        autoFocus
                        style={[
                            styles.bigInput,
                            { color: colors.foreground },
                        ]}
                    />
                    <Text
                        style={[
                            styles.currencyLabel,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        {currency}
                    </Text>
                </View>

                <View style={styles.quickRow}>
                    {[10, 20, 50, 100].map((val) => (
                        <Pressable
                            key={val}
                            onPress={() => handleQuickAdd(val)}
                            style={({ pressed }) => [
                                styles.quickChip,
                                {
                                    backgroundColor: pressed
                                        ? colors.muted
                                        : colors.whiteSubtle,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.quickText,
                                    { color: colors.foreground },
                                ]}
                            >
                                +{val}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                <View style={styles.accountsBlock}>
                    <Text
                        style={[
                            styles.sectionLabel,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        Source Account (Optional)
                    </Text>
                    <ScrollView
                        style={styles.accountsList}
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.accountsGap}>
                            {accounts.map((acc) => {
                                const isSelected = selectedAccountId === acc.id;
                                return (
                                    <Pressable
                                        key={acc.id}
                                        onPress={() =>
                                            setSelectedAccountId(
                                                isSelected ? null : acc.id
                                            )
                                        }
                                        style={[
                                            styles.accountRow,
                                            {
                                                backgroundColor: isSelected
                                                    ? hexWithOpacity(
                                                          colors.primary,
                                                          0.2
                                                      )
                                                    : colors.whiteSubtle,
                                                borderColor: isSelected
                                                    ? hexWithOpacity(
                                                          colors.primary,
                                                          0.5
                                                      )
                                                    : 'transparent',
                                            },
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.accIcon,
                                                {
                                                    backgroundColor:
                                                        colors.whiteSubtle,
                                                },
                                            ]}
                                        >
                                            <Wallet
                                                size={16}
                                                color={colors.foreground}
                                            />
                                        </View>
                                        <View style={styles.accInfo}>
                                            <Text
                                                style={[
                                                    styles.accName,
                                                    { color: colors.foreground },
                                                ]}
                                            >
                                                {acc.name}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.accBalance,
                                                    {
                                                        color: colors.mutedForeground,
                                                    },
                                                ]}
                                            >
                                                {formatCurrency(
                                                    acc.balance,
                                                    currency
                                                )}
                                            </Text>
                                        </View>
                                        {isSelected ? (
                                            <Check
                                                size={16}
                                                color={colors.primary}
                                            />
                                        ) : null}
                                    </Pressable>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>

                <Pressable
                    onPress={handleSubmit}
                    disabled={!amount || isPending}
                    style={({ pressed }) => [
                        styles.submitBtn,
                        {
                            backgroundColor: colors.primary,
                            opacity:
                                !amount || isPending
                                    ? 0.5
                                    : pressed
                                    ? 0.9
                                    : 1,
                        },
                    ]}
                >
                    {isPending ? (
                        <ActivityIndicator color={colors.primaryForeground} />
                    ) : (
                        <>
                            <Plus size={20} color={colors.primaryForeground} />
                            <Text
                                style={[
                                    styles.submitText,
                                    { color: colors.primaryForeground },
                                ]}
                            >
                                Add Details
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
    amountHero: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    bigInput: {
        minWidth: 140,
        fontSize: 48,
        fontFamily: FONT_FAMILY.bold,
        textAlign: 'center',
    },
    currencyLabel: {
        fontSize: 14,
        fontFamily: FONT_FAMILY.bold,
        marginTop: 6,
    },
    quickRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    quickChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    quickText: {
        fontSize: 14,
        fontFamily: FONT_FAMILY.bold,
    },
    accountsBlock: {
        gap: 8,
    },
    sectionLabel: {
        fontSize: 11,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        paddingHorizontal: 4,
    },
    accountsList: {
        maxHeight: 140,
    },
    accountsGap: {
        gap: 8,
    },
    accountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    accIcon: {
        padding: 8,
        borderRadius: 8,
    },
    accInfo: {
        flex: 1,
    },
    accName: {
        fontSize: 14,
        fontFamily: FONT_FAMILY.bold,
    },
    accBalance: {
        fontSize: 12,
    },
    submitBtn: {
        paddingVertical: 16,
        borderRadius: 16,
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
