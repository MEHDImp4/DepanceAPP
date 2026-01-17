import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ArrowRightLeft } from "lucide-react";
import type { Account } from "@/types";
import { useCreateTransfer } from "@/hooks/use-api";

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    accounts: Account[];
}

export function TransferModal({ isOpen, onClose, accounts }: TransferModalProps) {
    const { t } = useTranslation();
    const createTransfer = useCreateTransfer();

    const [fromAccountId, setFromAccountId] = useState<string>("");
    const [toAccountId, setToAccountId] = useState<string>("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setFromAccountId("");
            setToAccountId("");
            setAmount("");
            setDescription("");
            setError("");
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!fromAccountId || !toAccountId) {
            setError("Please select both accounts");
            return;
        }

        if (fromAccountId === toAccountId) {
            setError("Cannot transfer to the same account");
            return;
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setError("Please enter a valid amount");
            return;
        }

        createTransfer.mutate({
            from_account_id: parseInt(fromAccountId),
            to_account_id: parseInt(toAccountId),
            amount: amountNum,
            description: description || undefined
        }, {
            onSuccess: () => {
                onClose();
            },
            onError: (err: any) => {
                setError(err.response?.data?.error || "Transfer failed");
            }
        });
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed top-0 left-0 w-screen h-[100dvh] bg-black/40 backdrop-blur-sm z-[9999]"
                    />
                    <div className="fixed inset-0 flex items-center justify-center p-4 z-[10000] pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-card border border-border rounded-[2rem] shadow-2xl pointer-events-auto max-h-[85vh] flex flex-col overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-6 pb-4 border-b border-border/10 bg-card z-10 sticky top-0">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <ArrowRightLeft className="text-primary" size={24} />
                                    {t('accounts.transfer_funds') || "Transfer Funds"}
                                </h2>
                                <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {error && (
                                        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl text-center font-medium">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">{t('accounts.from_account') || "From Account"}</label>
                                            <select
                                                value={fromAccountId}
                                                onChange={(e) => setFromAccountId(e.target.value)}
                                                className="w-full bg-muted/50 border border-transparent rounded-xl px-4 py-3 focus:bg-background focus:border-primary outline-none transition-colors appearance-none"
                                                required
                                            >
                                                <option value="">Select source account</option>
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>
                                                        {acc.name} ({acc.balance.toFixed(2)} {acc.currency})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex justify-center -my-2">
                                            <div className="bg-muted p-2 rounded-full border border-border overflow-hidden">
                                                <ArrowRightLeft className="text-muted-foreground rotate-90" size={16} />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">{t('accounts.to_account') || "To Account"}</label>
                                            <select
                                                value={toAccountId}
                                                onChange={(e) => setToAccountId(e.target.value)}
                                                className="w-full bg-muted/50 border border-transparent rounded-xl px-4 py-3 focus:bg-background focus:border-primary outline-none transition-colors appearance-none"
                                                required
                                            >
                                                <option value="">Select destination account</option>
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>
                                                        {acc.name} ({acc.balance.toFixed(2)} {acc.currency})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">{t('common.amount') || "Amount"}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full bg-muted/50 border border-transparent rounded-xl px-4 py-3 focus:bg-background focus:border-primary outline-none transition-colors"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">{t('common.description') || "Description (Optional)"}</label>
                                        <input
                                            type="text"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full bg-muted/50 border border-transparent rounded-xl px-4 py-3 focus:bg-background focus:border-primary outline-none transition-colors"
                                            placeholder="e.g. Monthly savings"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={createTransfer.isPending}
                                        className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {createTransfer.isPending ? (
                                            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Check size={20} />
                                                <span>{t('accounts.confirm_transfer') || "Confirm Transfer"}</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
