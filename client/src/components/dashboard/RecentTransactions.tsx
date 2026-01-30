
import type { Transaction } from "@/types";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { useCategories } from "@/hooks/use-api";

interface RecentTransactionsProps {
    transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
    const { t, i18n } = useTranslation();
    const user = useAuthStore((state) => state.user);
    const { data: categories = [] } = useCategories();
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
                    {t('dashboard.recent_transactions')}
                </h3>
                <Link to="/transactions" className="text-[11px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors">
                    {t('common.see_all')}
                </Link>
            </div>

            <div className="bg-card border border-border rounded-[2rem] overflow-hidden divide-y divide-border/40">
                {transactions.map((transaction) => (
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
                                {transaction.type === 'income' ? ' +' : ' -'}
                            </p>
                            <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-tighter">
                                {new Date(transaction.created_at).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {transactions.length === 0 && (
                <div className="text-center py-10 bg-muted/20 rounded-[2rem] border border-dashed border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        {t('dashboard.no_transactions')}
                    </p>
                </div>
            )}
        </div>
    );
}
