import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";

export function MobileLayout() {
    return (
        <div className="min-h-screen bg-background pb-24 overflow-x-hidden relative selection:bg-primary/20">
            {/* Background Decorative Element - Reduced for OLED purity but kept subtle */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-20">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px]" />
            </div>

            <main className="container mx-auto px-4 py-4 max-w-md">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
}
