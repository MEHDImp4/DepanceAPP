
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
            <div className="flex items-center justify-between px-1">
                <h3 className="text-[13px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">
                    {t('dashboard.recent_transactions')}
                </h3>
                <Link to="/transactions" className="text-[12px] font-black uppercase tracking-widest text-primary hover:opacity-70">
                    {t('common.see_all')}
                </Link>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-[2rem] overflow-hidden divide-y divide-border/30">
                {transactions.map((transaction, index) => (
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

                        <div className="text-right">
                            <p className={cn(
                                "font-black tracking-tight text-[14px]",
                                transaction.type === 'income' ? "text-emerald-600" : "text-foreground"
                            )}>
                                {new Intl.NumberFormat(i18n.language, { style: "currency", currency: user?.currency || 'USD' }).format(transaction.amount)}
                                {transaction.type === 'income' ? ' +' : ' -'}
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
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
