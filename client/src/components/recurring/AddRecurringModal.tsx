import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { X, Check, Repeat } from "lucide-react";
import { useCategories, useAccounts, useCreateRecurring } from "@/hooks/use-api";
import { PremiumSelect } from "../ui/PremiumSelect";
import { cn } from "@/lib/utils";

interface AddRecurringModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddRecurringModal({ isOpen, onClose }: AddRecurringModalProps) {
    const { t } = useTranslation();
    const { data: categories = [] } = useCategories();
    const { data: accounts = [] } = useAccounts();
    const createRecurring = useCreateRecurring();

    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [interval, setInterval] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
    const [categoryId, setCategoryId] = useState<number>(0);
    const [accountId, setAccountId] = useState<number>(0);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

    // Update default values when data loads
    useEffect(() => {
        if (accounts && accounts.length > 0 && accountId === 0) {
            setAccountId(accounts[0].id);
        }
    }, [accounts, accountId]);

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
        if (!accountId) return;

        createRecurring.mutate({
            description,
            amount: parseFloat(amount),
            type,
            interval,
            start_date: startDate,
            account_id: accountId,
            category_id: categoryId > 0 ? categoryId : null
        }, {
            onSuccess: () => {
                onClose();
                resetForm();
            }
        });
    };

    const resetForm = () => {
        setDescription("");
        setAmount("");
        setType('expense');
        setInterval('monthly');
        setCategoryId(0);
        setAccountId(accounts?.[0]?.id || 0);
        setStartDate(new Date().toISOString().split('T')[0]);
    };

    // Get currency symbol from selected account or default to $
    const selectedAccount = accounts?.find(a => a.id === accountId);
    const currencySymbol = selectedAccount
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedAccount.currency }).formatToParts(0).find(part => part.type === 'currency')?.value || '$'
        : '$';

    // Filter categories by type
    const filteredCategories = categories?.filter(c => c.type === type) || [];

    return createPortal(
        isOpen ? (
            <>
                {/* Backdrop */}
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999]"
                />

                <div className="fixed inset-0 flex items-center justify-center p-4 z-[10000] pointer-events-none">
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-card border border-border rounded-[2rem] shadow-2xl pointer-events-auto max-h-[90vh] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 pb-4 border-b border-border/10 bg-card z-10 sticky top-0">
                            <h2 className="text-xl font-bold">{t('recurring.add_title') || "Add Recurring Transaction"}</h2>
                            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Type Toggle */}
                                <div className="flex bg-muted p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setType('expense')}
                                        className={cn(
                                            "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                                            type === 'expense' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                                        )}
                                    >
                                        {t('transactions.expense')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('income')}
                                        className={cn(
                                            "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                                            type === 'income' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                                        )}
                                    >
                                        {t('transactions.income')}
                                    </button>
                                </div>

                                {/* Amount Input */}
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">{t('transactions.amount')}</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            required
                                            step="0.01"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full bg-muted/50 border-none rounded-2xl py-4 pr-4 text-3xl font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                            style={{ paddingLeft: `${currencySymbol.length * 0.8 + 2}rem` }}
                                        />
                                    </div>
                                </div>

                                {/* Interval & Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">{t('recurring.interval')}</label>
                                        <PremiumSelect
                                            value={interval}
                                            onChange={(val) => setInterval(val as any)}
                                            options={[
                                                { value: 'weekly', label: t('recurring.weekly') },
                                                { value: 'monthly', label: t('recurring.monthly') },
                                                { value: 'yearly', label: t('recurring.yearly') },
                                            ]}
                                            className="w-full py-3 px-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">{t('recurring.start_date')}</label>
                                        <input
                                            type="date"
                                            required
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full bg-muted/50 border-none rounded-xl px-2 py-3 text-sm outline-none color-scheme-dark [&::-webkit-calendar-picker-indicator]:hidden"
                                        />
                                    </div>
                                </div>

                                {/* Account Selection */}
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">{t('accounts.title')}</label>
                                    <PremiumSelect
                                        value={accountId}
                                        onChange={(val) => setAccountId(Number(val))}
                                        placeholder={t('accounts.select_account')}
                                        className="w-full py-3 px-2"
                                        options={accounts?.map(acc => ({
                                            value: acc.id,
                                            label: (
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="font-semibold">{acc.name}</span>
                                                    <span className="text-muted-foreground text-xs">
                                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: acc.currency }).format(acc.balance)}
                                                    </span>
                                                </div>
                                            )
                                        })) || []}
                                    />
                                </div>

                                {/* Category Selection */}
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">{t('transactions.category')}</label>
                                    <PremiumSelect
                                        value={categoryId}
                                        onChange={(val) => setCategoryId(Number(val))}
                                        placeholder={t('transactions.select_category')}
                                        className="w-full py-3 px-2"
                                        options={[
                                            { value: 0, label: t('transactions.select_category') },
                                            ...filteredCategories.map(cat => ({
                                                value: cat.id,
                                                label: (
                                                    <div className="flex items-center space-x-3">
                                                        <span>{cat.name}</span>
                                                    </div>
                                                )
                                            }))
                                        ]}
                                    />
                                </div>

                                {/* Description Input */}
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">{t('transactions.description')}</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder={t('transactions.description_placeholder')}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-muted/50 border border-transparent focus:border-primary/20 rounded-xl px-4 py-3 text-base outline-none transition-colors"
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={createRecurring.isPending}
                                    className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center space-x-2 active:scale-[0.98] transition-transform disabled:opacity-50"
                                >
                                    {createRecurring.isPending ? (
                                        <div className="animate-spin">
                                            <Repeat size={20} />
                                        </div>
                                    ) : (
                                        <>
                                            <Check size={20} />
                                            <span>{t('recurring.create_button') || "Create Recurring"}</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </>
        ) : null,
        document.body
    );
}
