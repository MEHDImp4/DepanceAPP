import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Target, Repeat, Settings, ChevronRight } from "lucide-react";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface MoreMenuDrawerProps {
    children: React.ReactNode;
}

export function MoreMenuDrawer({ children }: MoreMenuDrawerProps) {
    const { t } = useTranslation();
    const location = useLocation();
    const [open, setOpen] = useState(false);

    const menuItems = [
        { icon: Settings, label: t('nav.settings'), path: "/settings", color: "text-slate-500", bg: "bg-slate-500/10" },
        { icon: Target, label: t('nav.goals', 'Goals'), path: "/goals", color: "text-pink-500", bg: "bg-pink-500/10" },
        { icon: Repeat, label: t('nav.recurring', 'Recurring'), path: "/recurring", color: "text-orange-500", bg: "bg-orange-500/10" },
    ];

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {children}
            </DrawerTrigger>
            <DrawerContent className="bg-card/95 backdrop-blur-xl border-t border-border/50">
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle className="text-center font-bold">{t('nav.more_options', 'More Options')}</DrawerTitle>
                        <DrawerDescription className="sr-only">
                            {t('nav.more_options', 'More Options')}
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 pb-12 space-y-3">
                        {menuItems.map(({ icon: Icon, label, path, color, bg }) => {
                            const isActive = location.pathname === path;
                            return (
                                <Link
                                    key={path}
                                    to={path}
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        "flex items-center space-x-4 p-4 rounded-2xl transition-all duration-300 active:scale-95 group border border-transparent",
                                        isActive
                                            ? "bg-primary/10 border-primary/20"
                                            : "bg-muted/30 hover:bg-muted/50 border-white/5"
                                    )}
                                >
                                    <div className={cn("p-2.5 rounded-xl transition-colors duration-300", isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : bg)}>
                                        <Icon size={22} className={cn(isActive ? "text-primary-foreground" : color)} />
                                    </div>
                                    <span className={cn(
                                        "font-bold text-base flex-1",
                                        isActive ? "text-primary" : "text-foreground"
                                    )}>
                                        {label}
                                    </span>
                                    <ChevronRight size={20} className="text-muted-foreground/40 group-hover:text-foreground transition-all group-hover:translate-x-1" />
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
