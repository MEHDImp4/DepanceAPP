import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ArrowRightLeft, Wallet, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

import { useTranslation } from "react-i18next";

export function DesktopLayout() {
    const location = useLocation();
    const { t } = useTranslation();

    const menuItems = [
        { icon: LayoutDashboard, label: t('nav.dashboard'), path: "/" },
        { icon: ArrowRightLeft, label: t('nav.transactions'), path: "/transactions" },
        { icon: Wallet, label: t('nav.accounts'), path: "/accounts" },
        { icon: LayoutDashboard, label: t('nav.templates'), path: "/templates" }, // Reusing icon for now or need new import
        { icon: Settings, label: t('nav.settings'), path: "/settings" },
    ];

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card p-6 hidden lg:flex flex-col">
                <div className="mb-10 pl-2 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <Wallet className="text-primary-foreground" size={24} />
                    </div>
                    <span className="font-black text-xl tracking-tight">Depance<span className="text-primary tracking-tighter italic">APP</span></span>
                </div>
                <nav className="space-y-2">
                    {menuItems.map(({ icon: Icon, label, path }) => {
                        const isActive = location.pathname === path;
                        return (
                            <Link
                                key={path}
                                to={path}
                                className={cn(
                                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-auto">
                <div className="max-w-4xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
