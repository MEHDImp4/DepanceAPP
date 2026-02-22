import { useMemo } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { fr, enUS } from 'date-fns/locale';

interface SpendingChartProps {
    data: { date: string; income: number; expense: number }[];
    period: 'week' | 'month' | 'year' | 'all';
}

export function SpendingChart({ data, period }: SpendingChartProps) {
    const { i18n } = useTranslation();
    const isFr = i18n.language.startsWith('fr');
    const locale = isFr ? fr : enUS;

    const formattedData = useMemo(() => {
        return data.map(point => {
            const dateObj = period === 'year' || period === 'all'
                ? new Date(point.date + '-01') // YYYY-MM
                : parseISO(point.date); // YYYY-MM-DD

            let dateLabel = '';
            if (period === 'week') {
                dateLabel = format(dateObj, 'EEEEE', { locale }); // M, T, W...
            } else if (period === 'month') {
                dateLabel = format(dateObj, 'dd MMM', { locale });
            } else {
                dateLabel = format(dateObj, 'MMM yy', { locale });
            }

            return {
                ...point,
                dateLabel,
                fullDate: dateObj,
            };
        });
    }, [data, period, locale]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat(isFr ? 'fr-FR' : 'en-US', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(value);
    };

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground bg-card/40 rounded-3xl border border-white/5">
                No data available for this period.
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.15} />

                    <XAxis
                        dataKey="dateLabel"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        dy={10}
                        minTickGap={20}
                    />

                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        tickFormatter={(value) => `€${value}`}
                    />

                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-card/90 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-xl">
                                        <p className="font-medium text-sm mb-2 text-foreground">
                                            {format(payload[0].payload.fullDate, 'PPP', { locale })}
                                        </p>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-destructive" />
                                                <span className="text-xs text-muted-foreground mr-4">Expense</span>
                                                <span className="text-sm font-semibold ml-auto">{formatCurrency(payload[1]?.value as number || 0)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span className="text-xs text-muted-foreground mr-4">Income</span>
                                                <span className="text-sm font-semibold ml-auto">{formatCurrency(payload[0]?.value as number || 0)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />

                    <Area
                        type="monotone"
                        dataKey="income"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorIncome)"
                        activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--primary))" }}
                    />
                    <Area
                        type="monotone"
                        dataKey="expense"
                        stroke="hsl(var(--destructive))"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorExpense)"
                        activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--destructive))" }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
