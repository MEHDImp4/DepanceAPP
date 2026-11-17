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
import { Plus } from 'lucide-react-native';

import { useGoals, useDeleteGoal } from '@/hooks/use-api';
import { GoalCard } from '@/components/goals/GoalCard';
import { CreateGoalDialog } from '@/components/goals/CreateGoalDialog';
import { AddMoneyDialog } from '@/components/goals/AddMoneyDialog';
import { useThemeStore } from '@/store/theme-store';
import { FONT_FAMILY, hexWithOpacity } from '@/constants/theme';
import type { Goal } from '@/types';

export default function GoalsScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const colors = useThemeStore((state) => state.colors);

    const { data: goals = [], isLoading, refetch } = useGoals();
    const { mutate: deleteGoal } = useDeleteGoal();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [addMoneyGoal, setAddMoneyGoal] = useState<Goal | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refetch();
        } finally {
            setRefreshing(false);
        }
    }, [refetch]);

    const handleCreate = () => {
        setEditingGoal(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (goal: Goal) => {
        setEditingGoal(goal);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        Alert.alert(
            t('common.delete'),
            'Are you sure you want to delete this goal?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: () => deleteGoal(id),
                },
            ]
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
                        style={[styles.pageTitle, { color: colors.foreground }]}
                    >
                        {t('nav.goals')}
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
                        Visualize your targets
                    </Text>
                </View>

                {goals.length > 0 ? (
                    <Pressable
                        onPress={handleCreate}
                        style={({ pressed }) => [
                            styles.addBtn,
                            {
                                backgroundColor: colors.primary,
                                shadowColor: colors.primary,
                                opacity: pressed ? 0.9 : 1,
                            },
                        ]}
                        accessibilityLabel="Create Goal"
                    >
                        <Plus
                            size={20}
                            color={colors.primaryForeground}
                            strokeWidth={2.5}
                        />
                    </Pressable>
                ) : null}
            </View>

            {goals.length > 0 ? (
                <View style={styles.cardsStack}>
                    {goals.map((goal) => (
                        <GoalCard
                            key={goal.id}
                            goal={goal}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onAddMoney={() => setAddMoneyGoal(goal)}
                        />
                    ))}
                </View>
            ) : (
                <View
                    style={[
                        styles.emptyCard,
                        {
                            backgroundColor: hexWithOpacity(colors.muted, 0.15),
                            borderColor: hexWithOpacity(colors.border, 0.6),
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.emptyTitle,
                            { color: colors.foreground },
                        ]}
                    >
                        No goals yet
                    </Text>
                    <Text
                        style={[
                            styles.emptyDesc,
                            { color: colors.mutedForeground },
                        ]}
                    >
                        Start saving for your dreams today.
                    </Text>
                    <Pressable
                        onPress={handleCreate}
                        style={({ pressed }) => [
                            styles.createBtn,
                            {
                                backgroundColor: colors.primary,
                                opacity: pressed ? 0.9 : 1,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.createBtnText,
                                { color: colors.primaryForeground },
                            ]}
                        >
                            Create Goal
                        </Text>
                    </Pressable>
                </View>
            )}

            <CreateGoalDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                goalToEdit={editingGoal}
            />

            <AddMoneyDialog
                isOpen={!!addMoneyGoal}
                onClose={() => setAddMoneyGoal(null)}
                goal={addMoneyGoal}
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
        gap: 24,
        maxWidth: 480,
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
        paddingHorizontal: 6,
        paddingTop: 8,
    },
    headerText: {
        gap: 4,
    },
    pageTitle: {
        fontSize: 24,
        fontFamily: FONT_FAMILY.bold,
        letterSpacing: -0.4,
    },
    subtitle: {
        fontSize: 11,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    cardsStack: {
        gap: 20,
    },
    emptyCard: {
        paddingVertical: 64,
        paddingHorizontal: 24,
        borderRadius: 40,
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
        gap: 10,
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: FONT_FAMILY.bold,
    },
    emptyDesc: {
        fontSize: 14,
        textAlign: 'center',
        maxWidth: 260,
        marginBottom: 12,
    },
    createBtn: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    createBtnText: {
        fontSize: 12,
        fontFamily: FONT_FAMILY.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.6,
    },
});
