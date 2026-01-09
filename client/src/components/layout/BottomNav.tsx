import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ArrowRightLeft, Wallet, Settings, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
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
            <nav className="max-w-md mx-auto pointer-events-auto bg-card/70 backdrop-blur-lg border border-white/20 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-2 flex justify-around items-center">
                {navItems.map(({ icon: Icon, label, path }) => {
                    const isActive = location.pathname === path;
                    return (
                        <Link
                            key={path}
                            to={path}
                            className="relative flex flex-col items-center justify-center w-full py-2 group"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-primary/10 rounded-3xl"
                                    transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                                />
                            )}
                            <div className={cn(
                                "relative z-10 p-1.5 rounded-2xl transition-all duration-300",
                                isActive ? "scale-110" : "group-hover:scale-105"
                            )}>
                                <Icon
                                    size={20}
                                    className={cn(
                                        "transition-colors duration-300",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                            </div>
                            <span className={cn(
                                "relative z-10 text-[9px] font-black uppercase tracking-widest transition-all duration-300",
                                isActive ? "text-primary" : "text-muted-foreground",
                                // Hide text on small screens (<380px), show on larger screens
                                "hidden xs:block",
                                // On very small screens, maybe show only active label? 
                                // For now, let's keep it simple: hidden on tiny screens to fix the crash.
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
