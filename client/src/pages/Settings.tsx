import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/auth-store";
import { useUpdateProfile } from "@/hooks/use-api";
import { Moon, Sun, User, Bell, Shield, ChevronRight, LogOut, Globe, Repeat, Target, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumSelect } from "@/components/ui/PremiumSelect";
import { useNavigate } from "react-router-dom";

// Simple theme hook
function useTheme() {
    const [theme, setTheme] = useState<"light" | "dark">(() => {
        if (typeof window !== "undefined") {
            const savedTheme = localStorage.getItem("theme");
            if (savedTheme === "dark" || savedTheme === "light") {
                if (savedTheme === "dark") document.documentElement.classList.add("dark");
                return savedTheme;
            }
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return "dark";
            }
        }
        return "light";
    });

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        if (newTheme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    };

    return { theme, toggleTheme };
}

interface SettingsItem {
    icon: LucideIcon;
    label: string;
    value?: string;
    action?: React.ReactNode;
    onClick?: () => void;
    color?: string;
}

interface SettingsSection {
    title: string;
    items: SettingsItem[];
}

export default function Settings() {
    const { theme, toggleTheme } = useTheme();
    const { t, i18n } = useTranslation();
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const setAuth = useAuthStore((state) => state.setAuth);
    const updateUser = setAuth; // Alias for compatibility
    const updateProfile = useUpdateProfile();
    const navigate = useNavigate();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const handleCurrencyChange = (currency: string) => {
        updateProfile.mutate({ currency }, {
            onSuccess: (response) => {
                updateUser(response.data);
            }
        });
    };

    const sections: SettingsSection[] = [
        {
            title: t('settings.tools', 'Tools'),
            items: [
                {
                    icon: Repeat as LucideIcon,
                    label: t('nav.recurring') || "Recurring Transactions",
                    color: "bg-orange-500",
                    onClick: () => navigate('/recurring')
                },
                {
                    icon: Target as LucideIcon,
                    label: t('nav.goals') || "Goals",
                    color: "bg-pink-500",
                    onClick: () => navigate('/goals')
                },
            ]
        },
        {
            title: t('settings.app_settings'),
            items: [
                {
                    icon: (theme === "light" ? Moon : Sun) as LucideIcon,
                    label: t('settings.dark_mode'),
                    color: "bg-indigo-500",
                    action: (
                        <div
                            onClick={toggleTheme}
                            className={cn(
                                "relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 cursor-pointer",
                                theme === "dark" ? "bg-indigo-600" : "bg-muted"
                            )}
                        >
                            <span
                                className={cn(
                                    "inline-block h-4 w-4 transform rounded-full bg-white shadow-xl transition-transform duration-300",
                                    theme === "dark" ? "translate-x-6" : "translate-x-1"
                                )}
                            />
                        </div>
                    )
                },
                {
                    icon: Globe as LucideIcon,
                    label: t('settings.language'),
                    color: "bg-blue-500",
                    action: (
                        <PremiumSelect
                            value={i18n.language.split('-')[0]}
                            onChange={changeLanguage}
                            options={[
                                { label: "English", value: "en" },
                                { label: "Français", value: "fr" }
                            ]}
                        />
                    )
                },
                {
                    icon: Globe as LucideIcon,
                    label: t('settings.currency'),
                    color: "bg-emerald-500",
                    action: (
                        <PremiumSelect
                            value={user?.currency || 'USD'}
                            onChange={handleCurrencyChange}
                            options={[
                                { label: "USD ($)", value: "USD" },
                                { label: "EUR (€)", value: "EUR" },
                                { label: "MAD (DH)", value: "MAD" },
                                { label: "GBP (£)", value: "GBP" },
                                { label: "CAD ($)", value: "CAD" },
                                { label: "AUD ($)", value: "AUD" },
                                { label: "JPY (¥)", value: "JPY" },
                                { label: "CHF (Fr)", value: "CHF" },
                                { label: "CNY (¥)", value: "CNY" },
                                { label: "SEK (kr)", value: "SEK" },
                                { label: "NZD ($)", value: "NZD" }
                            ]}
                        />
                    )
                },
                { icon: Bell as LucideIcon, label: t('settings.notifications'), value: t('settings.on'), color: "bg-red-400" },
            ]
        },
        {
            title: t('settings.account'),
            items: [
                { icon: User as LucideIcon, label: t('settings.profile_info'), color: "bg-gray-400" },
                { icon: Shield as LucideIcon, label: t('settings.security_privacy'), color: "bg-amber-500" },
            ]
        }
    ];

    return (
        <div className="pb-24 space-y-8 max-w-2xl mx-auto px-4 sm:px-0">
            <div className="flex items-center justify-between pt-6 pb-2">
                <h1 className="text-3xl font-extrabold tracking-tight">{t('settings.title')}</h1>
            </div>

            {/* Profile Header - Premium Card */}
            <div className="relative group overflow-hidden bg-card border border-border rounded-[2.5rem] p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.98]">
                {/* Decorative Mesh Gradient Background */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

                <div className="relative flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-[2rem] overflow-hidden border-2 border-background shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                            <img
                                src={`https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=random&size=160&bold=true`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-card rounded-full shadow-lg" />
                    </div>

                    <div className="flex-1 space-y-1 min-w-0 w-full">
                        <div className="flex items-center justify-center sm:justify-start space-x-2">
                            <h2 className="text-2xl font-black tracking-tight leading-none truncate">{user?.username || 'User'}</h2>
                        </div>
                        <p className="text-muted-foreground font-medium text-sm truncate">
                            {user?.email}
                        </p>
                        <div className="pt-2 flex justify-center sm:justify-start">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-400 text-green-950 shadow-sm">
                                {t('settings.member')}
                            </span>
                        </div>
                    </div>

                    <button className="hidden sm:block p-3 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-all duration-300 transform hover:rotate-90">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Menu Sections */}
            <div className="space-y-8">
                {sections.map((section, idx) => (
                    <div
                        key={idx}
                        className="space-y-4 relative"
                        style={{ zIndex: sections.length - idx }}
                    >
                        <h3 className="text-xs uppercase tracking-[0.2em] font-black text-muted-foreground/60 px-2">
                            {section.title}
                        </h3>
                        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-[2rem] divide-y divide-border/30">
                            {section.items.map((item, itemIdx) => {
                                const Icon = item.icon;
                                const isFirst = itemIdx === 0;
                                const isLast = itemIdx === section.items.length - 1;

                                return (
                                    <div
                                        key={itemIdx}
                                        onClick={item.onClick}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3.5 hover:bg-muted/50 transition-all duration-300 text-left group gap-2.5",
                                            isFirst && "rounded-t-[2rem]",
                                            isLast && "rounded-b-[2rem]"
                                        )}
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className={cn(
                                                "p-2.5 rounded-xl text-white shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                                                item.color || "bg-primary"
                                            )}>
                                                <Icon size={20} />
                                            </div>
                                            <span className="font-bold tracking-tight text-sm">{item.label}</span>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            {item.value && (
                                                <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                                                    {item.value}
                                                </span>
                                            )}
                                            {item.action ? item.action : (
                                                <ChevronRight size={18} className="text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Logout Button */}
            <button
                onClick={logout}
                className="group w-full p-3.5 rounded-[2rem] bg-red-500/5 text-red-500 border border-red-500/10 font-black tracking-tight flex items-center justify-center space-x-3 hover:bg-red-500 hover:text-white transition-all duration-500 shadow-xl shadow-red-500/0 hover:shadow-red-500/20 active:scale-95"
            >
                <LogOut size={22} className="transition-transform group-hover:-translate-x-1" />
                <span className="text-lg">{t('settings.logout')}</span>
            </button>

            <div className="flex flex-col items-center space-y-1 pt-4 pb-8">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                    {t('app.version')}
                </p>
            </div>
        </div>
    );
}
