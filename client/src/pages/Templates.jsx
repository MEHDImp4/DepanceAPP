import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Zap, ShoppingBag, Coffee, Car, Home } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { formatCurrency } from '../utils/currencyUtils';

const Templates = () => {
    const [templates, setTemplates] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', amount: '', description: '', default_account_id: '', category_id: '' });
    const { showToast, showConfirm } = useUI();

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
            const [tplRes, accRes, catRes] = await Promise.all([
                api.get('/templates'),
                api.get('/accounts'),
                api.get('/categories') // Fetch categories
            ]);
            setTemplates(tplRes.data);
            setAccounts(accRes.data);
            setCategories(catRes.data);

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
            setNewTemplate({ name: '', amount: '', description: '', default_account_id: accounts[0]?.id || '', category_id: '' });
            fetchData();
            showToast('Shortcut saved', 'success');
        } catch (e) { showToast('Failed to save shortcut', 'error'); }
    };

    const executeTemplate = (template) => {
        const acc = accounts.find(a => a.id == template.default_account_id);
        const amountStr = formatCurrency(template.amount, acc?.currency);

        showConfirm('Confirm Payment', `Pay ${amountStr} for ${template.name}?`, async () => {
            try {
                await api.post('/transactions', {
                    amount: template.amount,
                    description: template.description,
                    type: 'expense',
                    account_id: template.default_account_id,
                    category_id: template.category_id || null // Pass category
                });
                showToast('Payment Sent!', 'success');
            } catch (e) { showToast('Failed to execute template', 'error'); }
        });
    };

    return (
        <div className="animate-fade-in">
            <div className="flex-between" style={{ padding: '24px 0 24px' }}>
                <h2 className="text-xl">Quick Pay</h2>
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

            {showForm && (
                <div className="card animate-slide-up" style={{ marginBottom: '24px', padding: '24px' }}>
                    <h3 className="text-sm font-bold text-secondary uppercase mb-md">New Shortcut</h3>
                    <form onSubmit={handleCreate}>
                        <div className="input-group" style={{ marginBottom: '24px', padding: '0 16px' }}>
                            <input
                                className="input"
                                placeholder="Name (e.g. Coffee)"
                                value={newTemplate.name}
                                onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                required
                            />

                            <div className="flex items-center" style={{ borderBottom: '0.5px solid var(--color-separator)' }}>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="input"
                                    placeholder="Amount"
                                    value={newTemplate.amount}
                                    onChange={e => setNewTemplate({ ...newTemplate, amount: e.target.value })}
                                    required
                                    style={{ flex: 1, borderBottom: 'none' }}
                                />
                                <span className="text-sm font-bold text-secondary" style={{ paddingLeft: '8px' }}>
                                    {accounts.find(a => a.id == newTemplate.default_account_id)?.currency || 'USD'}
                                </span>
                            </div>

                            <input
                                className="input"
                                placeholder="Description"
                                value={newTemplate.description}
                                onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
                                required
                            />

                            <select
                                className="input"
                                value={newTemplate.category_id}
                                onChange={e => setNewTemplate({ ...newTemplate, category_id: e.target.value })}
                            >
                                <option value="">No Category</option>
                                {categories.filter(c => c.type === 'expense').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            <select
                                className="input"
                                value={newTemplate.default_account_id}
                                onChange={e => setNewTemplate({ ...newTemplate, default_account_id: e.target.value })}
                                style={{ borderBottom: 'none' }}
                            >
                                {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                            </select>
                        </div>

                        <div className="flex gap-md">
                            <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary flex-1">Save Shortcut</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Template List - Stacked for easy one-handed tap */}
            <div className="flex-col gap-md">
                {templates.map(t => {
                    const acc = accounts.find(a => a.id == t.default_account_id);
                    return (
                        <button key={t.id} onClick={() => executeTemplate(t)} className="card" style={{
                            padding: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'transform 0.1s ease',
                            width: '100%',
                            borderRadius: 'var(--radius-lg)'
                        }}
                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <div className="flex items-center gap-md">
                                <div className="flex-center" style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    backgroundColor: 'var(--color-bg-input)', color: 'var(--color-accent)'
                                }}>
                                    {getIcon(t.name)}
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>{t.name}</div>
                                    <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                        {acc?.name || 'Account'}
                                    </div>
                                </div>
                            </div>
                            <div className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                {formatCurrency(t.amount, acc?.currency)}
                            </div>
                        </button>
                    );
                })}

                {/* Add New Button */}
                <button onClick={() => setShowForm(true)} style={{
                    backgroundColor: 'transparent',
                    borderRadius: 'var(--radius-lg)',
                    border: '2px dashed var(--color-border)',
                    padding: '16px',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    color: 'var(--color-text-secondary)',
                    fontWeight: '600',
                    marginTop: '8px'
                }}>
                    <Plus size={20} />
                    <span>Create New Shortcut</span>
                </button>
            </div>
        </div>
    );
};

export default Templates;
