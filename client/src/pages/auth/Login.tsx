import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { useTranslation } from "react-i18next";

import api from "@/lib/axios";
import { Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function Login() {
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const login = useAuthStore((state) => state.setAuth);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/", { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const { data } = await api.post("/auth/login", { identifier, password });
            login(data.user);
            navigate("/");
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to login");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-primary/5 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-md space-y-8 bg-card/30 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-black tracking-tight">{t("auth.login_title")}</h1>
                    <p className="text-sm font-medium text-muted-foreground">{t("auth.login_subtitle")}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div
                            className="bg-destructive/10 text-destructive text-xs p-3 rounded-2xl text-center font-bold border border-destructive/20"
                        >
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder={t("auth.email_or_username_placeholder")}
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full bg-background/50 border border-border rounded-2xl py-3.5 pl-12 pr-4 focus:border-primary focus:bg-background outline-none transition-all font-medium placeholder:text-muted-foreground/50"
                                required
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder={t("auth.password_placeholder")}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-background/50 border border-border rounded-2xl py-3.5 pl-12 pr-12 focus:border-primary focus:bg-background outline-none transition-all font-medium placeholder:text-muted-foreground/50"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-2xl hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center space-x-2 shadow-lg shadow-primary/25"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>{t("auth.login_button")}</span>
                                <ArrowRight size={18} strokeWidth={2.5} />
                            </>
                        )}
                    </button>
                </form>

                <div className="text-center">
                    <p className="text-muted-foreground text-sm font-medium">
                        {t("auth.no_account")}{" "}
                        <Link to="/register" className="text-primary font-bold hover:underline transition-all">
                            {t("auth.register_button")}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
