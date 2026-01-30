import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

import { X, Check, Plus } from "lucide-react";
import { PremiumSelect } from "../ui/PremiumSelect";
import { cn } from "@/lib/utils";

import { useTranslation } from "react-i18next";
import type { Transaction } from "@/types";
import { useAccounts, useCategories, useCreateCategory } from "@/hooks/use-api";

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (transaction: Omit<Transaction, "id" | "created_at"> & { account_id: number }) => void;
}

export function AddTransactionModal({ isOpen, onClose, onAdd }: AddTransactionModalProps) {
    const { t } = useTranslation();
    const { data: accounts } = useAccounts();
    const { data: categories } = useCategories();

    const [formData, setFormData] = useState({
        amount: "",
        description: "",
        type: "expense" as "income" | "expense",
        account_id: accounts?.[0]?.id || 0,
        category_id: 0
    });

    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const createCategory = useCreateCategory();

    const handleCreateCategory = () => {
        if (!newCategoryName.trim()) return;

        // Simple mapping for common category names to Lucide icons
        const iconMap: { [key: string]: string } = {
            'food': 'Utensils',
            'restaurant': 'Utensils',
            'groceries': 'ShoppingBag',
            'shopping': 'ShoppingPalette',
            'transport': 'Car',
            'rent': 'Home',
            'salary': 'Banknote',
            'gift': 'Gift',
            'health': 'Stethoscope'
        };

        const defaultIcon = iconMap[newCategoryName.toLowerCase().trim()] || (formData.type === 'income' ? 'TrendingUp' : 'TrendingDown');

        createCategory.mutate({
            name: newCategoryName,
            type: formData.type,
            icon: defaultIcon,
            color: "#3b82f6", // Default color
            user_id: 0 // handled by backend
        }, {
            onSuccess: (data) => {
                setFormData(prev => ({ ...prev, category_id: data.id }));
                setIsAddingCategory(false);
                setNewCategoryName("");
            }
        });
    };

    // Get currency symbol from selected account or default to $
    const selectedAccount = accounts?.find(a => a.id === (formData.account_id || accounts?.[0]?.id));
    const currencySymbol = selectedAccount
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedAccount.currency }).formatToParts(0).find(part => part.type === 'currency')?.value || '$'
        : '$';

    // Filter categories by type
    const filteredCategories = categories?.filter(c => c.type === formData.type) || [];

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

    // Update default account when accounts are loaded
    useEffect(() => {
        if (accounts && accounts.length > 0 && formData.account_id === 0) {
            setFormData(prev => ({ ...prev, account_id: accounts[0].id }));
        }
    }, [accounts, formData.account_id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            description: formData.description,
            type: formData.type,
            amount: formData.amount ? parseFloat(formData.amount) : 0,
            account_id: Number(formData.account_id),
            category_id: formData.category_id > 0 ? Number(formData.category_id) : undefined
        });
        setFormData({ amount: "", description: "", type: "expense", account_id: accounts?.[0]?.id || 0, category_id: 0 });
        onClose();
    };

    return createPortal(
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
                        <div className="flex items-center justify-between p-6 pb-4 border-b border-border/10 bg-card z-10 sticky top-0">
                            <h2 className="text-xl font-bold">{t('transactions.add_new')}</h2>
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
                                        onClick={() => setFormData({ ...formData, type: "expense" })}
                                        className={cn(
                                            "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                                            formData.type === "expense" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                                        )}
                                    >
                                        {t('transactions.expense')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: "income" })}
                                        className={cn(
                                            "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                                            formData.type === "income" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
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
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full bg-muted/50 border-none rounded-2xl py-4 pr-4 text-3xl font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                            style={{ paddingLeft: `${currencySymbol.length * 0.8 + 2}rem` }}
                                        />
                                    </div>
                                </div>

                                {/* Account Selection */}
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">{t('accounts.title')}</label>
                                    <PremiumSelect
                                        value={formData.account_id}
                                        onChange={(val) => setFormData({ ...formData, account_id: Number(val) })}
                                        placeholder={t('accounts.select_account')}
                                        className="w-full py-3"
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
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs font-medium text-muted-foreground">{t('transactions.category')}</label>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingCategory(!isAddingCategory)}
                                            className="text-primary text-xs font-bold hover:underline flex items-center space-x-1"
                                        >
                                            <Plus size={12} />
                                            <span>{t('common.add')}</span>
                                        </button>
                                    </div>

                                    {isAddingCategory ? (
                                        <div className="flex space-x-2">
                                            <input
                                                type="text"
                                                placeholder="New Category Name"
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                className="flex-1 bg-muted/50 border border-transparent focus:border-primary/20 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={handleCreateCategory}
                                                className="bg-primary text-primary-foreground p-3 rounded-xl hover:opacity-90 transition-opacity"
                                            >
                                                <Check size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <PremiumSelect
                                            value={formData.category_id}
                                            onChange={(val) => setFormData({ ...formData, category_id: Number(val) })}
                                            placeholder={t('transactions.select_category')}
                                            className="w-full py-3"
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
                                    )}
                                </div>

                                {/* Description Input */}
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">{t('transactions.description')}</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder={t('transactions.description_placeholder')}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-muted/50 border border-transparent focus:border-primary/20 rounded-xl px-4 py-3 text-base outline-none transition-colors"
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center space-x-2 active:scale-[0.98] transition-transform"
                                >
                                    <Check size={20} />
                                    <span>{t('transactions.save')}</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </>
        ) : null,,
        document.body
    );
}
