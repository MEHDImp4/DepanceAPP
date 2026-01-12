import type { Goal } from "@/types";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAuthStore } from "@/store/auth-store";
import { Pencil, Trash2, Plus } from "lucide-react";

interface GoalCardProps {
    goal: Goal;
    onEdit: (goal: Goal) => void;
    onDelete: (id: number) => void;
    onAddMoney: (goal: Goal) => void;
}

export function GoalCard({ goal, onEdit, onDelete, onAddMoney }: GoalCardProps) {
    const { user } = useAuthStore();
    const currency = user?.currency || "USD";

    const percentage = Math.round((goal.currentAmount / goal.targetAmount) * 100);
    const isCompleted = goal.currentAmount >= goal.targetAmount;

    return (
        <div className="bg-card/50 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-2xl flex items-center justify-center">
                        {goal.icon || "🎯"}
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">{goal.name}</h3>
                        {goal.deadline && (
                            <p className="text-xs text-muted-foreground">
                                Due {new Date(goal.deadline).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(goal)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(goal.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-muted-foreground hover:text-red-500"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{percentage}%</span>
                    <span className="font-medium">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(goal.currentAmount)} / {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(goal.targetAmount)}
                    </span>
                </div>
                <ProgressBar
                    value={goal.currentAmount}
                    max={goal.targetAmount}
                    color={goal.color || (isCompleted ? "bg-green-500" : "bg-primary")}
                />

                {!isCompleted && goal.deadline && (
                    <div className="text-xs text-muted-foreground pt-1 flex items-center gap-1.5">
                        <span className="text-primary">💡</span>
                        {(() => {
                            const remaining = goal.targetAmount - goal.currentAmount;
                            const monthsLeft = Math.max(1, (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30));
                            const monthlySave = remaining / monthsLeft;

                            return (
                                <span>
                                    Save <span className="font-bold text-foreground">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(monthlySave)}/mo</span> to reach your goal on time.
                                </span>
                            );
                        })()}
                    </div>
                )}
            </div>

            <button
                onClick={() => onAddMoney(goal)}
                className="w-full mt-2 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isCompleted}
            >
                <Plus size={18} />
                Add Money
            </button>
        </div>
    );
}
