import { useState, useEffect } from "react";
import { useCreateGoal, useUpdateGoal } from "@/hooks/use-api";
import { useAuthStore } from "@/store/auth-store";
import type { Goal } from "@/types";
import { X, Check, Target, Calendar, Sparkles, Coins, Palette } from "lucide-react";
import { cn } from "@/lib/utils";


interface CreateGoalDialogProps {
    isOpen: boolean;
    onClose: () => void;
    goalToEdit?: Goal | null;
}

const COLORS = [
    { name: "Blue", value: "bg-blue-500", glow: "shadow-blue-500/20" },
    { name: "Purple", value: "bg-purple-500", glow: "shadow-purple-500/20" },
    { name: "Green", value: "bg-green-500", glow: "shadow-green-500/20" },
    { name: "Amber", value: "bg-amber-500", glow: "shadow-amber-500/20" },
    { name: "Red", value: "bg-red-500", glow: "shadow-red-500/20" },
    { name: "Pink", value: "bg-pink-500", glow: "shadow-pink-500/20" }
];

const ICONS = ["🎯", "✈️", "🚗", "🏠", "💻", "🎓", "🎮", "🎁", "🗼", "⛵", "🏔️", "💍"];

export function CreateGoalDialog({ isOpen, onClose, goalToEdit }: CreateGoalDialogProps) {
    const { user } = useAuthStore();
    const currency = user?.currency || "USD";
    const { mutate: createGoal, isPending: isCreating } = useCreateGoal();
    const { mutate: updateGoal, isPending: isUpdating } = useUpdateGoal();

    // Form State
    const [name, setName] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
    const [currentAmount, setCurrentAmount] = useState("");
    const [deadline, setDeadline] = useState("");
    const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
    const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);

    useEffect(() => {
        if (goalToEdit) {
            setName(goalToEdit.name);
            setTargetAmount(goalToEdit.targetAmount.toString());
            setCurrentAmount(goalToEdit.currentAmount.toString());
            setDeadline(goalToEdit.deadline ? new Date(goalToEdit.deadline).toISOString().split('T')[0] : "");
            setSelectedColor(goalToEdit.color || COLORS[0].value);
            setSelectedIcon(goalToEdit.icon || ICONS[0]);
        } else {
            resetForm();
        }
    }, [goalToEdit, isOpen]);

    // PREVENT BACKGROUND SCROLLING
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const resetForm = () => {
        setName("");
        setTargetAmount("");
        setCurrentAmount("");
        setDeadline("");
        setSelectedColor(COLORS[0].value);
        setSelectedIcon(ICONS[0]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            name,
            targetAmount: parseFloat(targetAmount),
            currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
            deadline: deadline ? new Date(deadline).toISOString() : null,
            color: selectedColor,
            icon: selectedIcon
        };

        if (goalToEdit) {
            updateGoal({ id: goalToEdit.id, ...payload }, {
                onSuccess: () => {
                    onClose();
                    resetForm();
                }
            });
        } else {
            createGoal(payload, {
                onSuccess: () => {
                    onClose();
                    resetForm();
                }
            });
        }
    };

    return (
        isOpen ? (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                {/* Backdrop for closing */}
                <div className="absolute inset-0" onClick={onClose} />

                <div
                    className="relative bg-[#1c1c1e] w-full max-w-lg rounded-[2.5rem] p-0 shadow-2xl overflow-hidden border border-white/10"
                >
                    {/* Modal Header */}
                    <div className="sticky top-0 z-20 px-8 pt-8 pb-4 bg-[#1c1c1e]/80 backdrop-blur-xl flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">
                                {goalToEdit ? "Edit Goal" : "New Goal"}
                            </h2>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                {goalToEdit ? "Refine your target" : "Start your journey"}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-muted-foreground rounded-full transition-all duration-300 hover:rotate-90"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Scrollable Form Content */}
                    <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-8 max-h-[80vh] overflow-y-auto scrollbar-hide">

                        {/* Section 1: Basic Info */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 text-primary">
                                <Sparkles size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Basics</span>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1.5 transition-transform">
                                    <label className="text-xs font-bold text-muted-foreground/80 px-1">Goal Name</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors">
                                            <Target size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. Dream Wedding"
                                            className="w-full bg-white/5 border border-white/5 rounded-[1.25rem] pl-12 pr-4 py-4 text-sm font-bold placeholder:text-muted-foreground/20 focus:bg-white/10 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Financials */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 text-primary">
                                <Coins size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Target</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 transition-transform">
                                    <label className="text-xs font-bold text-muted-foreground/80 px-1">Target Amount</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={targetAmount}
                                            onChange={(e) => setTargetAmount(e.target.value)}
                                            placeholder="0"
                                            className="w-full bg-white/5 border border-white/5 rounded-[1.25rem] pl-4 pr-12 py-4 text-sm font-bold focus:bg-white/10 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 font-bold text-xs pointer-events-none">
                                            {currency}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5 transition-transform">
                                    <label className="text-xs font-bold text-muted-foreground/80 px-1">Current Progress</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            value={currentAmount}
                                            onChange={(e) => setCurrentAmount(e.target.value)}
                                            placeholder="0"
                                            className="w-full bg-white/5 border border-white/5 rounded-[1.25rem] pl-4 pr-12 py-4 text-sm font-bold focus:bg-white/10 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 font-bold text-xs pointer-events-none">
                                            {currency}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5 transition-transform">
                                <label className="text-xs font-bold text-muted-foreground/80 px-1">Deadline <span className="text-[10px] opacity-40 font-medium">(Optional)</span></label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors">
                                        <Calendar size={18} />
                                    </div>
                                    <input
                                        type="date"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                        className="w-full bg-white/5 border border-white/5 rounded-[1.25rem] pl-12 pr-4 py-4 text-sm font-bold focus:bg-white/10 focus:ring-2 focus:ring-primary/20 transition-all outline-none scheme-dark"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Visuals */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 text-primary">
                                <Palette size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Appearance</span>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-muted-foreground/80 px-1">Theme Color</label>
                                    <div className="grid grid-cols-6 gap-3">
                                        {COLORS.map(color => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => setSelectedColor(color.value)}
                                                className={cn(
                                                    "aspect-square rounded-2xl transition-all duration-300 relative group",
                                                    color.value,
                                                    selectedColor === color.value
                                                        ? "scale-110 shadow-lg ring-2 ring-white/50"
                                                        : "opacity-40 hover:opacity-100 hover:scale-105",
                                                    selectedColor === color.value && color.glow
                                                )}
                                            >
                                                {selectedColor === color.value && (
                                                    <div className="flex items-center justify-center text-white">
                                                        <Check size={14} strokeWidth={4} />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-muted-foreground/80 px-1">Goal Icon</label>
                                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                                        {ICONS.map(icon => (
                                            <button
                                                key={icon}
                                                type="button"
                                                onClick={() => setSelectedIcon(icon)}
                                                className={cn(
                                                    "aspect-square rounded-xl flex items-center justify-center text-xl transition-all duration-300",
                                                    selectedIcon === icon
                                                        ? "bg-primary/20 ring-1 ring-primary/40 scale-110"
                                                        : "bg-muted/10 hover:bg-muted/30"
                                                )}
                                            >
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isCreating || isUpdating}
                                className={cn(
                                    "group w-full py-5 rounded-[1.5rem] font-black text-lg tracking-tight transition-all duration-500 relative overflow-hidden flex items-center justify-center gap-3",
                                    "bg-primary text-primary-foreground shadow-2xl shadow-primary/20",
                                    "hover:scale-[1.02] hover:shadow-primary/30 active:scale-[0.98]",
                                    (isCreating || isUpdating) && "opacity-80 pointer-events-none"
                                )}
                            >
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                {(isCreating || isUpdating) ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        <span>Saving...</span>
                                    </div>
                                ) : (
                                    <>
                                        <Check size={22} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                                        <span>{goalToEdit ? "Save Changes" : "Create Goal"}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        ) : null
    );
}
