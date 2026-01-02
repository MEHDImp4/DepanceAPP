import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { getRecurring, createRecurring, deleteRecurring } from '../services/recurringService';
import { getAccounts } from '../services/accountService'; // Need to fetch accounts
import { getCategories } from '../services/categoryService';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currencyUtils';
import { X, Plus, Trash2, Repeat, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const RecurringManager = ({ onClose }) => {
    const [rules, setRules] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        type: 'expense',
        interval: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        account_id: '',
        category_id: ''
    });

    const { showToast } = useUI();
    const { user } = useAuth(); // for currency

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [rRes, aRes, cRes] = await Promise.all([
                getRecurring(),
                getAccounts(),
                getCategories()
            ]);
            setRules(rRes);
            setAccounts(aRes || []);
            setCategories(cRes);

            // Set default account if available
            if (aRes?.length > 0 && !formData.account_id) {
                setFormData(prev => ({ ...prev, account_id: aRes[0].id }));
            }
        } catch (e) {
            console.error(e);
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createRecurring(formData);
            setShowAddForm(false);
            setFormData(prev => ({ ...prev, description: '', amount: '' })); // reset fields
            loadData();
            showToast('Recurring transaction created', 'success');
        } catch (e) {
            showToast(e.response?.data?.error || 'Failed to create', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this rule?')) return;
        try {
            await deleteRecurring(id);
            loadData();
            showToast('Failed to delete', 'error');
        } catch (e) {
            showToast('Failed to delete', 'error');
        }
    };

    const modalContent = (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
            backdropFilter: 'blur(5px)'
        }} onClick={onClose}>
            <div className="card animate-slide-up" style={{
                width: '100%', maxWidth: '450px',
                borderRadius: 'var(--radius-lg)',
                margin: 0, padding: '24px',
                maxHeight: '90vh', overflowY: 'auto',
                display: 'flex', flexDirection: 'column',
                backgroundColor: 'var(--color-bg-card)',
                boxShadow: 'var(--shadow-lg)'
            }} onClick={e => e.stopPropagation()}>

                <div className="flex-between" style={{ marginBottom: '24px' }}>
                    <h3 className="text-xl font-bold">Recurring Transactions</h3>
                    <button onClick={onClose} className="flex-center" style={{ width: '32px', height: '32px', backgroundColor: 'var(--color-bg-input)', borderRadius: '50%' }}>
                        <X size={20} color="var(--color-text-secondary)" />
                    </button>
                </div>

                {!showAddForm ? (
                    <>
                        <div className="flex-col gap-sm" style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
                            {rules.length === 0 && !loading && (
                                <div className="text-center text-secondary" style={{ padding: '40px 0' }}>
                                    <div style={{ marginBottom: '16px', opacity: 0.3 }}><Repeat size={48} /></div>
                                    <p>No recurring transactions yet.</p>
                                    <p className="text-xs" style={{ marginTop: '8px' }}>Add subscriptions, rent, or salary.</p>
                                </div>
                            )}

                            {rules.map(rule => (
                                <div key={rule.id} className="card" style={{
                                    padding: '16px',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'var(--color-bg-input)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    marginBottom: '8px',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    <div>
                                        <div className="text-sm font-bold flex items-center gap-xs" style={{ marginBottom: '4px' }}>
                                            {rule.description}
                                            {rule.category && (
                                                <span style={{
                                                    color: rule.category.color,
                                                    fontSize: '10px',
                                                    backgroundColor: `${rule.category.color}15`,
                                                    padding: '2px 8px', borderRadius: '12px',
                                                    fontWeight: '700'
                                                }}>
                                                    {rule.category.name}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-secondary flex items-center gap-xs">
                                            <Calendar size={12} /> {rule.interval} • Next: {format(new Date(rule.next_run_date), 'MMM d, yyyy')}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-md">
                                        <div className={`text-sm font-bold ${rule.type === 'income' ? 'text-success' : 'text-danger'}`}>
                                            {rule.type === 'income' ? '+' : '-'}{formatCurrency(rule.amount, user?.currency)}
                                        </div>
                                        <button onClick={() => handleDelete(rule.id)} style={{ color: 'var(--color-secondary)', opacity: 0.7 }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="btn btn-primary btn-block" onClick={() => setShowAddForm(true)} style={{ marginTop: 'auto', borderRadius: 'var(--radius-full)' }}>
                            <Plus size={20} style={{ marginRight: '8px' }} /> Add Recurring Transaction
                        </button>
                    </>
                ) : (
                    <form onSubmit={handleCreate}>
                        {/* Segmented Control for Type */}
                        <div style={{ marginBottom: '24px' }}>
                            <label className="text-xs font-bold text-secondary uppercase mb-xs block">Type</label>
                            <div style={{
                                display: 'flex',
                                backgroundColor: 'var(--color-bg-input)',
                                padding: '4px',
                                borderRadius: '10px'
                            }}>
                                <button
                                    type="button"
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        backgroundColor: formData.type === 'expense' ? 'var(--color-bg-card)' : 'transparent',
                                        color: formData.type === 'expense' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                        boxShadow: formData.type === 'expense' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                                >
                                    Expense
                                </button>
                                <button
                                    type="button"
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        backgroundColor: formData.type === 'income' ? 'var(--color-bg-card)' : 'transparent',
                                        color: formData.type === 'income' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                        boxShadow: formData.type === 'income' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => setFormData({ ...formData, type: 'income' })}
                                >
                                    Income
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label className="text-xs font-bold text-secondary uppercase mb-xs block">Description</label>
                            <div className="input-group">
                                <input
                                    required
                                    className="input"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g. Netflix, Rent..."
                                />
                            </div>
                        </div>

                        <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div>
                                <label className="text-xs font-bold text-secondary uppercase mb-xs block">Amount</label>
                                <div className="input-group">
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        className="input"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-secondary uppercase mb-xs block">Interval</label>
                                <div className="input-group">
                                    <select
                                        className="input"
                                        value={formData.interval}
                                        onChange={e => setFormData({ ...formData, interval: e.target.value })}
                                    >
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                            <div>
                                <label className="text-xs font-bold text-secondary uppercase mb-xs block">Category</label>
                                <div className="input-group">
                                    <select
                                        className="input"
                                        value={formData.category_id}
                                        onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                    >
                                        <option value="">None</option>
                                        {categories.filter(c => c.type === formData.type).map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-secondary uppercase mb-xs block">Start Date</label>
                                <div className="input-group">
                                    <input
                                        type="date"
                                        required
                                        className="input"
                                        value={formData.start_date}
                                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label className="text-xs font-bold text-secondary uppercase mb-xs block">Account</label>
                                <div className="input-group">
                                    <select
                                        required
                                        className="input"
                                        value={formData.account_id}
                                        onChange={e => setFormData({ ...formData, account_id: e.target.value })}
                                    >
                                        <option value="">Select Account</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-md">
                            <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowAddForm(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary flex-1">
                                Save Rule
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default RecurringManager;
