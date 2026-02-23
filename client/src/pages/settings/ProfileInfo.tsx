import { useTranslation } from "react-i18next";
import type { User } from "@/types";
import { useAuthStore } from "@/store/auth-store";
import { useUpdateProfile } from "@/hooks/use-api";
import { ArrowLeft, AtSign, User as UserIcon, Banknote } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PremiumSelect } from "@/components/ui/PremiumSelect";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ProfileInfo() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const setAuth = useAuthStore((state) => state.setAuth);
    const updateProfile = useUpdateProfile();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCurrencyChange = (currency: string) => {
        setIsSubmitting(true);
        updateProfile.mutate({ currency }, {
            onSuccess: (response: { data: User }) => {
                setAuth(response.data);
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            }
        });
    };

    return (
        <div className="pb-24 space-y-8 max-w-2xl mx-auto px-4 sm:px-0">
            <div className="flex items-center space-x-4 pt-6 pb-2">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-black tracking-tight">{t('settings.profile_info') || "Profile Information"}</h1>
            </div>

            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4 py-8">
                <div className="relative">
                    <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-card shadow-2xl">
                        <img
                            src={`https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=random&size=200&bold=true`}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
                <div className="text-center space-y-1">
                    <h2 className="text-2xl font-black tracking-tight">{user?.username}</h2>
                    <p className="text-muted-foreground font-medium">{user?.email}</p>
                </div>
            </div>

            {/* Info Cards */}
            <div className="space-y-6">
                <div className="bg-card border border-border rounded-[2rem] p-6 space-y-6 shadow-xl shadow-primary/5">

                    {/* Username (Read Only for now) */}
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                            {t('auth.username') || "Username"}
                        </label>
                        <div className="flex items-center space-x-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                <UserIcon size={20} />
                            </div>
                            <span className="font-bold flex-1">{user?.username}</span>
                            <span className="text-[10px] uppercase font-black tracking-widest bg-muted px-2 py-1 rounded-md text-muted-foreground">
                                Read Only
                            </span>
                        </div>
                    </div>

                    {/* Email (Read Only) */}
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                            {t('auth.email') || "Email"}
                        </label>
                        <div className="flex items-center space-x-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500">
                                <AtSign size={20} />
                            </div>
                            <span className="font-bold flex-1 truncate">{user?.email}</span>
                            <span className="text-[10px] uppercase font-black tracking-widest bg-muted px-2 py-1 rounded-md text-muted-foreground">
                                Read Only
                            </span>
                        </div>
                    </div>

                    {/* Currency (Editable) */}
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                            {t('settings.currency') || "Currency"}
                        </label>
                        <div className={cn(
                            "flex items-center space-x-4 p-3 rounded-2xl border transition-all duration-300",
                            isSubmitting ? "bg-muted/50 border-border/50 opacity-70" : "bg-card border-border hover:border-primary/50 hover:bg-muted/20"
                        )}>
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 ml-1">
                                <Banknote size={20} />
                            </div>
                            <div className="flex-1">
                                <PremiumSelect
                                    value={user?.currency || 'USD'}
                                    onChange={handleCurrencyChange}
                                    options={[
                                        { label: "USD - US Dollar", value: "USD" },
                                        { label: "EUR - Euro", value: "EUR" },
                                        { label: "MAD - Moroccan Dirham", value: "MAD" },
                                        { label: "GBP - British Pound", value: "GBP" },
                                        { label: "CAD - Canadian Dollar", value: "CAD" },
                                        { label: "AUD - Australian Dollar", value: "AUD" },
                                        { label: "JPY - Japanese Yen", value: "JPY" },
                                        { label: "CHF - Swiss Franc", value: "CHF" },
                                        { label: "CNY - Chinese Yuan", value: "CNY" },
                                        { label: "SEK - Swedish Krona", value: "SEK" },
                                        { label: "NZD - New Zealand Dollar", value: "NZD" }
                                    ]}
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground ml-2">
                            {t('settings.currency_helper') || "This will update how values are displayed across the app."}
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
