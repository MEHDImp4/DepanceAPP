import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { X, Check, Home, ShoppingCart, Car, Wallet, Lightbulb, Coffee, Smartphone, Plane, TrendingUp, TrendingDown, Music, Tv2, Film, Ghost, PlayCircle, Apple, MonitorPlay, Dumbbell, Shirt, UtensilsCrossed } from "lucide-react";
import type { Template } from "@/types";
import { useCategories, useAccounts, useDeleteTemplate } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

interface AddTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (template: Omit<Template, "id">) => void;
    onUpdate?: (id: number, template: Omit<Template, "id">) => void;
    templateToEdit?: Template | null;
}

const COLORS = [
    "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500",
    "bg-lime-500", "bg-green-500", "bg-emerald-500", "bg-teal-500",
    "bg-cyan-500", "bg-sky-500", "bg-blue-500", "bg-indigo-500",
    "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", "bg-pink-500",
    "bg-rose-500", "bg-slate-500"
];

const ICONS = [
    { name: "Home", icon: Home },
    { name: "ShoppingCart", icon: ShoppingCart },
    { name: "Car", icon: Car },
    { name: "Wallet", icon: Wallet },
    { name: "Lightbulb", icon: Lightbulb },
    { name: "Coffee", icon: Coffee },
    { name: "Smartphone", icon: Smartphone },
    { name: "Plane", icon: Plane },
    { name: "Music", icon: Music },
    { name: "Tv2", icon: Tv2 },
    { name: "Film", icon: Film },
    { name: "PlayCircle", icon: PlayCircle },
    { name: "Apple", icon: Apple },
    { name: "MonitorPlay", icon: MonitorPlay },
    { name: "Dumbbell", icon: Dumbbell },
    { name: "Shirt", icon: Shirt },
    { name: "UtensilsCrossed", icon: UtensilsCrossed },
    { name: "Ghost", icon: Ghost },
];


export function AddTemplateModal({ isOpen, onClose, onAdd, onUpdate, templateToEdit }: AddTemplateModalProps) {
    const { t } = useTranslation();
    const { data: categories = [] } = useCategories();
    const { data: accounts = [] } = useAccounts();
    const deleteTemplate = useDeleteTemplate();

    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [accountId, setAccountId] = useState<number | null>(null);
    const [iconName, setIconName] = useState("Home");
    const [color, setColor] = useState("bg-blue-500");
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (templateToEdit) {
            setName(templateToEdit.name);
            setAmount(templateToEdit.amount.toString());
            setType(templateToEdit.type);
            setCategoryId(templateToEdit.category_id || null);
            setAccountId(templateToEdit.default_account_id || null);
            setIconName(templateToEdit.icon_name || "Home");
            setColor(templateToEdit.color);
            setDescription(templateToEdit.description || "");
        } else {
            setName("");
            setAmount("");
            setType('expense');
            setCategoryId(null);
            setAccountId(null);
            setIconName("Home");
            setColor("bg-blue-500");
            setDescription("");
        }
    }, [templateToEdit, isOpen]);

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
        const templateData = {
            name,
            amount: parseFloat(amount) || 0,
            type,
            category_id: categoryId,
            default_account_id: accountId,
            icon_name: iconName,
            color,
            description
        };

        if (templateToEdit && onUpdate) {
            onUpdate(templateToEdit.id, templateData);
        } else {
            onAdd(templateData);
        }
        onClose();
    };

    const handleDelete = () => {
        if (templateToEdit && window.confirm(t('common.confirm_delete') || "Are you sure you want to delete this template?")) {
            deleteTemplate.mutate(templateToEdit.id, {
                onSuccess: () => onClose()
            });
        }
    };

    return createPortal(
    return createPortal(
        isOpen ? (
            <>
                {/* Backdrop */}
                <div
                    onClick={onClose}
                    className="fixed top-0 left-0 w-screen h-[100dvh] bg-black/40 backdrop-blur-sm z-[9999]"
                />

                <div className="fixed inset-0 flex items-center justify-center p-4 z-[10000] pointer-events-none">
                    <div
                        className="w-full max-w-md bg-card border border-border rounded-[2rem] shadow-2xl pointer-events-auto max-h-[90vh] flex flex-col overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-6 pb-4 border-b border-border/10 bg-card z-10 sticky top-0">
                            <h2 className="text-xl font-bold">
                                {templateToEdit ? t('templates.edit_template') || "Edit Template" : t('templates.create_new') || "Create Template"}
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">{t('common.name') || "Name"}</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-muted/50 border border-transparent rounded-xl px-4 py-3 focus:bg-background focus:border-primary outline-none transition-colors"
                                        placeholder="e.g. Monthly Rent"
                                    />
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
                                    <label className="text-sm font-medium text-muted-foreground">{t('transactions.type')}</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setType('expense')}
                                            className={cn(
                                                "flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-wider",
                                                type === 'expense'
                                                    ? "border-red-500 bg-red-500/5 text-red-500"
                                                    : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                                            )}
                                        >
                                            <TrendingDown size={16} />
                                            {t('transactions.expense')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setType('income')}
                                            className={cn(
                                                "flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-wider",
                                                type === 'income'
                                                    ? "border-emerald-500 bg-emerald-500/5 text-emerald-500"
                                                    : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                                            )}
                                        >
                                            <TrendingUp size={16} />
                                            {t('transactions.income')}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">{t('transactions.category')}</label>
                                    <select
                                        value={categoryId || ""}
                                        onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                                        className="w-full bg-muted/50 border border-transparent rounded-xl px-4 py-3 focus:bg-background focus:border-primary outline-none transition-colors appearance-none text-sm"
                                    >
                                        <option value="">{t('transactions.uncategorized')}</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">{t('settings.account')}</label>
                                    <select
                                        value={accountId || ""}
                                        onChange={(e) => setAccountId(e.target.value ? parseInt(e.target.value) : null)}
                                        className="w-full bg-muted/50 border border-transparent rounded-xl px-4 py-3 focus:bg-background focus:border-primary outline-none transition-colors appearance-none text-sm"
                                    >
                                        <option value="">{t('common.select_account') || "Select Account"}</option>
                                        {accounts.map(a => (
                                            <option key={a.id} value={a.id}>{a.name} ({a.balance.toFixed(2)})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Icon</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {ICONS.map((i) => (
                                            <button
                                                key={i.name}
                                                type="button"
                                                onClick={() => setIconName(i.name)}
                                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${iconName === i.name
                                                    ? "border-primary bg-primary/5 text-primary"
                                                    : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                                                    }`}
                                            >
                                                <i.icon size={24} />
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
                                    <span>{templateToEdit ? t('common.save') || "Save Changes" : t('templates.create_template')}</span>
                                </button>

                                {templateToEdit && (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="w-full bg-red-500/10 text-red-500 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20 active:scale-95 transition-all"
                                    >
                                        <X size={20} />
                                        <span>{t('common.delete') || "Delete Template"}</span>
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </>
        ) : null,,
        document.body
    );
}
