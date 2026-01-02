import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { currencies, formatCurrency } from '../utils/currencyUtils';

const Accounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newAccount, setNewAccount] = useState({ name: '', type: 'normal', balance: '', currency: 'USD' });
    const [loading, setLoading] = useState(true);
    const [editingAccount, setEditingAccount] = useState(null);
    const { showToast, showConfirm } = useUI();

    useEffect(() => { fetchAccounts(); }, []);

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/accounts');
            setAccounts(res.data);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/accounts', newAccount);
            setNewAccount({ name: '', type: 'normal', balance: '', currency: 'USD' });
            setShowForm(false);
            fetchAccounts();
            showToast('Account created successfully', 'success');
        } catch (error) { showToast('Failed to create account', 'error'); }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/accounts/${editingAccount.id}`, editingAccount);
            setEditingAccount(null);
            fetchAccounts();
            showToast('Account updated', 'success');
        } catch (error) { showToast('Failed to update', 'error'); }
    };

    const handleDelete = (id, balance) => {
        if (balance !== 0) {
            showToast('Cannot delete account with funds', 'error');
            return;
        }

        showConfirm('Delete Account', 'Are you sure you want to delete this account?', async () => {
            try {
                await api.delete(`/accounts/${id}`);
                fetchAccounts();
                showToast('Account deleted', 'info');
            } catch (error) {
                showToast('Failed to delete account', 'error');
            }
        }, { isDestructive: true, confirmText: 'Delete' });
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex-between" style={{ padding: '8px 0 20px' }}>
                <h2 className="text-xl">Accounts</h2>
                <button className="flex-center" onClick={() => setShowForm(!showForm)}
                    style={{
                        width: '28px', height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-bg-input)',
                        color: 'var(--color-primary)'
                    }}>
                    <Plus size={18} />
                </button>
            </div>

            {/* Add Form */}
            {showForm && (
                <div className="card animate-slide-up" style={{ marginBottom: '24px' }}>
                    <h3 className="text-sm font-bold text-secondary" style={{ marginBottom: '16px', textTransform: 'uppercase' }}>New Account</h3>
                    <form onSubmit={handleCreate}>
                        <div className="input-group" style={{ marginBottom: '16px' }}>
                            <input className="input" placeholder="Account Name (e.g. Main Checking)" value={newAccount.name} onChange={e => setNewAccount({ ...newAccount, name: e.target.value })} required />
                            <div className="flex gap-sm" style={{ borderBottom: '0.5px solid var(--color-separator)' }}>
                                <select className="input" value={newAccount.type} onChange={e => setNewAccount({ ...newAccount, type: e.target.value })} style={{ flex: 1, borderBottom: 'none' }}>
                                    <option value="normal">Current / Checking</option>
                                    <option value="savings">Savings</option>
                                </select>
                                <select className="input" value={newAccount.currency} onChange={e => setNewAccount({ ...newAccount, currency: e.target.value })} style={{ width: '80px', borderBottom: 'none' }}>
                                    {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                </select>
                            </div>
                            <input type="number" step="0.01" className="input" placeholder="Initial Balance" value={newAccount.balance} onChange={e => setNewAccount({ ...newAccount, balance: e.target.value })} />
                        </div>
                        <div className="flex gap-sm">
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create</button>
                            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit Form Modal Overlay */}
            {editingAccount && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 2000, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }} onClick={() => setEditingAccount(null)}>
                    <div className="card animate-slide-up" style={{ width: '100%', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold" style={{ marginBottom: '20px' }}>Edit Account</h3>
                        <form onSubmit={handleUpdate}>
                            <div className="input-group" style={{ marginBottom: '20px' }}>
                                <input className="input" value={editingAccount.name} onChange={e => setEditingAccount({ ...editingAccount, name: e.target.value })} required />
                                <div className="flex gap-sm" style={{ borderBottom: '0.5px solid var(--color-separator)' }}>
                                    <select className="input" value={editingAccount.type} onChange={e => setEditingAccount({ ...editingAccount, type: e.target.value })} style={{ flex: 1, borderBottom: 'none' }}>
                                        <option value="normal">Current</option>
                                        <option value="savings">Savings</option>
                                    </select>
                                    <select className="input" value={editingAccount.currency} onChange={e => setEditingAccount({ ...editingAccount, currency: e.target.value })} style={{ width: '80px', borderBottom: 'none' }}>
                                        {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-sm">
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Update</button>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditingAccount(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List */}
            {loading ? <p className="text-center text-secondary">Loading...</p> : (
                <div className="flex-col" style={{ gap: '16px' }}>
                    {accounts.map((acc, index) => (
                        <div key={acc.id} className="card" onClick={() => setEditingAccount(acc)} style={{
                            position: 'relative',
                            height: '140px',
                            backgroundColor: 'var(--color-bg-card)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '24px',
                            color: 'var(--color-text-primary)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: 'var(--shadow-md)',
                            border: 'none',
                            cursor: 'pointer'
                        }}>
                            <div className="flex-between">
                                <div className="flex items-center gap-md">
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '50%',
                                        backgroundColor: acc.type === 'savings' ? 'rgba(255, 149, 0, 0.1)' : 'rgba(0, 122, 255, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Wallet
                                            size={24}
                                            color={acc.type === 'savings' ? 'var(--color-warning)' : 'var(--color-accent)'}
                                            strokeWidth={2}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold">{acc.name}</h3>
                                        <span className="text-xs text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{acc.type === 'normal' ? 'Current' : 'Savings'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-md" onClick={e => e.stopPropagation()}>
                                    <span className="text-xs font-bold text-accent" style={{
                                        opacity: 0.9,
                                        backgroundColor: 'rgba(0, 122, 255, 0.12)',
                                        padding: '4px 8px',
                                        borderRadius: '6px'
                                    }}>{acc.currency}</span>
                                    {acc.balance === 0 && (
                                        <button onClick={() => handleDelete(acc.id, acc.balance)} style={{ color: 'var(--color-text-tertiary)', padding: '4px' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', letterSpacing: '-1.5px' }}>
                                    {formatCurrency(acc.balance, acc.currency)}
                                </div>
                            </div>
                        </div>
                    ))}
                    {!loading && accounts.length === 0 && (
                        <div className="text-center text-secondary" style={{ padding: '40px' }}>
                            No accounts found. Create one!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Accounts;
