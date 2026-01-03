import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { getCategories } from '../services/categoryService';
import { format, isToday, isYesterday } from 'date-fns';
import { ArrowUp, ArrowDown, Repeat, Plus, X, Tag, Search, Filter } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { formatCurrency, getCurrencySymbol } from '../utils/currencyUtils';

const Transactions = () => {
    const location = useLocation();
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userCurrency, setUserCurrency] = useState('USD');
    const [formMode, setFormMode] = useState(null); // 'transaction' | 'transfer' | null
    const { showToast, isPrivacyMode } = useUI();

    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [accountId, setAccountId] = useState('');
    const [toAccountId, setToAccountId] = useState('');
    const [categoryId, setCategoryId] = useState('');

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'expense', 'income'
    const [filterCategory, setFilterCategory] = useState('all');

    useEffect(() => {
        fetchData();
        if (location.state?.openModal) {
            setFormMode(location.state.openModal);
        }
    }, [location]);

    const fetchData = async () => {
        try {
            const [txRes, accRes, profileRes, catRes] = await Promise.all([
                api.get('/transactions'),
                api.get('/accounts'),
                api.get('/auth/profile'),
                getCategories()
            ]);
            setTransactions(txRes.data);
            setAccounts(accRes.data);
            setCategories(catRes);
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
            if (formMode === 'transaction') {
                await api.post('/transactions', {
                    amount,
                    description,
                    type,
                    account_id: accountId,
                    category_id: categoryId || null
                });
            } else {
                await api.post('/transfers', { amount, description, from_account_id: accountId, to_account_id: toAccountId });
            }
            setFormMode(null); setAmount(''); setDescription(''); setCategoryId(''); fetchData();
            showToast('Transaction saved', 'success');
        } catch (e) { showToast('Operation failed', 'error'); }
    };

    const selectedAccount = accounts.find(a => a.id == accountId);

    // Filter and Group transactions
    const filteredTransactions = transactions.filter(tx => {
        // 1. Search Query (Description or Amount)
        const query = searchQuery.toLowerCase();
        const matchesSearch = tx.description.toLowerCase().includes(query) ||
            tx.amount.toString().includes(query);

        // 2. Filter Type
        const matchesType = filterType === 'all' || tx.type === filterType;

        // 3. Filter Category
        const matchesCategory = filterCategory === 'all' || (tx.category_id && tx.category_id.toString() === filterCategory);

        return matchesSearch && matchesType && matchesCategory;
    });

    const groupedTransactions = filteredTransactions.reduce((groups, tx) => {
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

            {/* Search & Filters */}
            <div style={{ marginBottom: '24px' }}>
                {/* Search Bar */}
                <div style={{
                    position: 'relative',
                    marginBottom: '16px',
                    backgroundColor: 'var(--color-bg-input)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <Search size={18} color="var(--color-text-secondary)" style={{ marginRight: '8px' }} />
                    <input
                        className="input"
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ padding: 0, height: 'auto', border: 'none', fontSize: '14px' }}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} style={{ padding: '4px' }}>
                            <X size={16} color="var(--color-text-secondary)" />
                        </button>
                    )}
                </div>

                {/* Filters Row */}
                <div className="flex gap-sm overflow-x-auto no-scrollbar" style={{ paddingBottom: '4px' }}>
                    {/* Type Filters */}
                    {['all', 'expense', 'income'].map(ft => (
                        <button
                            key={ft}
                            onClick={() => setFilterType(ft)}
                            className="btn"
                            style={{
                                padding: '6px 16px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: '600',
                                backgroundColor: filterType === ft ? 'var(--color-text-primary)' : 'var(--color-bg-card)',
                                color: filterType === ft ? 'var(--color-bg-body)' : 'var(--color-text-secondary)',
                                border: '1px solid var(--color-border)',
                                flexShrink: 0,
                                textTransform: 'capitalize'
                            }}
                        >
                            {ft}
                        </button>
                    ))}

                    <div style={{ width: '1px', backgroundColor: 'var(--color-separator)', margin: '0 8px', height: '20px', alignSelf: 'center' }} />

                    {/* Category Filter Dropdown */}
                    <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        style={{
                            appearance: 'none',
                            padding: '6px 16px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '600',
                            backgroundColor: filterCategory !== 'all' ? 'var(--color-accent)' : 'var(--color-bg-card)',
                            color: filterCategory !== 'all' ? '#fff' : 'var(--color-text-secondary)',
                            border: '1px solid var(--color-border)',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
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
                                <>
                                    <div className="flex gap-md" style={{ marginBottom: '24px' }}>
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

                                    <div style={{ marginBottom: '24px' }}>
                                        <label className="text-xs font-bold text-secondary uppercase" style={{ display: 'block', marginBottom: '8px' }}>Category</label>
                                        <div className="flex gap-sm overflow-x-auto no-scrollbar" style={{ paddingBottom: '4px' }}>
                                            <button type="button" onClick={() => setCategoryId('')} className="btn" style={{
                                                padding: '6px 12px', borderRadius: '20px', fontSize: '12px',
                                                backgroundColor: categoryId === '' ? 'var(--color-text-primary)' : 'var(--color-bg-input)',
                                                color: categoryId === '' ? 'var(--color-bg-body)' : 'var(--color-text-secondary)',
                                                border: 'none', flexShrink: 0
                                            }}>None</button>

                                            {categories.filter(c => c.type === type).map(cat => (
                                                <button key={cat.id} type="button" onClick={() => setCategoryId(cat.id)} className="btn" style={{
                                                    padding: '6px 12px', borderRadius: '20px', fontSize: '12px',
                                                    backgroundColor: categoryId === cat.id ? (cat.color || 'var(--color-primary)') : 'var(--color-bg-input)',
                                                    color: categoryId === cat.id ? '#fff' : 'var(--color-text-secondary)',
                                                    border: 'none', flexShrink: 0
                                                }}>
                                                    {cat.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
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
                            <div className="flex-col gap-sm">
                                {groupedTransactions[date].map((tx, i) => (
                                    <div key={tx.id} className="card" style={{
                                        padding: '12px 16px',
                                        borderRadius: 'var(--radius-lg)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '12px',
                                        backgroundColor: 'var(--color-bg-card)',
                                        marginBottom: '0px'
                                    }}>
                                        <div className="flex" style={{ gap: '12px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                            <div className="flex-center" style={{
                                                width: '40px', height: '40px', borderRadius: '12px',
                                                backgroundColor: tx.category?.color ? `${tx.category.color}20` : (tx.type === 'income' ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 59, 48, 0.12)'),
                                                flexShrink: 0,
                                                color: tx.category?.color || (tx.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)')
                                            }}>
                                                {tx.category ? <Tag size={18} /> : (tx.type === 'income'
                                                    ? <ArrowUp size={18} strokeWidth={3} />
                                                    : <ArrowDown size={18} strokeWidth={3} />
                                                )}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{tx.description}</div>
                                                <div className="text-xs text-secondary flex items-center" style={{ marginTop: '4px', opacity: 0.8 }}>
                                                    <span>{tx.account?.name}</span>
                                                    {tx.category && (
                                                        <span style={{
                                                            color: tx.category.color,
                                                            backgroundColor: `${tx.category.color}15`,
                                                            fontWeight: '700',
                                                            fontSize: '10px',
                                                            padding: '2px 8px',
                                                            borderRadius: '6px',
                                                            marginLeft: '8px',
                                                            letterSpacing: '0.3px',
                                                            display: 'inline-block'
                                                        }}>
                                                            {tx.category.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{
                                            color: tx.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)',
                                            textAlign: 'right',
                                            flexShrink: 0
                                        }}>
                                            <div style={{ fontSize: '15px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                                {tx.type === 'income' ? '+' : '-'}{isPrivacyMode ? '••••' : formatCurrency(tx.convertedAmount || tx.amount, userCurrency)}
                                            </div>
                                            {tx.account?.currency !== userCurrency && (
                                                <div className="text-secondary" style={{ fontSize: '10px', fontWeight: '500', whiteSpace: 'nowrap', marginTop: '1px' }}>
                                                    {tx.type === 'income' ? '+' : '-'}{isPrivacyMode ? '••••' : formatCurrency(tx.amount, tx.account?.currency)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {!loading && filteredTransactions.length === 0 && (
                        <div className="text-center text-secondary" style={{ padding: '40px' }}>
                            {searchQuery || filterType !== 'all' || filterCategory !== 'all'
                                ? 'No transactions match your search.'
                                : 'No transactions yet. Start by adding one!'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Transactions;
