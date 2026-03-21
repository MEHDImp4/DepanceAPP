import { useTranslation } from "react-i18next";
import { useChangePassword, useLoginHistory } from "@/hooks/use-api";
import { ArrowLeft, Lock, KeyRound, ShieldCheck, History, Laptop, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, isValid } from "date-fns";

export default function SecurityPrivacy() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const changePassword = useChangePassword();
    const { data: loginHistory } = useLoginHistory();

    // Password Form State
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword.length < 8) {
            setMessage({ type: 'error', text: t('auth.password_min_length') || "Password must be at least 8 characters long" });
            return;
        }

        changePassword.mutate({ oldPassword, newPassword }, {
            onSuccess: () => {
                setMessage({ type: 'success', text: t('settings.password_changed') || "Password updated successfully" });
                setOldPassword("");
                setNewPassword("");
            },
            onError: (err: any) => {
                setMessage({ type: 'error', text: err.response?.data?.error || "Failed to update password" });
            }
        });
    };

    return (
        <div className="pb-24 space-y-8 max-w-2xl mx-auto px-4 sm:px-0">
            <div className="flex items-center space-x-4 pt-6 pb-2">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-black tracking-tight">{t('settings.security_privacy') || "Security & Privacy"}</h1>
            </div>

            {/* Change Password Section */}
            <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-[0.2em] font-black text-muted-foreground/60 px-2">
                    {t('settings.change_password') || "Change Password"}
                </h3>
                <div className="bg-card border border-border rounded-[2rem] p-6 shadow-xl shadow-primary/5">
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                                {t('auth.current_password') || "Current Password"}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 text-muted-foreground/50" size={18} />
                                <input
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    className="w-full bg-muted/30 border border-border rounded-xl py-3 pl-11 pr-4 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                                {t('auth.new_password') || "New Password"}
                            </label>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-3.5 text-muted-foreground/50" size={18} />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-muted/30 border border-border rounded-xl py-3 pl-11 pr-4 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {message && (
                            <div className={cn(
                                "p-3 rounded-xl text-sm font-bold text-center animate-in fade-in slide-in-from-top-1",
                                message.type === 'success' ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                            )}>
                                {message.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={changePassword.isPending}
                            className={cn(
                                "w-full py-3.5 rounded-xl font-black tracking-tight text-white shadow-lg transition-all active:scale-[0.98]",
                                changePassword.isPending ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-orange-500/25"
                            )}
                        >
                            {changePassword.isPending ? "Updating..." : (t('settings.update_password') || "Update Password")}
                        </button>
                    </form>
                </div>
            </div>

            {/* Login History Section */}
            <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-[0.2em] font-black text-muted-foreground/60 px-2 flex items-center justify-between">
                    <span>{t('settings.login_history') || "Login History"}</span>
                    <ShieldCheck size={14} className="text-muted-foreground" />
                </h3>
                <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-xl shadow-primary/5">
                    {loginHistory?.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            No login history available.
                        </div>
                    ) : (
                        <div className="divide-y divide-border/30">
                            {loginHistory?.map((login: any) => (
                                <div key={login.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className={cn(
                                            "p-2.5 rounded-xl",
                                            login.deviceType === 'mobile' ? "bg-blue-500/10 text-blue-500" : "bg-slate-500/10 text-slate-500"
                                        )}>
                                            {login.deviceType === 'mobile' ? <Smartphone size={18} /> : <Laptop size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-tight">
                                                {login.ipAddress || "Unknown IP"}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                                {login.userAgent && login.userAgent.length > 30
                                                    ? login.userAgent.substring(0, 30) + "..."
                                                    : login.userAgent || "Unknown Device"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {(() => {
                                            const loginDate = login.timestamp ? new Date(login.timestamp) : null;
                                            const timeAgo = loginDate && isValid(loginDate)
                                                ? formatDistanceToNow(loginDate, { addSuffix: true })
                                                : "Unknown time";

                                            return (
                                                <>
                                        <div className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider mb-1",
                                            login.success ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                                        )}>
                                            {login.success ? "Success" : "Failed"}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-medium flex items-center justify-end gap-1">
                                            <History size={10} />
                                            {timeAgo}
                                        </p>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <p className="text-[10px] text-muted-foreground text-center px-4">
                    {t('settings.security_notice') || "If you see suspicious activity, change your password immediately."}
                </p>
            </div>
        </div>
    );
}
