import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Activity, ArrowDownRight, ArrowUpRight, TrendingUp } from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { useSpendingTrends } from '@/hooks/use-api';
import { SpendingChart } from '@/components/analytics/SpendingChart';
import { cn } from '@/lib/utils';

type Period = 'week' | 'month' | 'year' | 'all';

export default function Analytics() {
    const { t, i18n } = useTranslation();
    const isFr = i18n.language.startsWith('fr');
    const [period, setPeriod] = useState<Period>('month');

    const { data: trends, isLoading } = useSpendingTrends(period);

    const periods: { value: Period; label: string }[] = [
        { value: 'week', label: '1W' },
        { value: 'month', label: '1M' },
        { value: 'year', label: '1Y' },
        { value: 'all', label: 'ALL' },
    ];

    const totals = useMemo(() => {
        if (!trends) return { income: 0, expense: 0, net: 0 };
        const inc = trends.reduce((acc, curr) => acc + curr.income, 0);
        const exp = trends.reduce((acc, curr) => acc + curr.expense, 0);
        return { income: inc, expense: exp, net: inc - exp };
    }, [trends]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat(isFr ? 'fr-FR' : 'en-US', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="space-y-6 pb-24">
            <PageHeader
                title="Analytics"
                description={t('nav.analytics_desc', 'Visualize your spending trends over time')} // You might need to add this to translations
            />

            {/* Main Chart Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-5 shadow-lg relative overflow-hidden"
            >
                {/* Background Blobs for styling */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-destructive/10 rounded-full blur-3xl -ml-10 -mb-10" />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 relative z-10">
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp size={16} /> Cash Flow
                        </h3>
                        <p className={cn(
                            "text-3xl font-bold mt-1 tracking-tight",
                            totals.net >= 0 ? "text-primary" : "text-destructive"
                        )}>
                            {totals.net >= 0 ? '+' : ''}{formatCurrency(totals.net)}
                        </p>
                    </div>

                    {/* Time Filters */}
                    <div className="flex items-center bg-black/20 p-1 rounded-2xl border border-white/5 mx-auto sm:mx-0">
                        {periods.map((p) => (
                            <button
                                key={p.value}
                                onClick={() => setPeriod(p.value)}
                                className={cn(
                                    "px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300",
                                    period === p.value
                                        ? "bg-card text-foreground shadow-md"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-[280px] w-full -ml-3 relative z-10">
                    {isLoading ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        </div>
                    ) : (
                        <SpendingChart data={trends || []} period={period} />
                    )}
                </div>
            </motion.div>

            {/* KPI Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 gap-4"
            >
                <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                            <ArrowUpRight size={20} strokeWidth={2.5} />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Income</p>
                    <p className="text-2xl font-bold tracking-tight">{formatCurrency(totals.income)}</p>
                </div>

                <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-destructive/10 rounded-2xl text-destructive">
                            <ArrowDownRight size={20} strokeWidth={2.5} />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Expense</p>
                    <p className="text-2xl font-bold tracking-tight">{formatCurrency(totals.expense)}</p>
                </div>
            </motion.div>
        </div>
    );
}
