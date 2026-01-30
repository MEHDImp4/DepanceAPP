import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Search, Filter, TrendingUp, TrendingDown } from "lucide-react";
import type { Transaction } from "@/types";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";
import { cn } from "@/lib/utils";

import { useTransactions, useCreateTransaction, useAccounts, useCategories } from "@/hooks/use-api";
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

// Initial Mock Data (Expanded) - REMOVED

export default function Transactions() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { data: transactions = [], isLoading } = useTransactions();
    const { data: accounts = [] } = useAccounts();
    const { data: categories = [] } = useCategories();
    const user = useAuthStore((state) => state.user);
    const { mutate: createTransaction } = useCreateTransaction();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const handleAddTransaction = (transactionData: Omit<Transaction, "id" | "created_at"> & { account_id: number }) => {
        createTransaction(transactionData, {
            onSuccess: () => setIsAddModalOpen(false)
        });
    };



    const filteredTransactions = transactions.filter(t =>
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedTransactions = groupTransactionsByDate(filteredTransactions, i18n.language);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen pb-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="pb-32 space-y-8">
            {/* Header */}
            <div className="flex flex-row items-center justify-between pt-6 pb-2 px-1">
                <h1 className="text-3xl font-black tracking-tight">{t('transactions.title')}</h1>
                <div className="flex space-x-3 w-auto justify-end">
                    <button
                        className="w-10 h-10 bg-card border border-border flex items-center justify-center rounded-2xl shadow-xl hover:bg-muted"
                    >
                        <Filter size={18} className="text-muted-foreground" />
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 font-black"
                    >
                        <Plus size={20} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Premium Search */}
            <div className="relative group px-1">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary" size={20} strokeWidth={3} />
                <input
                    type="text"
                    placeholder={t('transactions.search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-card/50 backdrop-blur-sm border border-border/50 rounded-[1.5rem] py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-primary/5 focus:bg-card focus:border-primary/20 font-bold tracking-tight text-[15px]"
                />
            </div>

            {/* Transaction List with Premium Grouping */}
            <div className="space-y-10">
                {Object.entries(groupedTransactions).map(([date, items]) => (
                    <div key={date} className="space-y-4">
                        <h3 className="text-[13px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 px-2">
                            {date}
                        </h3>
                        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-[2.5rem] overflow-hidden divide-y divide-border/30">
                            {items.map((transaction, index) => (
                                <div
                                    key={transaction.id}
                                    onClick={() => navigate(`/transactions/${transaction.id}`)}
                                    className="group flex items-center justify-between p-5 hover:bg-muted/40 pointer-events-auto cursor-pointer"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
                                            transaction.type === 'income' ? "bg-emerald-500" : "bg-red-500"
                                        )}>
                                            {transaction.type === 'income' ? <TrendingUp size={20} strokeWidth={2.5} /> : <TrendingDown size={20} strokeWidth={2.5} />}
                                        </div>
                                        <div>
                                            <p className="font-bold tracking-tight text-[15px]">{transaction.description}</p>
                                            <div className="h-4 flex items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-0.5">
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

                                    <div className="flex items-center space-x-4">
                                        <div className="text-right">
                                            <p className={cn(
                                                "font-black tracking-tight text-[15px]",
                                                transaction.type === 'income' ? "text-emerald-600" : "text-foreground"
                                            )}>
                                                {new Intl.NumberFormat(i18n.language, { style: "currency", currency: accounts.find(a => a.id === transaction.account_id)?.currency || user?.currency || 'USD' }).format(transaction.amount)}
                                                {transaction.type === 'income' ? ' +' : ' -'}
                                            </p>

                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredTransactions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>{t('transactions.no_results')}</p>
                </div>
            )}

            <AddTransactionModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddTransaction}
            />
        </div>
    );
}
