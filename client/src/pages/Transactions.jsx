import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { format, isToday, isYesterday } from 'date-fns';
import { ArrowUp, ArrowDown, Repeat, Plus, X } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { formatCurrency, getCurrencySymbol } from '../utils/currencyUtils';

const Transactions = () => {
    const location = useLocation();
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userCurrency, setUserCurrency] = useState('USD');
    const [formMode, setFormMode] = useState(null); // 'transaction' | 'transfer' | null
    const { showToast } = useUI();

    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [accountId, setAccountId] = useState('');
    const [toAccountId, setToAccountId] = useState('');

    useEffect(() => {
        fetchData();
        if (location.state?.openModal) {
            setFormMode(location.state.openModal);
        }
    }, [location]);

    const fetchData = async () => {
        try {
            const [txRes, accRes, profileRes] = await Promise.all([
                api.get('/transactions'),
                api.get('/accounts'),
                api.get('/auth/profile')
            ]);
            setTransactions(txRes.data);
            setAccounts(accRes.data);
            setUserCurrency(profileRes.data.currency || 'USD');
            if (accRes.data.length > 0) {
                setAccountId(accRes.data[0].id);
                if (accRes.data.length > 1) setToAccountId(accRes.data[1].id);
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formMode === 'transaction') await api.post('/transactions', { amount, description, type, account_id: accountId });
            else await api.post('/transfers', { amount, description, from_account_id: accountId, to_account_id: toAccountId });
            setFormMode(null); setAmount(''); setDescription(''); fetchData();
            showToast('Transaction saved', 'success');
        } catch (e) { showToast('Operation failed', 'error'); }
    };

    const selectedAccount = accounts.find(a => a.id == accountId);

    // Group transactions by date
    const groupedTransactions = transactions.reduce((groups, tx) => {
        const date = format(new Date(tx.created_at), 'yyyy-MM-dd');
        if (!groups[date]) groups[date] = [];
        groups[date].push(tx);
        return groups;
    }, {});

    const getDateLabel = (dateStr) => {
        const date = new Date(dateStr);
        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMMM d');
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
            {/* Header with Actions */}
            <div className="flex-between" style={{ padding: '8px 0 20px' }}>
                <h2 className="text-xl">Transactions</h2>
                <div className="flex gap-sm">
                    <button className="btn btn-secondary flex-center" onClick={() => setFormMode('transfer')} style={{ padding: '8px' }}>
                        <Repeat size={18} />
                    </button>
                    <button className="btn btn-primary flex-center" onClick={() => setFormMode('transaction')} style={{ padding: '8px' }}>
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            {/* Modal-like Form Overlay */}
            {formMode && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 2000,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }} onClick={() => setFormMode(null)}>
                    <div className="card animate-slide-up" style={{
                        width: '100%', maxWidth: '500px',
                        borderRadius: 'var(--radius-lg)',
                        margin: 0, padding: '24px',
                        maxHeight: '90vh', overflowY: 'auto'
                    }} onClick={e => e.stopPropagation()}>

                        <div className="flex-between" style={{ marginBottom: '24px' }}>
                            <h3 className="text-lg">{formMode === 'transaction' ? 'New Transaction' : 'Transfer'}</h3>
                            <button onClick={() => setFormMode(null)} className="flex-center" style={{ width: '32px', height: '32px', backgroundColor: 'var(--color-bg-input)', borderRadius: '50%' }}>
                                <X size={20} color="var(--color-text-secondary)" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="flex-center" style={{ marginBottom: '32px' }}>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="input"
                                    placeholder="0"
                                    autoFocus
                                    step="0.01"
                                    style={{
                                        fontSize: 'var(--font-size-xxl)', fontWeight: '700', textAlign: 'center',
                                        border: 'none', background: 'transparent', width: '180px', padding: 0
                                    }}
                                    required
                                />
                                <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--color-text-tertiary)', marginLeft: '8px' }}>
                                    {getCurrencySymbol(selectedAccount?.currency)}
                                </span>
                            </div>

                            <div className="input-group" style={{ marginBottom: '24px' }}>
                                <input className="input" placeholder="Description (e.g. Groceries)" value={description} onChange={e => setDescription(e.target.value)} required />
                                <div style={{ padding: '16px 0', borderBottom: '0.5px solid var(--color-separator)' }}>
                                    <label className="text-xs font-bold text-secondary uppercase" style={{ display: 'block', marginBottom: '8px' }}>Account</label>
                                    <select className="input" value={accountId} onChange={e => setAccountId(e.target.value)} style={{ padding: 0, border: 'none' }}>
                                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{formMode === 'transfer' ? 'From: ' : ''}{acc.name} ({acc.currency})</option>)}
                                    </select>
                                </div>
                                {formMode === 'transfer' && (
                                    <div style={{ padding: '16px 0' }}>
                                        <label className="text-xs font-bold text-secondary uppercase" style={{ display: 'block', marginBottom: '8px' }}>To</label>
                                        <select className="input" value={toAccountId} onChange={e => setToAccountId(e.target.value)} style={{ padding: 0, border: 'none' }}>
                                            {accounts.filter(a => a.id != accountId).map(acc => <option key={acc.id} value={acc.id}>To: {acc.name} ({acc.currency})</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {formMode === 'transaction' && (
                                <div className="flex gap-md" style={{ marginBottom: '32px' }}>
                                    <button type="button" className="btn flex-1" onClick={() => setType('expense')} style={{
                                        backgroundColor: type === 'expense' ? 'var(--color-bg-input)' : 'transparent',
                                        color: type === 'expense' ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                                        border: type === 'expense' ? '1px solid var(--color-danger)' : '1px solid var(--color-border)'
                                    }}>Expense</button>
                                    <button type="button" className="btn flex-1" onClick={() => setType('income')} style={{
                                        backgroundColor: type === 'income' ? 'var(--color-bg-input)' : 'transparent',
                                        color: type === 'income' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                                        border: type === 'income' ? '1px solid var(--color-success)' : '1px solid var(--color-border)'
                                    }}>Income</button>
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary btn-block">
                                {formMode === 'transaction' ? 'Save Transaction' : 'Send Transfer'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* List */}
            {loading ? <p className="text-center text-secondary">Loading...</p> : (
                <div className="flex-col gap-lg">
                    {Object.keys(groupedTransactions).sort((a, b) => new Date(b) - new Date(a)).map(date => (
                        <div key={date}>
                            <h3 className="text-sm font-bold text-secondary uppercase" style={{ marginBottom: '12px', paddingLeft: '8px' }}>
                                {getDateLabel(date)}
                            </h3>
                            <div className="flex-col gap-sm"> {/* Changed from card to flex-col gap-sm */}
                                {groupedTransactions[date].map((tx, i) => (
                                    <div key={tx.id} className="card" style={{
                                        padding: '12px 16px',
                                        borderRadius: 'var(--radius-lg)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '12px',
                                        backgroundColor: 'var(--color-bg-card)',
                                        marginBottom: '0px' // Removed margin-bottom from here, added gap to parent
                                    }}>
                                        <div className="flex" style={{ gap: '12px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                            <div className="flex-center" style={{
                                                width: '40px', height: '40px', borderRadius: '12px',
                                                backgroundColor: tx.type === 'income' ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 59, 48, 0.12)',
                                                flexShrink: 0
                                            }}>
                                                {tx.type === 'income'
                                                    ? <ArrowUp size={18} color="var(--color-success)" strokeWidth={3} />
                                                    : <ArrowDown size={18} color="var(--color-danger)" strokeWidth={3} />
                                                }
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{tx.description}</div>
                                                <div className="text-xs text-secondary" style={{ marginTop: '2px', opacity: 0.8 }}>
                                                    {tx.account?.name}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{
                                            color: tx.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)',
                                            textAlign: 'right',
                                            flexShrink: 0
                                        }}>
                                            <div style={{ fontSize: '15px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.convertedAmount || tx.amount, userCurrency)}
                                            </div>
                                            {tx.account?.currency !== userCurrency && (
                                                <div className="text-secondary" style={{ fontSize: '10px', fontWeight: '500', whiteSpace: 'nowrap', marginTop: '1px' }}>
                                                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, tx.account?.currency)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {!loading && transactions.length === 0 && (
                        <div className="text-center text-secondary" style={{ padding: '40px' }}>
                            No transactions yet. Start by adding one!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Transactions;
