import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Zap, ShoppingBag, Coffee, Car, Home } from 'lucide-react';

const Templates = () => {
    const [templates, setTemplates] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', amount: '', description: '', default_account_id: '' });

    // Icon selection helper could be added, for now random or default
    const getIcon = (name) => {
        const n = name.toLowerCase();
        if (n.includes('coffee') || n.includes('food')) return <Coffee size={24} />;
        if (n.includes('car') || n.includes('gas')) return <Car size={24} />;
        if (n.includes('rent') || n.includes('home')) return <Home size={24} />;
        return <ShoppingBag size={24} />;
    };

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [tplRes, accRes] = await Promise.all([api.get('/templates'), api.get('/accounts')]);
            setTemplates(tplRes.data);
            setAccounts(accRes.data);
            if (accRes.data.length > 0) {
                setNewTemplate(prev => ({ ...prev, default_account_id: accRes.data[0].id }));
            }
        } catch (e) { console.error(e); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/templates', newTemplate);
            setShowForm(false);
            setNewTemplate({ name: '', amount: '', description: '', default_account_id: accounts[0]?.id || '' });
            fetchData();
        } catch (e) { alert('Failed'); }
    };

    const executeTemplate = async (template) => {
        if (!confirm(`Pay $${template.amount} for ${template.name}?`)) return;
        try {
            await api.post('/transactions', {
                amount: template.amount,
                description: template.description,
                type: 'expense',
                account_id: template.default_account_id
            });
            alert('Payment Sent!');
        } catch (e) { alert('Failed to execute template'); }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex-between" style={{ padding: '24px 0 24px' }}>
                <h2 className="text-xl">Quick Pay</h2>
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

            {showForm && (
                <div className="card animate-slide-up" style={{ marginBottom: '24px' }}>
                    <h3 className="text-sm font-bold text-secondary uppercase" style={{ marginBottom: '16px' }}>New Shortcut</h3>
                    <form onSubmit={handleCreate}>
                        <div className="input-group" style={{ marginBottom: '16px' }}>
                            <input className="input" placeholder="Name (e.g. Coffee)" value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })} required />
                            <input type="number" step="0.01" className="input" placeholder="Amount ($)" value={newTemplate.amount} onChange={e => setNewTemplate({ ...newTemplate, amount: e.target.value })} required />
                            <input className="input" placeholder="Description for transaction" value={newTemplate.description} onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })} required />
                            <select className="input" value={newTemplate.default_account_id} onChange={e => setNewTemplate({ ...newTemplate, default_account_id: e.target.value })}>
                                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-sm">
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Shortcut</button>
                            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {templates.map(t => (
                    <button key={t.id} onClick={() => executeTemplate(t)} style={{
                        backgroundColor: 'var(--color-bg-card)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '16px',
                        height: '140px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        border: 'none',
                        boxShadow: 'var(--shadow-sm)',
                        cursor: 'pointer',
                        transition: 'transform 0.1s ease'
                    }}
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            backgroundColor: 'var(--color-bg-input)', color: 'var(--color-accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {getIcon(t.name)}
                        </div>
                        <div style={{ textAlign: 'left', width: '100%' }}>
                            <div className="text-base font-bold text-primary">{t.name}</div>
                            <div className="text-sm font-bold text-secondary">${t.amount.toFixed(2)}</div>
                        </div>
                    </button>
                ))}

                {/* Add New Placeholder */}
                <button onClick={() => setShowForm(true)} style={{
                    backgroundColor: 'transparent',
                    borderRadius: 'var(--radius-lg)',
                    border: '2px dashed var(--color-border)',
                    padding: '16px',
                    height: '140px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    color: 'var(--color-text-tertiary)'
                }}>
                    <Plus size={32} />
                    <span className="text-xs font-bold" style={{ marginTop: '8px' }}>Add New</span>
                </button>
            </div>
        </div>
    );
};

export default Templates;
