import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGoals, useDeleteGoal } from "@/hooks/use-api";
import { GoalCard } from "@/components/goals/GoalCard";
import { CreateGoalDialog } from "@/components/goals/CreateGoalDialog";
import { AddMoneyDialog } from "@/components/goals/AddMoneyDialog";
import type { Goal } from "@/types";
import { Plus } from "lucide-react";


export default function Goals() {
    const { t } = useTranslation();
    const { data: goals, isLoading } = useGoals();
    const { mutate: deleteGoal } = useDeleteGoal();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [addMoneyGoal, setAddMoneyGoal] = useState<Goal | null>(null);

    const handleCreate = () => {
        setEditingGoal(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (goal: Goal) => {
        setEditingGoal(goal);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this goal?")) {
            deleteGoal(id);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen pb-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24 md:pb-0">
            <header className="flex flex-col space-y-4 px-2 pt-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('nav.goals')}</h1>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                            Visualize your targets
                        </p>
                    </div>
                    {goals && goals.length > 0 && (
                        <button
                            onClick={handleCreate}
                            className="bg-primary text-primary-foreground w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                        >
                            <Plus size={20} strokeWidth={2.5} />
                        </button>
                    )}
                </div>
            </header>

            {goals && goals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map((goal) => (
                        <div key={goal.id}>
                            <GoalCard
                                goal={goal}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onAddMoney={() => setAddMoneyGoal(goal)}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-muted/10 rounded-[2.5rem] border border-dashed border-border/50">
                    <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                        🎯
                    </div>
                    <h3 className="text-lg font-bold mb-2">No goals yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-6 text-sm">
                        Start saving for your dreams today.
                    </p>
                    <button
                        onClick={handleCreate}
                        className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-opacity"
                    >
                        Create Goal
                    </button>
                </div>
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
        </div>
    );
}
