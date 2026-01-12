import { useState } from "react";
import { useGoals, useDeleteGoal } from "@/hooks/use-api";
import { GoalCard } from "@/components/goals/GoalCard";
import { CreateGoalDialog } from "@/components/goals/CreateGoalDialog";
import { AddMoneyDialog } from "@/components/goals/AddMoneyDialog";
import type { Goal } from "@/types";
import { Plus, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function Goals() {
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
        return <div className="p-8 text-center">Loading goals...</div>;
    }

    return (
        <div className="space-y-6 pb-24 md:pb-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Target className="w-8 h-8 text-primary" />
                        Savings Goals
                    </h1>
                    <p className="text-muted-foreground mt-1">Visualize and track your financial targets.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:opacity-90 transition-opacity w-full sm:w-auto justify-center"
                >
                    <Plus size={20} />
                    <span className="inline">New Goal</span>
                </button>
            </div>

            {goals && goals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map((goal) => (
                        <motion.div
                            key={goal.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <GoalCard
                                goal={goal}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onAddMoney={() => setAddMoneyGoal(goal)}
                            />
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                        🌱
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No goals yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                        Start saving for your dreams today. Create your first goal to track your progress.
                    </p>
                    <button
                        onClick={handleCreate}
                        className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
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
