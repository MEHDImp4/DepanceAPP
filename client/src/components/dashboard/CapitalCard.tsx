import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface CapitalCardProps {
    amount: number;
    currency: string;
}

export function CapitalCard({ amount, currency }: CapitalCardProps) {
    const { t, i18n } = useTranslation();
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative group overflow-hidden bg-card border border-border rounded-[2.5rem] p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.98]"
        >
            {/* Decorative Mesh Gradient Background */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

            <div className="relative space-y-3">
                <h2 className="text-[13px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                    {t('dashboard.total_capital')}
                </h2>

                <div className="flex items-baseline space-x-2 whitespace-nowrap">
                    {(() => {
                        const formattedAmount = new Intl.NumberFormat(i18n.language, {
                            style: "decimal",
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2
                        }).format(amount);

                        const length = formattedAmount.length;
                        // More aggressive scaling: start smaller sooner
                        const textSizeClass = length > 13 ? "text-2xl" : length > 10 ? "text-3xl" : length > 7 ? "text-4xl" : "text-5xl";

                        return (
                            <span className={`${textSizeClass} font-black tracking-tighter text-foreground transition-all duration-300`}>
                                {formattedAmount}
                            </span>
                        );
                    })()}
                    <span className="text-[14px] font-black text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-lg flex-shrink-0">
                        {currency}
                    </span>
                </div>

                <div className="pt-2 flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                    <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">
                        {t('dashboard.live_balance')}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
