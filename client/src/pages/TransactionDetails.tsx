import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Calendar, Wallet, Tag, TrendingUp, TrendingDown } from "lucide-react";
import { useTransaction, useAccounts, useCategories } from "@/hooks/use-api";
import { useAuthStore } from "@/store/auth-store";

import { cn } from "@/lib/utils";
import api from "@/lib/axios"; // Or use a delete hook if you make one

export default function TransactionDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const user = useAuthStore((state) => state.user);

    // Convert id to number safely
    const transactionId = Number(id);
    const { data: transaction, isLoading, isError } = useTransaction(transactionId);
    const { data: accounts } = useAccounts();
    const { data: categories } = useCategories();

    // Helper to format currency
    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat(i18n.language, {
            style: "currency",
            currency: currency
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (isError || !transaction) {
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4">
                <p className="text-muted-foreground">{t('transactions.no_results')}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="text-primary hover:underline"
                >
                    {t('common.retry')}
                </button>
            </div>
        );
    }

    const account = accounts?.find(a => a.id === transaction.account_id);
    const category = categories?.find(c => c.id === transaction.category_id);
    const currency = account?.currency || user?.currency || 'USD';

    return (
        <div className="min-h-screen bg-background flex flex-col pt-4">
            {/* Minimal Header */}
            <div className="px-4 sm:px-6 flex items-center justify-between mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-card/50 backdrop-blur-md border border-border/50 flex items-center justify-center rounded-2xl shadow-sm"
                >
                    <ArrowLeft size={20} className="text-foreground" />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">{t('transactions.title')}</span>
                    <h1 className="font-bold text-[13px] sm:text-sm tracking-tight">#{transaction.id}</h1>
                </div>
                <div className="w-10 h-10" /> {/* Spacer */}
            </div>

            <div className="px-4 sm:px-6 flex-1 max-w-lg mx-auto w-full space-y-10 pb-20">

                {/* Hero section with Amount */}
                <div className="flex flex-col items-center text-center space-y-6">
                    <div
                        className={cn(
                            "w-24 h-24 rounded-[3rem] flex items-center justify-center shadow-2xl skew-y-1 transition-transform border-4 border-background",
                            transaction.type === 'income' ? "bg-emerald-500 shadow-emerald-500/20" : "bg-red-500 shadow-red-500/20"
                        )}
                    >
                        {transaction.type === 'income' ? (
                            <TrendingUp size={40} className="text-white" strokeWidth={2.5} />
                        ) : (
                            <TrendingDown size={40} className="text-white" strokeWidth={2.5} />
                        )}
                    </div>

                    <div className="space-y-1">
                        <h2
                            className={cn(
                                "text-xl sm:text-2xl font-black tracking-tight",
                                transaction.type === 'income' ? "text-emerald-500" : "text-foreground"
                            )}
                        >
                            {formatCurrency(transaction.amount, currency)}
                            {transaction.type === 'income' ? ' +' : ' -'}
                        </h2>
                        <p className="text-base sm:text-lg font-bold tracking-tight text-muted-foreground">{transaction.description}</p>
                    </div>
                </div>

                {/* Details List - Minimalist approach */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 px-2">{t('common.details', 'Details')}</h3>

                    <div className="bg-card/30 backdrop-blur-xl border border-border/40 rounded-[2.5rem] overflow-hidden">
                        {/* Date & Time */}
                        <div className="flex items-center justify-between p-4 sm:p-6">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="w-10 h-10 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground shrink-0">
                                    <Calendar size={18} strokeWidth={2.5} />
                                </div>
                                <span className="text-[13px] font-bold text-muted-foreground/80">{t('transactions.date', 'Date')}</span>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-[13px]">
                                    {new Date(transaction.created_at).toLocaleDateString(i18n.language, {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                                <p className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-widest mt-0.5">
                                    {new Date(transaction.created_at).toLocaleTimeString(i18n.language, {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="h-px bg-border/20 mx-4 sm:mx-6" />

                        {/* Category Row */}
                        <div className="flex items-center justify-between p-4 sm:p-6">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="w-10 h-10 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground shrink-0">
                                    <Tag size={18} strokeWidth={2.5} />
                                </div>
                                <span className="text-[13px] font-bold text-muted-foreground/80">{t('transactions.category')}</span>
                            </div>
                            <div className="flex items-center bg-muted/30 px-3 py-1.5 rounded-xl border border-border/30 shadow-inner">
                                <span className="text-xs font-black uppercase tracking-wider">
                                    {category?.name || t('transactions.uncategorized')}
                                </span>
                            </div>
                        </div>

                        <div className="h-px bg-border/20 mx-4 sm:mx-6" />

                        {/* Type Row */}
                        <div className="flex items-center justify-between p-4 sm:p-6">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="w-10 h-10 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground shrink-0">
                                    <TrendingUp size={18} strokeWidth={2.5} />
                                </div>
                                <span className="text-[13px] font-bold text-muted-foreground/80">{t('transactions.type')}</span>
                            </div>
                            <div className={cn(
                                "px-3 py-1.5 rounded-xl border font-black uppercase tracking-wider text-[10px]",
                                transaction.type === 'income' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-red-500/10 border-red-500/20 text-red-500"
                            )}>
                                {transaction.type === 'income' ? t('transactions.income') : t('transactions.expense')}
                            </div>
                        </div>

                        <div className="h-px bg-border/20 mx-4 sm:mx-6" />

                        {/* Account Row */}
                        <div className="flex items-center justify-between p-4 sm:p-6">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="w-10 h-10 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground shrink-0">
                                    <Wallet size={18} strokeWidth={2.5} />
                                </div>
                                <span className="text-[13px] font-bold text-muted-foreground/80">{t('settings.account')}</span>
                            </div>
                            <span className="text-[13px] font-black tracking-tight">{account?.name || '—'}</span>
                        </div>
                    </div>
                </div>

                {/* Dangerous Zone */}
                <div className="pt-4">
                    <button
                        onClick={async () => {
                            if (confirm("Delete this transaction?")) {
                                try {
                                    await api.delete(`/transactions/${transaction.id}`);
                                    navigate(-1);
                                } catch (e) {
                                    alert("Error deleting transaction");
                                }
                            }
                        }}
                        className="w-full bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase tracking-[0.2em] text-[11px] py-5 rounded-3xl transition-all"
                    >
                        {t('transactions.delete')}
                    </button>
                </div>
            </div>
        </div>
    );
}
