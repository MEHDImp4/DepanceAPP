import { useTranslation } from "react-i18next";
import { Plus, Wallet, ShoppingCart, Home, Car, Lightbulb, Coffee, Smartphone, Plane, TrendingUp, TrendingDown, Music, Tv2, Film, Ghost, PlayCircle, Apple, MonitorPlay, Dumbbell, Shirt, UtensilsCrossed, Settings2, Check, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useTemplates, useCreateTemplate, useUpdateTemplate, useCreateTransaction } from "@/hooks/use-api";
import { useState } from "react";
import { AddTemplateModal } from "@/components/templates/AddTemplateModal";
import type { Template } from "@/types";

const ICON_MAP: { [key: string]: LucideIcon } = {
    Home,
    ShoppingCart,
    Car,
    Wallet,
    Lightbulb,
    Coffee,
    Smartphone,
    Plane,
    TrendingUp,
    TrendingDown,
    Music,
    Tv2,
    Film,
    Ghost,
    PlayCircle,
    Apple,
    MonitorPlay,
    Dumbbell,
    Shirt,
    UtensilsCrossed,
    Default: Wallet
};

export default function Templates() {
    const { t, i18n } = useTranslation();
    const { data: templates = [], isLoading } = useTemplates();
    const createTemplate = useCreateTemplate();
    const updateTemplate = useUpdateTemplate();
    const createTransaction = useCreateTransaction();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [applyingId, setApplyingId] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState<Template | null>(null);

    const handleAddTemplate = (newTemplate: Omit<Template, "id">) => {
        createTemplate.mutate(newTemplate, {
            onSuccess: () => setIsModalOpen(false)
        });
    };

    const handleUpdateTemplate = (id: number, updatedTemplate: Omit<Template, "id">) => {
        updateTemplate.mutate({ id, ...updatedTemplate }, {
            onSuccess: () => {
                setIsModalOpen(false);
                setTemplateToEdit(null);
            }
        });
    };

    const handleApplyTemplate = (template: Template) => {
        if (!template.default_account_id) {
            alert(t('templates.no_account_error') || "Please set a default account for this template");
            return;
        }

        setApplyingId(template.id);
        createTransaction.mutate({
            amount: template.amount,
            description: template.name, // Use template name as description
            type: template.type,
            account_id: template.default_account_id,
            category_id: template.category_id || undefined
        }, {
            onSuccess: () => {
                setTimeout(() => setApplyingId(null), 1000);
            },
            onError: () => {
                setApplyingId(null);
                alert("Error applying template");
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen pb-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="pb-32 space-y-10">
            <div className="flex items-center justify-between pt-6 pb-2 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight">{t('templates.title')}</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">
                        {t('templates.subtitle')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setIsEditMode(!isEditMode);
                            if (isEditMode) setTemplateToEdit(null);
                        }}
                        className={cn(
                            "w-12 h-12 flex items-center justify-center rounded-2xl transition-all shadow-xl",
                            isEditMode
                                ? "bg-emerald-500 text-white shadow-emerald-500/20"
                                : "bg-card border border-border text-muted-foreground hover:text-primary"
                        )}
                        aria-label="Manage Templates"
                    >
                        {isEditMode ? <Check size={22} strokeWidth={3} /> : <Settings2 size={22} strokeWidth={2.5} />}
                    </button>

                    <button
                        onClick={() => {
                            setTemplateToEdit(null);
                            setIsModalOpen(true);
                        }}
                        className="w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 transition-all"
                        aria-label={t('templates.add_template')}
                    >
                        <Plus size={24} strokeWidth={3} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {templates.map((template) => {
                    const IconComponent = ICON_MAP[template.icon_name || 'Default'] || Wallet;
                    const isApplying = applyingId === template.id;

                    return (
                        <button
                            key={template.id}
                            disabled={isApplying}
                            onClick={() => {
                                if (isEditMode) {
                                    setTemplateToEdit(template);
                                    setIsModalOpen(true);
                                } else {
                                    handleApplyTemplate(template);
                                }
                            }}
                            className={cn(
                                "relative group overflow-hidden bg-card/60 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-xl hover:shadow-primary/10 transition-all duration-500 text-center flex flex-col items-center space-y-3",
                                isApplying && "ring-2 ring-primary/50 bg-primary/5",
                                isEditMode && "ring-2 ring-emerald-500/30 bg-emerald-500/5 group-hover:ring-emerald-500/50"
                            )}
                        >
                            {/* Animated Background Glow */}
                            <div className={cn(
                                "absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-5 transition-all duration-700 group-hover:opacity-15 group-hover:scale-110",
                                template.color || "bg-primary"
                            )} />

                            <div className={cn(
                                "w-16 h-16 rounded-[1.4rem] flex items-center justify-center text-white shadow-xl relative overflow-hidden shrink-0 border border-black/10 dark:border-white/10",
                                template.color || "bg-primary"
                            )}>
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/30" />
                                <div className="absolute inset-0 bg-black/15 dark:bg-transparent" />
                                {isApplying ? (
                                    <div>
                                        <Plus size={28} strokeWidth={3} className="drop-shadow-sm" />
                                    </div>
                                ) : (
                                    <IconComponent size={28} strokeWidth={3} className="relative z-10 transition-transform duration-500 group-hover:scale-110 drop-shadow-sm" />
                                )}
                            </div>

                            <div className="space-y-0.5 flex-1">
                                <h3 className="font-extrabold tracking-tight text-[18px] leading-tight text-foreground/90 group-hover:text-primary transition-colors duration-300">
                                    {template.name}
                                </h3>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 shrink-0">
                                        {template.default_account?.name || "No Account"}
                                    </span>
                                    {isEditMode && (
                                        <div className="bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                                            <Settings2 size={8} strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={cn(
                                "font-black tracking-tighter text-[22px] leading-none flex items-center justify-center gap-1.5 shrink-0",
                                template.type === 'income' ? "text-emerald-500" : "text-foreground"
                            )}>
                                {new Intl.NumberFormat(i18n.language, {
                                    style: "currency",
                                    currency: template.default_account?.currency || "USD",
                                    maximumFractionDigits: 0
                                }).format(template.amount)}
                                <span className="text-[0.7em] opacity-40 translate-y-[1px]">{template.type === 'income' ? ' +' : ' -'}</span>
                            </div>
                        </button>
                    );
                })}

                {/* Add New Placeholder */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="border-2 border-dashed border-muted-foreground/20 p-6 rounded-[2rem] flex flex-col items-center justify-center space-y-3 text-muted-foreground/40 hover:bg-muted/30 hover:text-primary hover:border-primary/30 transition-all duration-500 group"
                >
                    <div className="w-14 h-14 rounded-[1.2rem] bg-muted/40 flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-110 transition-all shrink-0">
                        <Plus size={24} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest">{t('templates.create_new')}</span>
                </button>
            </div>

            <AddTemplateModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setTemplateToEdit(null);
                }}
                onAdd={handleAddTemplate}
                onUpdate={handleUpdateTemplate}
                templateToEdit={templateToEdit}
            />
        </div>
    );
}
