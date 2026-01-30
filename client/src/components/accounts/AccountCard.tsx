import { cn } from "@/lib/utils";
import { Wallet, CreditCard, Building, ChevronRight, PiggyBank } from "lucide-react";

interface Account {
    id: number;
    name: string;
    type: string;
    balance: number;
    currency: string;
    color?: string;
}

interface AccountCardProps {
    account: Account;
    onClick?: (account: Account) => void;
}

import { useTranslation } from "react-i18next";

export function AccountCard({ account, onClick }: AccountCardProps) {
    const { t, i18n } = useTranslation();
    const Icon = account.type === 'bank' ? Building : account.type === 'credit' ? CreditCard : account.type === 'savings' ? PiggyBank : Wallet;
    const colorClass = account.color || "bg-primary";

    return (
        <div
            onClick={() => onClick?.(account)}
            className="group flex items-center justify-between p-5 hover:bg-muted/40 transition-all duration-300 cursor-pointer"
        >
            <div className="flex items-center space-x-4 min-w-0 flex-1 mr-4">
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0",
                    colorClass
                )}>
                    <Icon size={20} />
                </div>
                <div className="min-w-0">
                    <h3 className="font-bold tracking-tight text-[15px] truncate">{account.name}</h3>
                    <p className="text-[12px] font-black uppercase tracking-widest text-muted-foreground/60">{account.type}</p>
                </div>
            </div>
            <div className="flex items-center space-x-4 flex-shrink-0">
                <div className="text-right">
                    <p className="font-black tracking-tight text-[17px]">
                        {new Intl.NumberFormat(i18n.language, {
                            style: "decimal",
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2
                        }).format(account.balance)} {account.currency}
                    </p>
                    <div className="flex items-center justify-end space-x-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                            {t('accounts.active')}
                        </span>
                    </div>
                </div>
                <ChevronRight size={18} className="text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-1 transition-all" />
            </div>
        </div>
    );
}
