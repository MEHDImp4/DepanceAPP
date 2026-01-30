import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Search, Filter, TrendingUp, TrendingDown } from "lucide-react";
import type { Transaction } from "@/types";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";
import { cn } from "@/lib/utils";

import { useTransactions, useCreateTransaction, useCategories } from "@/hooks/use-api";
import { useAuthStore } from "@/store/auth-store";

// Helper to group transactions by date
function groupTransactionsByDate(transactions: Transaction[], locale: string) {
    const groups: { [key: string]: Transaction[] } = {};
    transactions.forEach(transaction => {
        const date = new Date(transaction.created_at).toLocaleDateString(locale, { // Use current language
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        if (!groups[date]) groups[date] = [];
        groups[date].push(transaction);
    });
    return groups;
}

export default function Transactions() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { data: transactions = [], isLoading } = useTransactions();

    const { data: categories = [] } = useCategories();
    const user = useAuthStore((state) => state.user);
    const { mutate: createTransaction } = useCreateTransaction();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');

    const handleAddTransaction = (transactionData: Omit<Transaction, "id" | "created_at"> & { account_id: number }) => {
        createTransaction(transactionData, {
            onSuccess: () => setIsAddModalOpen(false)
        });
    };

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || t.category_id === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const groupedTransactions = groupTransactionsByDate(filteredTransactions, i18n.language);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen pb-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24">
            <header className="flex flex-col space-y-4 px-2 pt-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('nav.transactions')}</h1>
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={cn(
                            "p-2.5 rounded-xl border transition-all duration-200",
                            isFilterOpen
                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                : "bg-card border-border text-muted-foreground hover:bg-muted"
                        )}
                    >
                        <Filter size={20} strokeWidth={2} />
                    </button>
                </div>

                {isFilterOpen && (
                    <div className="bg-card border border-border rounded-2xl p-4 shadow-xl space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                {t('common.search')}
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={t('common.search_placeholder')}
                                    className="w-full pl-9 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                {t('transactions.category')}
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setCategoryFilter('all')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all",
                                        categoryFilter === 'all'
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background border-border text-muted-foreground hover:border-primary/50"
                                    )}
                                >
                                    {t('common.all')}
                                </button>
                                {categories.map(category => (
                                    <button
                                        key={category.id}
                                        onClick={() => setCategoryFilter(category.id)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all",
                                            categoryFilter === category.id
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background border-border text-muted-foreground hover:border-primary/50"
                                        )}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            <div className="space-y-8">
                {filteredTransactions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-[2rem] border border-dashed border-border/50">
                        <p>{t('transactions.no_results')}</p>
                    </div>
                ) : (
                    Object.entries(groupedTransactions).map(([date, items]) => (
                        <div key={date} className="space-y-3">
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground px-2">
                                {date}
                            </h3>
                            <div className="bg-card border border-border rounded-[2rem] overflow-hidden divide-y divide-border/40">
                                {items.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        onClick={() => navigate(`/transactions/${transaction.id}`)}
                                        className="group flex items-center justify-between p-5 hover:bg-muted/30 active:bg-muted/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md",
                                                transaction.type === 'income' ? "bg-emerald-500/90" : "bg-red-500/90"
                                            )}>
                                                {transaction.type === 'income' ? <TrendingUp size={18} strokeWidth={2.5} /> : <TrendingDown size={18} strokeWidth={2.5} />}
                                            </div>
                                            <div>
                                                <p className="font-semibold tracking-tight text-[14px] text-foreground/90">{transaction.description}</p>
                                                <div className="h-4 flex items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
                                                    {(() => {
                                                        const category = categories.find(c => c.id === transaction.category_id);
                                                        return category ? (
                                                            <span>{category.name}</span>
                                                        ) : (
                                                            <span>{t('transactions.uncategorized')}</span>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn(
                                                "font-bold tracking-tight text-[14px]",
                                                transaction.type === 'income' ? "text-emerald-500" : "text-foreground"
                                            )}>
                                                {new Intl.NumberFormat(i18n.language, { style: "currency", currency: user?.currency || 'USD' }).format(transaction.amount)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-24 right-4 z-40">
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
                >
                    <Plus size={28} strokeWidth={2.5} />
                </button>
            </div>

            <AddTransactionModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddTransaction}
            />
        </div>
    );
}
