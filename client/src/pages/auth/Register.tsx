import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";
import { Lock, Mail, User, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function Register() {
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const register = useAuthStore((state) => state.setAuth);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
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
            const { data } = await api.post("/auth/register", { username, email, password });
            register(data.user);
            navigate("/");
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to register");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-black tracking-tight">{t("auth.register_title")}</h1>
                    <p className="text-muted-foreground">{t("auth.register_subtitle")}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-destructive/15 text-destructive text-sm p-3 rounded-xl text-center font-bold"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <input
                                type="text"
                                placeholder={t("auth.username_placeholder")}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-muted/40 border border-transparent rounded-xl py-3 pl-10 pr-4 focus:border-primary focus:bg-background outline-none transition-colors"
                                required
                            />
                        </div>

                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <input
                                type="email"
                                placeholder={t("auth.email_placeholder")}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-muted/40 border border-transparent rounded-xl py-3 pl-10 pr-4 focus:border-primary focus:bg-background outline-none transition-colors"
                                required
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder={t("auth.password_placeholder")}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-muted/40 border border-transparent rounded-xl py-3 pl-10 pr-12 focus:border-primary focus:bg-background outline-none transition-colors"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>{t("auth.register_button")}</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="text-center">
                    <p className="text-muted-foreground text-sm">
                        {t("auth.have_account")}{" "}
                        <Link to="/login" className="text-primary font-bold hover:underline">
                            {t("auth.login_button")}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
