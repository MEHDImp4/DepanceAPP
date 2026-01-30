import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ArrowRightLeft, Wallet, Settings, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

import { useTranslation } from "react-i18next";

export function BottomNav() {
    const location = useLocation();
    const { t } = useTranslation();

    const navItems = [
        { icon: LayoutDashboard, label: t('nav.home'), path: "/" },
        { icon: ArrowRightLeft, label: t('nav.transact'), path: "/transactions" },
        { icon: LayoutGrid, label: t('nav.templates'), path: "/templates" },
        { icon: Wallet, label: t('nav.accounts'), path: "/accounts" },
        { icon: Settings, label: t('nav.settings'), path: "/settings" },
    ];

    return (
        <div className="fixed bottom-6 left-4 right-4 z-50 pointer-events-none">
            <nav className="max-w-md mx-auto pointer-events-auto bg-card/85 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40 rounded-[2.5rem] p-2 flex justify-around items-center">
                {navItems.map(({ icon: Icon, label, path }) => {
                    const isActive = location.pathname === path;
                    return (
                        <Link
                            key={path}
                            to={path}
                            className="relative flex flex-col items-center justify-center w-full py-2 group"
                        >
                            {isActive && (
                                <div
                                    className="absolute inset-0 bg-primary/15 rounded-3xl"
                                />
                            )}
                            <div className={cn(
                                "relative z-10 p-1.5 rounded-2xl transition-all duration-300",
                                isActive ? "scale-110" : "group-active:scale-95"
                            )}>
                                <Icon
                                    size={22}
                                    className={cn(
                                        "transition-colors duration-300",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}
                                    absoluteStrokeWidth
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                            </div>
                            <span className={cn(
                                "relative z-10 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 mt-0.5",
                                isActive ? "text-primary" : "text-muted-foreground",
                                "hidden xs:block",
                                "max-[380px]:hidden"
                            )}>
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
