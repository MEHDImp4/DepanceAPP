import { motion } from "framer-motion";
import type { Transaction } from "@/types";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCategories } from "@/hooks/use-api";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

interface RecentTransactionsProps {
    transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { data: categories = [] } = useCategories();
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-xs uppercase tracking-[0.2em] font-black text-muted-foreground/60">
                    {t('dashboard.recent_transactions')}
                </h3>
                <Link to="/transactions" className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">
                    {t('common.see_all')}
                </Link>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-[2rem] overflow-hidden divide-y divide-border/30">
                {transactions.map((transaction, index) => (
                    <motion.div
                        key={transaction.id}
                        layoutId={`transaction-${transaction.id}`}
                        onClick={() => navigate(`/transactions/${transaction.id}`)}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group flex items-center justify-between p-5 hover:bg-muted/40 transition-all duration-300 pointer-events-auto cursor-pointer"
                    >
                        <div className="flex items-center space-x-4">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                                transaction.type === 'income' ? "bg-emerald-500" : "bg-red-500"
                            )}>
                                {transaction.type === 'income' ? <TrendingUp size={20} strokeWidth={2.5} /> : <TrendingDown size={20} strokeWidth={2.5} />}
                            </div>
                            <div>
                                <p className="font-bold tracking-tight text-[14px]">{transaction.description}</p>
                                <div className="h-4 flex items-center text-[8px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-0.5">
                                    {(() => {
                                        const category = categories.find(c => c.id === transaction.category_id);
                                        return category ? (
                                            <span className="flex items-center gap-1.5">
                                                <CategoryIcon icon={category.icon} size={14} strokeWidth={2.5} />
                                                <span>{category.name}</span>
                                            </span>
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
                                {transaction.type === 'income' ? '+' : '-'} {new Intl.NumberFormat(i18n.language, { style: "currency", currency: user?.currency || 'USD' }).format(transaction.amount)}
                            </p>
                            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
                                {new Date(transaction.created_at).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                    </motion.div>
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
