import { useTranslation } from "react-i18next";
import { CapitalCard } from "@/components/dashboard/CapitalCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { useSummary, useAccounts, useProcessRecurring } from "@/hooks/use-api";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useCurrencyRates, convertCurrency } from "@/hooks/use-currency";
import { motion } from "framer-motion";
import { Wallet } from "lucide-react";

export default function Dashboard() {
    const { t, i18n } = useTranslation();
    const { data: summary, isLoading: isSummaryLoading, error } = useSummary();
    const { data: accounts = [] } = useAccounts();
    const { data: ratesData } = useCurrencyRates();
    const user = useAuthStore((state) => state.user);
    const processRecurring = useProcessRecurring();

    useEffect(() => {
        processRecurring.mutate();
    }, []);

    if (isSummaryLoading) {
        return (
            <div className="flex items-center justify-center h-screen pb-32">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-muted border-t-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen pb-32 space-y-4 px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                    <p className="text-2xl">⚠️</p>
                </div>
                <h2 className="text-xl font-black tracking-tight">{t('common.error_dashboard_title')}</h2>
                <p className="text-muted-foreground text-sm max-w-xs">{t('common.error_dashboard_desc')}</p>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.reload()}
                    className="mt-4 px-8 py-3 bg-card border border-border rounded-2xl font-black uppercase tracking-widest text-[12px] hover:bg-muted transition-colors"
                >
                    {t('common.retry')}
                </motion.button>
            </div>
        );
    }

    const totalCapital = accounts.reduce((acc, curr) => {
        const convertedBalance = convertCurrency(
            curr.balance,
            curr.currency,
            user?.currency || 'USD',
            ratesData?.rates
        );
        return acc + convertedBalance;
    }, 0);
    const transactions = summary?.transactions?.slice(0, 5) || [];

    return (
        <div className="space-y-6 pb-32 relative">

            <header className="flex flex-col items-center py-6 px-1 space-y-4 relative">

                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 transition-transform hover:rotate-6">
                    <Wallet className="text-primary-foreground" size={28} />
                </div>
                <div className="space-y-1 text-center">
                    <p className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">
                        {new Date().toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <h1 className="text-3xl font-black tracking-tight">{t('nav.dashboard')}</h1>
                </div>
            </header>

            <section>
                <CapitalCard amount={totalCapital} currency={user?.currency || 'USD'} />
            </section>

            <section>
                <RecentTransactions transactions={transactions} />
            </section>

        </div>
    );
}
