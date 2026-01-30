import { useTranslation } from "react-i18next";
import { Plus, ArrowRightLeft } from "lucide-react";
import { AccountCard } from "@/components/accounts/AccountCard";

import { useState } from "react";
import { useAccounts, useCreateAccount, useUpdateAccount } from "@/hooks/use-api";
import { useCurrencyRates, convertCurrency } from "@/hooks/use-currency";
import { AddAccountModal } from "@/components/accounts/AddAccountModal";
import { TransferModal } from "@/components/accounts/TransferModal";
import type { Account } from "@/types";

import { useAuthStore } from "@/store/auth-store";

export default function Accounts() {
    const { t, i18n } = useTranslation();
    const user = useAuthStore((state) => state.user);
    const { data: accounts = [], isLoading } = useAccounts();
    const createAccount = useCreateAccount();
    const updateAccount = useUpdateAccount();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

    const handleSave = (accountData: Omit<Account, "id"> | Account) => {
        if ('id' in accountData) {
            updateAccount.mutate(accountData as Account, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setSelectedAccount(null);
                }
            });
        } else {
            createAccount.mutate(accountData, {
                onSuccess: () => setIsModalOpen(false)
            });
        }
    };

    const handleEditAccount = (account: Account) => {
        setSelectedAccount(account);
        setIsModalOpen(true);
    };

    const handleAddClick = () => {
        setSelectedAccount(null);
        setIsModalOpen(true);
    };

    const { data: ratesData } = useCurrencyRates();

    // Calculate total net worth with currency conversion
    const totalNetWorth = accounts.reduce((acc, curr) => {
        const convertedBalance = convertCurrency(
            curr.balance,
            curr.currency,
            user?.currency || 'USD',
            ratesData?.rates
        );
        return acc + convertedBalance;
    }, 0);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen pb-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="pb-32 space-y-10">
            <div className="flex items-center justify-between pt-6 pb-2 px-1">
                <h1 className="text-3xl font-black tracking-tight">{t('accounts.title')}</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsTransferModalOpen(true)}
                        className="w-12 h-12 bg-card border border-border text-foreground flex items-center justify-center rounded-2xl shadow-xl shadow-primary/5 hover:bg-muted transition-all"
                        aria-label={t('accounts.transfer_funds') || "Transfer Funds"}
                    >
                        <ArrowRightLeft size={24} strokeWidth={3} />
                    </button>
                    <button
                        onClick={handleAddClick}
                        className="w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 transition-all"
                        aria-label={t('accounts.add_account')}
                    >
                        <Plus size={24} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Overview Card - Premium Style */}
            <div
                className="relative group overflow-hidden bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl shadow-primary/5"
            >
                {/* Decorative Mesh Gradient */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

                <div className="relative space-y-3">
                    <p className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">{t('accounts.total_net_worth')}</p>
                    {(() => {
                        const formattedNetWorth = new Intl.NumberFormat(i18n.language, {
                            style: "decimal",
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2
                        }).format(totalNetWorth);

                        const length = formattedNetWorth.length;
                        // More aggressive scaling: start smaller sooner
                        const textSizeClass = length > 13 ? "text-2xl" : length > 10 ? "text-3xl" : length > 7 ? "text-4xl" : "text-5xl";

                        return (
                            <div className="flex items-baseline space-x-2 whitespace-nowrap">
                                <h2 className={`${textSizeClass} font-black tracking-tighter text-foreground transition-all duration-300`}>
                                    {formattedNetWorth}
                                </h2>
                                <span className="text-[13px] font-black text-muted-foreground uppercase tracking-widest bg-muted/50 px-2 py-0.5 rounded-lg flex-shrink-0">
                                    {user?.currency || 'USD'}
                                </span>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* List with Premium Grouping */}
            <div className="space-y-4">
                <h3 className="text-[12px] uppercase tracking-[0.2em] font-black text-muted-foreground/60 px-2">
                    {t('accounts.my_accounts')}
                </h3>
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-[2rem] overflow-hidden divide-y divide-border/30">
                    {accounts.map((account) => (
                        <AccountCard
                            key={account.id}
                            account={account}
                            onClick={handleEditAccount}
                        />
                    ))}
                </div>
            </div>

            <AddAccountModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedAccount(null);
                }}
                onAdd={handleSave}
                account={selectedAccount}
            />

            <TransferModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                accounts={accounts}
            />
        </div>
    );
}
