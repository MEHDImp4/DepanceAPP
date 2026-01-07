import { useTranslation } from "react-i18next";
import { Plus, Repeat, Trash2, ArrowLeft, Calendar, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate('/settings')}
                        className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-all"
                    >
                        <ArrowLeft size={20} />
                    </motion.button>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            {t('nav.recurring') || "Recurring"}
                        </h1>
                        <p className="text-muted-foreground font-medium">
                            {t('recurring.subtitle') || "Automate your recurring expenses"}
                        </p>
                    </div>
                </div>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsModalOpen(true)}
                    className="w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 transition-all"
                >
                    <Plus size={24} strokeWidth={3} />
                </motion.button>
            </div>

            {/* List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                            <Repeat className="text-muted-foreground opacity-20" size={40} />
                        </motion.div>
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
                        <AnimatePresence mode="popLayout">
                            {recurring.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="relative group bg-card hover:bg-muted/30 border border-border/50 rounded-[2rem] p-4 flex items-center gap-4 transition-all duration-300"
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg",
                                        item.category?.color || "bg-primary"
                                    )}>
                                        <Repeat size={20} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold truncate">{item.description}</h4>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {item.interval}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Wallet size={12} />
                                                {item.account?.name}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right flex flex-col items-end gap-1">
                                        <span className={cn(
                                            "font-black tracking-tight",
                                            item.type === 'income' ? "text-emerald-500" : "text-foreground"
                                        )}>
                                            {item.type === 'income' ? '+' : '-'}
                                            {new Intl.NumberFormat(i18n.language, {
                                                style: "currency",
                                                currency: item.account?.currency || "USD"
                                            }).format(item.amount)}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/40">
                                            Next: {format(new Date(item.next_run_date), "dd MMM", { locale: dateLocale })}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all ml-2"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
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
