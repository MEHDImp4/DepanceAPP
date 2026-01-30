import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, Check, Building, Wallet, CreditCard, PiggyBank, Trash2, AlertTriangle } from "lucide-react";
import type { Account } from "@/types";
import { useDeleteAccount } from "@/hooks/use-api";

interface AddAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (account: Omit<Account, "id"> | Account) => void;
    account?: Account | null;
}

const COLORS = [
    "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500",
    "bg-lime-500", "bg-green-500", "bg-emerald-500", "bg-teal-500",
    "bg-cyan-500", "bg-sky-500", "bg-blue-500", "bg-indigo-500",
    "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", "bg-pink-500",
    "bg-rose-500", "bg-slate-500"
];

const TYPES = [
    { value: "bank", icon: Building },
    { value: "cash", icon: Wallet },
    { value: "credit", icon: CreditCard },
    { value: "savings", icon: PiggyBank },
];

export function AddAccountModal({ isOpen, onClose, onAdd, account }: AddAccountModalProps) {
    const { t } = useTranslation();
    const [name, setName] = useState("");
    const [balance, setBalance] = useState("");
    const [type, setType] = useState("bank");
    const [currency, setCurrency] = useState("USD");
    const [color, setColor] = useState("bg-blue-500");
    const [isDeleting, setIsDeleting] = useState(false);
    const [password, setPassword] = useState("");
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const deleteAccount = useDeleteAccount();

    // Pre-fill form when account prop changes (edit mode)
    useEffect(() => {
        if (account) {
            setName(account.name);
            setBalance(account.balance.toString());
            setType(account.type);
            setCurrency(account.currency);
            setColor(account.color || "bg-blue-500");
        } else {
            // Reset for add mode
            setName("");
            setBalance("");
            setType("bank");
            setCurrency("USD");
            setColor("bg-blue-500");
        }
        setIsDeleting(false); // Reset delete state
        setPassword("");
        setDeleteError(null);
    }, [account, isOpen]);

    // Block background scroll when modal is open
    useEffect(() => {
        if (isOpen) {
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
        const accountData = {
            name,
            balance: parseFloat(balance) || 0,
            type,
            currency,
            color
        };

        if (account) {
            onAdd({ ...accountData, id: account.id });
        } else {
            onAdd(accountData);
        }

        onClose();
    };

    const handleDelete = () => {
        if (!account || !password) return;

        setDeleteError(null);

        deleteAccount.mutate({ id: account.id, password }, {
            onSuccess: () => {
                onClose();
            },
            onError: (error: any) => {
                console.error("Failed to delete account", error);
                setDeleteError(error.response?.data?.error || "Failed to delete account");
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
                                <h2 className="text-xl font-bold">{account ? t('accounts.edit_account') || "Edit Account" : t('accounts.add_account')}</h2>
                                <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                {isDeleting ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-6 text-center"
                                    >
                                        <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto text-destructive">
                                            <AlertTriangle size={32} />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-bold">{t('common.confirm_delete') || "Delete Account?"}</h3>
                                            <p className="text-muted-foreground text-sm">
                                                To delete this account, please enter your password. This action cannot be undone.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Enter your password"
                                                className="w-full bg-muted/50 border border-transparent rounded-xl px-4 py-3 focus:bg-background focus:border-primary outline-none transition-colors text-center"
                                            />
                                            {deleteError && (
                                                <p className="text-sm font-bold text-destructive">{deleteError}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setIsDeleting(false)}
                                                className="flex-1 py-4 rounded-xl font-bold bg-muted hover:bg-muted/80 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleDelete}
                                                disabled={deleteAccount.isPending || !password}
                                                className="flex-1 py-4 rounded-xl font-bold bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {deleteAccount.isPending ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <Trash2 size={20} />
                                                        <span>Delete</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">{t('common.name') || "Name"}</label>
                                            <input
                                                type="text"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full bg-muted/50 border border-transparent rounded-xl px-4 py-3 focus:bg-background focus:border-primary outline-none transition-colors"
                                                placeholder="e.g. Chase Sapphire"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-muted-foreground">{t('common.amount') || "Balance"}</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    required
                                                    disabled={!!account}
                                                    value={balance}
                                                    onChange={(e) => setBalance(e.target.value)}
                                                    className={cn(
                                                        "w-full bg-muted/50 border border-transparent rounded-xl px-4 py-3 focus:bg-background focus:border-primary outline-none transition-colors",
                                                        account && "opacity-50 cursor-not-allowed"
                                                    )}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-muted-foreground">Currency</label>
                                                <select
                                                    value={currency}
                                                    onChange={(e) => setCurrency(e.target.value)}
                                                    className="w-full bg-muted/50 border border-transparent rounded-xl px-4 py-3 focus:bg-background focus:border-primary outline-none transition-colors appearance-none"
                                                >
                                                    <option value="USD">USD ($)</option>
                                                    <option value="EUR">EUR (€)</option>
                                                    <option value="GBP">GBP (£)</option>
                                                    <option value="MAD">MAD (DH)</option>
                                                    <option value="JPY">JPY (¥)</option>
                                                    <option value="CAD">CAD ($)</option>
                                                    <option value="CHF">CHF (Fr)</option>
                                                    <option value="AUD">AUD ($)</option>
                                                    <option value="CNY">CNY (¥)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">Type</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {TYPES.map((tItem) => (
                                                    <button
                                                        key={tItem.value}
                                                        type="button"
                                                        onClick={() => setType(tItem.value)}
                                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${type === tItem.value
                                                            ? "border-primary bg-primary/5 text-primary"
                                                            : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                                                            }`}
                                                    >
                                                        <tItem.icon size={24} className="mb-1" />
                                                        <span className="text-xs font-medium capitalize">{tItem.value}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">Color</label>
                                            <div className="grid grid-cols-6 gap-2">
                                                {COLORS.map((c) => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        onClick={() => setColor(c)}
                                                        className={`w-full aspect-square rounded-full transition-transform ${c} ${color === c ? "scale-110 ring-2 ring-offset-2 ring-primary" : "hover:scale-105"
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
                                        >
                                            <Check size={20} />
                                            <span>{account ? t('common.save') || "Save Changes" : t('accounts.add_account') || "Add Account"}</span>
                                        </button>

                                        {account && (
                                            <button
                                                type="button"
                                                onClick={() => setIsDeleting(true)}
                                                className="w-full bg-destructive/10 text-destructive font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-destructive/20 active:scale-95 transition-all"
                                            >
                                                <Trash2 size={20} />
                                                <span>{t('common.delete') || "Delete Account"}</span>
                                            </button>
                                        )}
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
