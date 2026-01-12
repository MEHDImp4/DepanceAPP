import { useState, useEffect } from "react";
import { useUpdateGoal, useAccounts } from "@/hooks/use-api";
import { useAuthStore } from "@/store/auth-store";
import type { Goal } from "@/types";
import { X, Check, Wallet, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AddMoneyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    goal: Goal | null;
}

export function AddMoneyDialog({ isOpen, onClose, goal }: AddMoneyDialogProps) {
    const { user } = useAuthStore();
    const currency = user?.currency || "USD";
    const { mutate: updateGoal, isPending } = useUpdateGoal();
    const { data: accounts } = useAccounts();

    const [amount, setAmount] = useState("");
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setAmount("");
            setSelectedAccountId(null);
        }
    }, [isOpen]);

    // Lock body scroll
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!goal || !amount) return;

        const value = parseFloat(amount);
        if (isNaN(value) || value <= 0) return;

        // Logic to deduct from account could be added here if backend supports it
        // For now, we just update the goal amount
        updateGoal({
            id: goal.id,
            currentAmount: goal.currentAmount + value
        }, {
            onSuccess: () => {
                onClose();
            }
        });
    };

    const handleQuickAdd = (value: number) => {
        setAmount(value.toString());
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="absolute inset-0" onClick={onClose} />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-[#1c1c1e] w-full max-w-md rounded-[2.5rem] p-0 shadow-2xl overflow-hidden border border-white/10"
                    >
                        <div className="px-8 pt-8 pb-4 bg-[#1c1c1e] flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">Add Money</h2>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                    Fund your {goal?.name}
                                </p>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-muted-foreground rounded-full transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
                            <div className="space-y-4">
                                <div className="text-center py-6">
                                    <div className="relative inline-block">
                                        <input
                                            type="number"
                                            autoFocus
                                            required
                                            min="0"
                                            step="0.01"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0"
                                            className="w-full bg-transparent text-5xl font-black text-center outline-none placeholder:text-muted-foreground/20"
                                            style={{ minWidth: '120px' }}
                                        />
                                        <div className="text-sm font-bold text-muted-foreground mt-2">{currency}</div>
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-center">
                                    {[10, 20, 50, 100].map((val) => (
                                        <button
                                            type="button"
                                            key={val}
                                            onClick={() => handleQuickAdd(val)}
                                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors"
                                        >
                                            +{val}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Source Account (Optional)</label>
                                    <div className="grid gap-2 max-h-[120px] overflow-y-auto scrollbar-hide">
                                        {accounts?.map((acc) => (
                                            <button
                                                key={acc.id}
                                                type="button"
                                                onClick={() => setSelectedAccountId(acc.id === selectedAccountId ? null : acc.id)}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedAccountId === acc.id
                                                        ? "bg-primary/20 border-primary/50"
                                                        : "bg-white/5 border-transparent hover:bg-white/10"
                                                    }`}
                                            >
                                                <div className="p-2 rounded-lg bg-white/5">
                                                    <Wallet size={16} />
                                                </div>
                                                <div className="text-left flex-1">
                                                    <div className="text-sm font-bold">{acc.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(acc.balance)}
                                                    </div>
                                                </div>
                                                {selectedAccountId === acc.id && <Check size={16} className="text-primary" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!amount || isPending}
                                className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPending ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Plus size={20} />
                                        <span>Add Details</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
