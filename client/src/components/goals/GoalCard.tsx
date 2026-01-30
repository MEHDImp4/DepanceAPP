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
        <div className="bg-card border border-border p-6 rounded-[2rem] flex flex-col gap-4 shadow-sm hover:border-primary/50 transition-colors">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-2xl flex items-center justify-center shadow-inner shadow-primary/5">
                        {goal.icon || "🎯"}
                    </div>
                    <div>
                        <h3 className="font-bold text-[15px] tracking-tight">{goal.name}</h3>
                        {goal.deadline && (
                            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 mt-0.5">
                                Due {new Date(goal.deadline).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => onEdit(goal)}
                        className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(goal.id)}
                        className="p-2 hover:bg-red-500/10 rounded-xl text-muted-foreground hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{percentage}%</span>
                    <span className="text-[11px] font-bold tracking-wider">
                        <span className="text-foreground">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(goal.currentAmount)}</span>
                        <span className="text-muted-foreground"> / {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(goal.targetAmount)}</span>
                    </span>
                </div>
                <ProgressBar
                    value={goal.currentAmount}
                    max={goal.targetAmount}
                    color={goal.color || (isCompleted ? "bg-emerald-500" : "bg-primary")}
                />

                {!isCompleted && goal.deadline && (
                    <div className="bg-muted/30 p-2.5 rounded-xl text-[10px] text-muted-foreground flex items-start gap-2 leading-tight">
                        <span className="text-primary mt-0.5">💡</span>
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
                className="w-full mt-1 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isCompleted}
            >
                <Plus size={16} strokeWidth={2.5} />
                Add Funds
            </button>
        </div>
    );
}
