import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { Lock, Mail } from "lucide-react";

export default function Login() {
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login, isAuthenticated } = useAuth();
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
            login(data.token, data.user);
            navigate("/");
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to login");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-xl"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">{t("auth.login_title")}</h1>
                    <p className="text-muted-foreground">{t("auth.login_subtitle")}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg text-center font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <input
                                type="text"
                                placeholder={t("auth.email_placeholder")} // Ensure you have a translation for "Email or Username" or update this key
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full bg-muted/40 border border-transparent rounded-xl py-3 pl-10 pr-4 focus:border-primary focus:bg-background outline-none transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <input
                                type="password"
                                placeholder={t("auth.password_placeholder")}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-muted/40 border border-transparent rounded-xl py-3 pl-10 pr-4 focus:border-primary focus:bg-background outline-none transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mx-auto" />
                        ) : (
                            t("auth.login_button")
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <span className="text-muted-foreground">{t("auth.no_account")} </span>
                    <Link to="/register" className="text-primary font-medium hover:underline">
                        {t("auth.register_button")}
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
