
import { useTranslation } from "react-i18next";

interface CapitalCardProps {
    amount: number;
    currency: string;
}

export function CapitalCard({ amount, currency }: CapitalCardProps) {
    const { t, i18n } = useTranslation();
    return (
        <div
            className="relative group overflow-hidden bg-card border border-border rounded-[2.5rem] p-8"
        >
            {/* Decorative Mesh Gradient Background */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

            <div className="relative space-y-3">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
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
                            <span className={`${textSizeClass} font-bold tracking-tight text-foreground`}>
                                {formattedAmount}
                            </span>
                        );
                    })()}
                    <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-lg flex-shrink-0">
                        {currency}
                    </span>
                </div>

                <div className="pt-2 flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {t('dashboard.live_balance')}
                    </span>
                </div>
            </div>
        </div>
    );
}
