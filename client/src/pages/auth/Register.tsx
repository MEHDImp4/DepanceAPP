import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";
import { Lock, Mail, User, Eye, EyeOff, UserPlus } from "lucide-react";

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
        <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-card/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
                    {/* Inner glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

                    <div className="text-center mb-10 relative">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 border border-primary/20"
                        >
                            <UserPlus className="text-primary" size={32} />
                        </motion.div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                            {t("auth.register_title")}
                        </h1>
                        <p className="text-muted-foreground/80 font-medium">{t("auth.register_subtitle")}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 relative">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                    className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-2xl text-center font-semibold overflow-hidden"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4">
                            <div className="group relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors duration-300">
                                    <User size={20} />
                                </div>
                                <input
                                    type="text"
                                    placeholder={t("auth.username_placeholder")}
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-muted-foreground/30 focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all duration-300"
                                    required
                                />
                            </div>

                            <div className="group relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors duration-300">
                                    <Mail size={20} />
                                </div>
                                <input
                                    type="email"
                                    placeholder={t("auth.email_placeholder")}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-muted-foreground/30 focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all duration-300"
                                    required
                                />
                            </div>

                            <div className="group relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors duration-300">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder={t("auth.password_placeholder")}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-muted-foreground/30 focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all duration-300"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-primary transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full relative group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-primary opacity-90 group-hover:opacity-100 transition-opacity" />
                            <div className="relative flex items-center justify-center space-x-2 py-4 px-6 text-primary-foreground font-bold rounded-2xl transition-transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none">
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                ) : (
                                    <span>{t("auth.register_button")}</span>
                                )}
                            </div>
                        </button>
                    </form>

                    <div className="mt-8 text-center relative">
                        <p className="text-muted-foreground/60 font-medium">
                            {t("auth.have_account")}{" "}
                            <Link
                                to="/login"
                                className="text-primary hover:text-primary/80 transition-colors font-bold relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-primary after:origin-right after:scale-x-0 hover:after:scale-x-100 hover:after:origin-left after:transition-transform"
                            >
                                {t("auth.login_button")}
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
