import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";

export function MobileLayout() {
    return (
        <div className="min-h-screen bg-background pb-28 overflow-x-hidden">
            {/* Background Decorative Element */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/2 rounded-full blur-[100px]" />
                <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-indigo-500/3 rounded-full blur-[120px]" />
            </div>

            <main className="container mx-auto px-4 py-6 max-w-md">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
}
