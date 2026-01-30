import { useTranslation } from "react-i18next";
import { Plus, Repeat, Trash2, ArrowLeft, Calendar, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";
import { useRecurring, useDeleteRecurring, useProcessRecurring } from "@/hooks/use-api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { AddRecurringModal } from "@/components/recurring/AddRecurringModal";

export default function Recurring() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { data: recurring = [], isLoading } = useRecurring();
    const deleteRecurring = useDeleteRecurring();
    const processRecurring = useProcessRecurring();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Process on load to ensure everything is up to date
    useEffect(() => {
        processRecurring.mutate();
    }, []);

    const handleDelete = (id: number) => {
        if (window.confirm(t('common.confirm_delete') || "Are you sure?")) {
            deleteRecurring.mutate(id);
        }
    };

    const dateLocale = i18n.language === 'fr' ? fr : enUS;

    return (
        <div className="pb-24 space-y-8 max-w-4xl mx-auto px-4 sm:px-0">
            {/* Header */}
            <div className="flex items-center justify-between pt-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/settings')}
                        className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            {t('nav.recurring') || "Recurring"}
                        </h1>
                        <p className="text-muted-foreground font-medium">
                            {t('recurring.subtitle') || "Automate your recurring expenses"}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 transition-all"
                >
                    <Plus size={24} strokeWidth={3} />
                </button>
            </div>

            {/* List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin">
                            <Repeat className="text-muted-foreground opacity-20" size={40} />
                        </div>
                    </div>
                ) : recurring.length === 0 ? (
                    <div className="bg-card/50 border border-dashed border-border rounded-[2.5rem] p-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto text-muted-foreground/30">
                            <Repeat size={32} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg">{t('recurring.empty_title') || "No recurring transactions"}</h3>
                            <p className="text-muted-foreground text-sm max-w-[200px] mx-auto">
                                {t('recurring.empty_desc') || "Add your first one to start automating"}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {recurring.map((item) => (
                            <div
                                key={item.id}
                                className="relative group bg-card hover:bg-muted/30 border border-border/50 rounded-[2rem] p-6 flex flex-col items-center text-center gap-3 transition-all duration-300"
                            >
                                <div className={cn(
                                    "w-16 h-16 rounded-[1.4rem] flex items-center justify-center text-white shadow-lg relative overflow-hidden shrink-0 border border-black/10 dark:border-white/10",
                                    item.category?.color || "bg-primary"
                                )}>
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/30" />
                                    <div className="absolute inset-0 bg-black/15 dark:bg-transparent" />
                                    <Repeat size={28} strokeWidth={3} className="relative z-10 drop-shadow-sm" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-extrabold tracking-tight text-[18px] leading-tight text-foreground/90">{item.description}</h4>
                                    <div className="flex items-center justify-center gap-3 mt-1">
                                        <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                                            <Calendar size={11} strokeWidth={2.5} />
                                            {item.interval}
                                        </span>
                                        <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                                            <Wallet size={11} strokeWidth={2.5} />
                                            {item.account?.name}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-1.5 shrink-0">
                                    <span className={cn(
                                        "font-black tracking-tighter text-[22px] leading-none flex items-center gap-1.5",
                                        item.type === 'income' ? "text-emerald-500" : "text-foreground"
                                    )}>
                                        {new Intl.NumberFormat(i18n.language, {
                                            style: "currency",
                                            currency: item.account?.currency || "USD"
                                        }).format(item.amount)}
                                        {item.type === 'income' ? ' +' : ' -'}
                                    </span>
                                    <span className="text-[11px] uppercase tracking-widest font-black text-muted-foreground/50">
                                        Next: {format(new Date(item.next_run_date), "dd MMM", { locale: dateLocale })}
                                    </span>
                                </div>

                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all absolute top-4 right-4"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <AddRecurringModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
