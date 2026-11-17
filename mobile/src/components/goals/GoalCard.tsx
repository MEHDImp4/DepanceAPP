import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Pencil, Trash2, Plus } from 'lucide-react-native';
import type { Goal } from '@/types';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatCurrency } from '@/hooks/use-currency';
import { useThemeStore } from '@/store/theme-store';
import { FONT_FAMILY, hexWithOpacity } from '@/constants/theme';

interface GoalCardProps {
    goal: Goal;
    onEdit: (goal: Goal) => void;
    onDelete: (id: number) => void;
    onAddMoney: (goal: Goal) => void;
}

export function GoalCard({
    goal,
    onEdit,
    onDelete,
    onAddMoney,
}: GoalCardProps) {
    const colors = useThemeStore((state) => state.colors);
    const currency = goal.currency || 'USD';

    const percentage =
        goal.targetAmount > 0
            ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
            : 0;
    const isCompleted = goal.currentAmount >= goal.targetAmount;

    const remaining = goal.targetAmount - goal.currentAmount;
    const monthsLeft = goal.deadline
        ? Math.max(
              1,
              (new Date(goal.deadline).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24 * 30)
          )
        : 1;
    const monthlySave = remaining / monthsLeft;

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.16,
                    shadowRadius: 16,
                    elevation: 5,
                },
            ]}
        >
            <View style={styles.topRow}>
                <View style={styles.titleLeft}>
                    <View
                        style={[
                            styles.emojiBox,
                            { backgroundColor: hexWithOpacity(colors.primary, 0.12) },
                        ]}
                    >
                        <Text style={styles.emoji}>{goal.icon || '🎯'}</Text>
                    </View>
                    <View style={styles.nameBlock}>
                        <Text
                            style={[styles.name, { color: colors.foreground }]}
                            numberOfLines={1}
                        >
                            {goal.name}
                        </Text>
                        {goal.deadline ? (
                            <Text
                                style={[
                                    styles.deadline,
                                    { color: hexWithOpacity(colors.mutedForeground, 0.7) },
                                ]}
                            >
                                Due {new Date(goal.deadline).toLocaleDateString()}
                            </Text>
                        ) : null}
                    </View>
                </View>

                <View style={styles.actionsRow}>
                    <Pressable
                        onPress={() => onEdit(goal)}
                        style={({ pressed }) => [
                            styles.iconBtn,
                            pressed && { backgroundColor: colors.muted },
                        ]}
                        hitSlop={6}
                        accessibilityLabel="Edit goal"
                    >
                        <Pencil size={16} color={colors.mutedForeground} />
                    </Pressable>
                    <Pressable
                        onPress={() => onDelete(goal.id)}
                        style={({ pressed }) => [
                            styles.iconBtn,
                            pressed && { backgroundColor: colors.redSoft },
                        ]}
                        hitSlop={6}
                        accessibilityLabel="Delete goal"
                    >
                        <Trash2 size={16} color={colors.red} />
                    </Pressable>
                </View>
            </View>

            <View style={styles.progressSection}>
                <View style={styles.progressLabels}>
                    <Text
                        style={[
                            styles.pctText,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        {percentage}%
                    </Text>
                    <Text style={styles.amountsText}>
                        <Text style={{ color: colors.foreground }}>
                            {formatCurrency(goal.currentAmount, currency)}
                        </Text>
                        <Text style={{ color: colors.mutedForeground }}>
                            {' '}
                            / {formatCurrency(goal.targetAmount, currency)}
                        </Text>
                    </Text>
                </View>

                <ProgressBar
                    value={goal.currentAmount}
                    max={goal.targetAmount}
                    color={
                        goal.color ||
                        (isCompleted ? 'bg-emerald-500' : 'bg-primary')
                    }
                />

                {!isCompleted && goal.deadline ? (
                    <View
                        style={[
                            styles.tipBox,
                            { backgroundColor: hexWithOpacity(colors.muted, 0.4) },
                        ]}
                    >
                        <Text style={styles.tipIcon}>💡</Text>
                        <Text
                            style={[
                                styles.tipText,
                                { color: colors.mutedForeground },
                            ]}
                        >
                            Save{' '}
                            <Text
                                style={{
                                    fontFamily: FONT_FAMILY.bold,
                                    color: colors.foreground,
                                }}
                            >
                                {formatCurrency(monthlySave, currency)}/mo
                            </Text>{' '}
                            to reach your goal on time.
                        </Text>
                    </View>
                ) : null}
            </View>

            <Pressable
                onPress={() => onAddMoney(goal)}
                disabled={isCompleted}
                style={({ pressed }) => [
                    styles.addFundsBtn,
                    {
                        backgroundColor: hexWithOpacity(colors.primary, 0.12),
                        opacity: isCompleted ? 0.5 : pressed ? 0.8 : 1,
                    },
                ]}
            >
                <Plus size={16} color={colors.primary} strokeWidth={2.5} />
                <Text style={[styles.addFundsText, { color: colors.primary }]}>
                    Add Funds
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 32,
        borderWidth: 1,
        padding: 24,
        gap: 16,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
    },
    titleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flex: 1,
        minWidth: 0,
    },
    emojiBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    emoji: {
        fontSize: 22,
    },
    nameBlock: {
        flex: 1,
        minWidth: 0,
    },
    name: {
        fontSize: 15,
        fontFamily: FONT_FAMILY.bold,
    },
    deadline: {
        fontSize: 10,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 2,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 4,
    },
    iconBtn: {
        padding: 8,
        borderRadius: 12,
    },
    progressSection: {
        gap: 12,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pctText: {
        fontSize: 11,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.4,
    },
    amountsText: {
        fontSize: 11,
        fontFamily: FONT_FAMILY.bold,
        letterSpacing: 0.5,
    },
    tipBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        padding: 10,
        borderRadius: 12,
    },
    tipIcon: {
        fontSize: 12,
    },
    tipText: {
        flex: 1,
        fontSize: 11,
        lineHeight: 16,
    },
    addFundsBtn: {
        paddingVertical: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    addFundsText: {
        fontSize: 11,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
});
