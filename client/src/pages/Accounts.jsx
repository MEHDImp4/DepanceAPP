import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Trash2, Wallet } from 'lucide-react';

const Accounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newAccount, setNewAccount] = useState({ name: '', type: 'normal', balance: '' });
    const [loading, setLoading] = useState(true);

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
            setNewAccount({ name: '', type: 'normal', balance: '' });
            setShowForm(false);
            fetchAccounts();
        } catch (error) { alert('Failed'); }
    };

    const handleDelete = async (id, balance) => {
        if (balance !== 0) { alert('Cannot delete account with non-zero balance'); return; }
        if (!confirm('Are you sure?')) return;
        try { await api.delete(`/accounts/${id}`); fetchAccounts(); } catch (error) { alert('Failed'); }
    };

    const getGradient = (type, index) => {
        if (type === 'savings') return 'linear-gradient(135deg, #FF9F0A 0%, #FF375F 100%)'; // Orange/Pink
        // Alternating blues/purples for checking
        return index % 2 === 0
            ? 'linear-gradient(135deg, #007AFF 0%, #00C7BE 100%)' // Blue/Teal
            : 'linear-gradient(135deg, #5E5CE6 0%, #BF5AF2 100%)'; // Indigo/Purple
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex-between" style={{ padding: '24px 0 24px' }}>
                <h2 className="text-xl">Accounts</h2>
                <button className="flex-center" onClick={() => setShowForm(!showForm)}
                    style={{
                        width: '32px', height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-bg-input)',
                        color: 'var(--color-primary)'
                    }}>
                    <Plus size={20} />
                </button>
            </div>

            {/* Add Form */}
            {showForm && (
                <div className="card animate-slide-up" style={{ marginBottom: '24px' }}>
                    <h3 className="text-sm font-bold text-secondary" style={{ marginBottom: '16px', textTransform: 'uppercase' }}>New Account</h3>
                    <form onSubmit={handleCreate}>
                        <div className="input-group" style={{ marginBottom: '16px' }}>
                            <input className="input" placeholder="Account Name (e.g. Main Checking)" value={newAccount.name} onChange={e => setNewAccount({ ...newAccount, name: e.target.value })} required />
                            <select className="input" value={newAccount.type} onChange={e => setNewAccount({ ...newAccount, type: e.target.value })}>
                                <option value="normal">Current / Checking</option>
                                <option value="savings">Savings</option>
                            </select>
                            <input type="number" step="0.01" className="input" placeholder="Initial Balance ($)" value={newAccount.balance} onChange={e => setNewAccount({ ...newAccount, balance: e.target.value })} />
                        </div>
                        <div className="flex gap-sm">
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create</button>
                            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            {loading ? <p className="text-center text-secondary">Loading...</p> : (
                <div className="flex-col" style={{ gap: '16px' }}>
                    {accounts.map((acc, index) => (
                        <div key={acc.id} style={{
                            position: 'relative',
                            height: '160px',
                            background: getGradient(acc.type, index),
                            borderRadius: 'var(--radius-lg)',
                            padding: '24px',
                            color: 'white',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                            transition: 'transform 0.2s ease',
                        }}>
                            <div className="flex-between">
                                <div className="flex items-center gap-sm">
                                    <Wallet size={24} color="rgba(255,255,255,0.8)" />
                                    <span style={{ fontSize: '15px', fontWeight: '600', opacity: 0.9 }}>{acc.type === 'normal' ? 'Current' : 'Savings'}</span>
                                </div>
                                {acc.balance === 0 && (
                                    <button onClick={() => handleDelete(acc.id, acc.balance)} style={{ color: 'rgba(255,255,255,0.8)' }}>
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>

                            <div>
                                <div style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-0.5px' }}>
                                    ${acc.balance.toFixed(2)}
                                </div>
                                <div style={{ fontSize: '15px', opacity: 0.8, marginTop: '4px' }}>
                                    {acc.name}
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
