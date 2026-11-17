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
import {
    Check,
    Target,
    Calendar,
    Sparkles,
    Coins,
    Palette,
    X,
} from 'lucide-react-native';
import type { Goal } from '@/types';
import { useCreateGoal, useUpdateGoal } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth-store';
import { useThemeStore } from '@/store/theme-store';
import { FONT_FAMILY, hexWithOpacity, resolveColorHex } from '@/constants/theme';
import { ModalWrapper } from '@/components/ui/ModalWrapper';

interface CreateGoalDialogProps {
    isOpen: boolean;
    onClose: () => void;
    goalToEdit?: Goal | null;
}

const COLORS = [
    { name: 'Blue', value: 'bg-blue-500' },
    { name: 'Teal', value: 'bg-teal-500' },
    { name: 'Green', value: 'bg-green-500' },
    { name: 'Amber', value: 'bg-amber-500' },
    { name: 'Red', value: 'bg-red-500' },
    { name: 'Pink', value: 'bg-pink-500' },
];

const ICONS = [
    '🎯',
    '✈️',
    '🚗',
    '🏠',
    '💻',
    '🎓',
    '🎮',
    '🎁',
    '🗼',
    '⛵',
    '🏔️',
    '💍',
];

export function CreateGoalDialog({
    isOpen,
    onClose,
    goalToEdit,
}: CreateGoalDialogProps) {
    const user = useAuthStore((state) => state.user);
    const colors = useThemeStore((state) => state.colors);
    const currency = user?.currency || 'USD';
    const { mutate: createGoal, isPending: isCreating } = useCreateGoal();
    const { mutate: updateGoal, isPending: isUpdating } = useUpdateGoal();

    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [currentAmount, setCurrentAmount] = useState('');
    const [deadline, setDeadline] = useState<string>('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
    const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
    const [error, setError] = useState('');

    const resetForm = () => {
        setName('');
        setTargetAmount('');
        setCurrentAmount('');
        setDeadline('');
        setShowDatePicker(false);
        setSelectedColor(COLORS[0].value);
        setSelectedIcon(ICONS[0]);
        setError('');
    };

    useEffect(() => {
        setError('');
        setShowDatePicker(false);
        if (goalToEdit) {
            setName(goalToEdit.name);
            setTargetAmount(goalToEdit.targetAmount.toString());
            setCurrentAmount(goalToEdit.currentAmount.toString());
            setDeadline(
                goalToEdit.deadline
                    ? new Date(goalToEdit.deadline).toISOString().split('T')[0]
                    : ''
            );
            setSelectedColor(goalToEdit.color || COLORS[0].value);
            setSelectedIcon(goalToEdit.icon || ICONS[0]);
        } else {
            resetForm();
        }
    }, [goalToEdit, isOpen]);

    const handleDateChange = (
        event: DateTimePickerEvent,
        selected?: Date
    ) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (event.type !== 'dismissed' && selected) {
            setDeadline(selected.toISOString().split('T')[0]);
        }
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            setError('Goal name is required');
            return;
        }
        const parsedTarget = parseFloat(targetAmount.replace(',', '.'));
        if (Number.isNaN(parsedTarget) || parsedTarget < 1) {
            setError('Target amount must be at least 1');
            return;
        }
        const parsedCurrent = currentAmount
            ? parseFloat(currentAmount.replace(',', '.'))
            : 0;
        if (Number.isNaN(parsedCurrent) || parsedCurrent < 0) {
            setError('Current progress must be 0 or greater');
            return;
        }
        setError('');

        const payload = {
            name: name.trim(),
            targetAmount: parsedTarget,
            currentAmount: parsedCurrent,
            deadline: deadline ? new Date(deadline).toISOString() : null,
            color: selectedColor,
            icon: selectedIcon,
        };

        if (goalToEdit) {
            updateGoal(
                { id: goalToEdit.id, ...payload },
                {
                    onSuccess: () => {
                        onClose();
                        resetForm();
                    },
                }
            );
        } else {
            createGoal(payload, {
                onSuccess: () => {
                    onClose();
                    resetForm();
                },
            });
        }
    };

    const isPending = isCreating || isUpdating;

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            title={goalToEdit ? 'Edit Goal' : 'New Goal'}
            subtitle={goalToEdit ? 'Refine your target' : 'Start your journey'}
            surfaceColor={colors.modalSurface}
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

                {/* Section 1: Basic Info */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Sparkles size={15} color={colors.primary} />
                        <Text
                            style={[
                                styles.sectionTitle,
                                { color: colors.primary },
                            ]}
                        >
                            Basics
                        </Text>
                    </View>
                    <View style={styles.field}>
                        <Text
                            style={[
                                styles.label,
                                { color: colors.mutedForeground },
                            ]}
                        >
                            Goal Name
                        </Text>
                        <View
                            style={[
                                styles.iconInputWrap,
                                {
                                    backgroundColor: colors.whiteSubtle,
                                    borderColor: colors.whiteBorder,
                                },
                            ]}
                        >
                            <Target
                                size={18}
                                color={hexWithOpacity(colors.mutedForeground, 0.6)}
                            />
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g. Dream Wedding"
                                placeholderTextColor={hexWithOpacity(
                                    colors.mutedForeground,
                                    0.4
                                )}
                                style={[
                                    styles.flexInput,
                                    { color: colors.foreground },
                                ]}
                            />
                        </View>
                    </View>
                </View>

                {/* Section 2: Financials */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Coins size={15} color={colors.primary} />
                        <Text
                            style={[
                                styles.sectionTitle,
                                { color: colors.primary },
                            ]}
                        >
                            Target
                        </Text>
                    </View>
                    <View style={styles.rowTwoCols}>
                        <View style={styles.col}>
                            <Text
                                style={[
                                    styles.label,
                                    { color: colors.mutedForeground },
                                ]}
                            >
                                Target Amount
                            </Text>
                            <View
                                style={[
                                    styles.currencyInputWrap,
                                    {
                                        backgroundColor: colors.whiteSubtle,
                                        borderColor: colors.whiteBorder,
                                    },
                                ]}
                            >
                                <TextInput
                                    value={targetAmount}
                                    onChangeText={setTargetAmount}
                                    placeholder="0"
                                    placeholderTextColor={hexWithOpacity(
                                        colors.mutedForeground,
                                        0.4
                                    )}
                                    keyboardType="decimal-pad"
                                    style={[
                                        styles.flexInput,
                                        { color: colors.foreground },
                                    ]}
                                />
                                <Text
                                    style={[
                                        styles.currencyTag,
                                        {
                                            color: hexWithOpacity(
                                                colors.mutedForeground,
                                                0.6
                                            ),
                                        },
                                    ]}
                                >
                                    {currency}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.col}>
                            <Text
                                style={[
                                    styles.label,
                                    { color: colors.mutedForeground },
                                ]}
                            >
                                Current Progress
                            </Text>
                            <View
                                style={[
                                    styles.currencyInputWrap,
                                    {
                                        backgroundColor: colors.whiteSubtle,
                                        borderColor: colors.whiteBorder,
                                    },
                                ]}
                            >
                                <TextInput
                                    value={currentAmount}
                                    onChangeText={setCurrentAmount}
                                    placeholder="0"
                                    placeholderTextColor={hexWithOpacity(
                                        colors.mutedForeground,
                                        0.4
                                    )}
                                    keyboardType="decimal-pad"
                                    style={[
                                        styles.flexInput,
                                        { color: colors.foreground },
                                    ]}
                                />
                                <Text
                                    style={[
                                        styles.currencyTag,
                                        {
                                            color: hexWithOpacity(
                                                colors.mutedForeground,
                                                0.6
                                            ),
                                        },
                                    ]}
                                >
                                    {currency}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.field}>
                        <Text
                            style={[
                                styles.label,
                                { color: colors.mutedForeground },
                            ]}
                        >
                            Deadline{' '}
                            <Text style={{ opacity: 0.5 }}>(Optional)</Text>
                        </Text>
                        <View style={styles.deadlineRow}>
                            <Pressable
                                onPress={() =>
                                    setShowDatePicker((prev) => !prev)
                                }
                                style={[
                                    styles.iconInputWrap,
                                    {
                                        flex: 1,
                                        backgroundColor: colors.whiteSubtle,
                                        borderColor: colors.whiteBorder,
                                    },
                                ]}
                            >
                                <Calendar
                                    size={18}
                                    color={hexWithOpacity(
                                        colors.mutedForeground,
                                        0.6
                                    )}
                                />
                                <Text
                                    style={[
                                        styles.dateLabel,
                                        {
                                            color: deadline
                                                ? colors.foreground
                                                : hexWithOpacity(
                                                      colors.mutedForeground,
                                                      0.4
                                                  ),
                                        },
                                    ]}
                                >
                                    {deadline || 'YYYY-MM-DD'}
                                </Text>
                            </Pressable>
                            {deadline ? (
                                <Pressable
                                    onPress={() => setDeadline('')}
                                    style={[
                                        styles.clearDateBtn,
                                        { backgroundColor: colors.whiteSubtle },
                                    ]}
                                >
                                    <X
                                        size={16}
                                        color={colors.mutedForeground}
                                    />
                                </Pressable>
                            ) : null}
                        </View>

                        {showDatePicker ? (
                            <View style={styles.pickerWrap}>
                                <DateTimePicker
                                    value={
                                        deadline
                                            ? new Date(deadline)
                                            : new Date()
                                    }
                                    mode="date"
                                    display={
                                        Platform.OS === 'ios'
                                            ? 'spinner'
                                            : 'default'
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
                                                {
                                                    color: colors.primaryForeground,
                                                },
                                            ]}
                                        >
                                            Done
                                        </Text>
                                    </Pressable>
                                ) : null}
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* Section 3: Visuals */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Palette size={15} color={colors.primary} />
                        <Text
                            style={[
                                styles.sectionTitle,
                                { color: colors.primary },
                            ]}
                        >
                            Appearance
                        </Text>
                    </View>

                    <View style={styles.field}>
                        <Text
                            style={[
                                styles.label,
                                { color: colors.mutedForeground },
                            ]}
                        >
                            Theme Color
                        </Text>
                        <View style={styles.colorRow}>
                            {COLORS.map((c) => {
                                const isSelected = selectedColor === c.value;
                                return (
                                    <Pressable
                                        key={c.value}
                                        onPress={() =>
                                            setSelectedColor(c.value)
                                        }
                                        style={[
                                            styles.colorTile,
                                            {
                                                backgroundColor:
                                                    resolveColorHex(c.value),
                                                opacity: isSelected ? 1 : 0.45,
                                                borderColor: isSelected
                                                    ? '#FFFFFF'
                                                    : 'transparent',
                                                borderWidth: isSelected ? 2 : 0,
                                                transform: [
                                                    {
                                                        scale: isSelected
                                                            ? 1.08
                                                            : 1,
                                                    },
                                                ],
                                            },
                                        ]}
                                    >
                                        {isSelected ? (
                                            <Check
                                                size={14}
                                                color="#FFFFFF"
                                                strokeWidth={3.5}
                                            />
                                        ) : null}
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
                            Goal Icon
                        </Text>
                        <View style={styles.iconGrid}>
                            {ICONS.map((icon) => {
                                const isSelected = selectedIcon === icon;
                                return (
                                    <Pressable
                                        key={icon}
                                        onPress={() => setSelectedIcon(icon)}
                                        style={[
                                            styles.emojiTile,
                                            {
                                                backgroundColor: isSelected
                                                    ? hexWithOpacity(
                                                          colors.primary,
                                                          0.2
                                                      )
                                                    : hexWithOpacity(
                                                          colors.muted,
                                                          0.25
                                                      ),
                                                borderColor: isSelected
                                                    ? hexWithOpacity(
                                                          colors.primary,
                                                          0.5
                                                      )
                                                    : 'transparent',
                                                borderWidth: 1,
                                            },
                                        ]}
                                    >
                                        <Text style={styles.emojiOption}>
                                            {icon}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                </View>

                <Pressable
                    onPress={handleSubmit}
                    disabled={isPending}
                    style={({ pressed }) => [
                        styles.submitBtn,
                        {
                            backgroundColor: colors.primary,
                            opacity: isPending ? 0.7 : pressed ? 0.9 : 1,
                        },
                    ]}
                >
                    {isPending ? (
                        <ActivityIndicator color={colors.primaryForeground} />
                    ) : (
                        <>
                            <Check
                                size={22}
                                color={colors.primaryForeground}
                                strokeWidth={3}
                            />
                            <Text
                                style={[
                                    styles.submitText,
                                    { color: colors.primaryForeground },
                                ]}
                            >
                                {goalToEdit ? 'Save Changes' : 'Create Goal'}
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
        gap: 24,
    },
    errorText: {
        fontSize: 13,
        fontFamily: FONT_FAMILY.bold,
        textAlign: 'center',
    },
    section: {
        gap: 14,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 10,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    field: {
        gap: 6,
    },
    label: {
        fontSize: 12,
        fontFamily: FONT_FAMILY.bold,
        paddingHorizontal: 4,
    },
    iconInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    currencyInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    flexInput: {
        flex: 1,
        fontSize: 14,
        fontFamily: FONT_FAMILY.bold,
        paddingVertical: 0,
    },
    currencyTag: {
        fontSize: 12,
        fontFamily: FONT_FAMILY.bold,
    },
    rowTwoCols: {
        flexDirection: 'row',
        gap: 12,
    },
    col: {
        flex: 1,
        gap: 6,
    },
    deadlineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateLabel: {
        fontSize: 14,
        fontFamily: FONT_FAMILY.bold,
    },
    clearDateBtn: {
        width: 44,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pickerWrap: {
        gap: 8,
        marginTop: 4,
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
    colorRow: {
        flexDirection: 'row',
        gap: 10,
    },
    colorTile: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 10,
    },
    emojiTile: {
        width: '15%',
        aspectRatio: 1,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emojiOption: {
        fontSize: 20,
    },
    submitBtn: {
        paddingVertical: 18,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    submitText: {
        fontSize: 17,
        fontFamily: FONT_FAMILY.bold,
    },
});
