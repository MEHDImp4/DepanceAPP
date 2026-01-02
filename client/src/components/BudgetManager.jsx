import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { getBudgets, createBudget, deleteBudget } from '../services/budgetService';
import { getCategories } from '../services/categoryService';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currencyUtils';
import { X, Plus, Trash2, PieChart } from 'lucide-react';

const BudgetManager = ({ onClose }) => {
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form state
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');

    const { showToast } = useUI();
    const { user } = useAuth();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [bRes, cRes] = await Promise.all([getBudgets(), getCategories()]);
            setBudgets(bRes);
            setCategories(cRes);
        } catch (e) {
            console.error(e);
            showToast('Failed to load budgets', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createBudget({
                amount: parseFloat(amount),
                category_id: categoryId || null,
                period: 'monthly'
            });
            setShowAddForm(false);
            setAmount('');
            setCategoryId('');
            loadData();
            showToast('Budget created', 'success');
        } catch (e) {
            showToast(e.response?.data?.error || 'Failed to create', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this budget?')) return;
        try {
            await deleteBudget(id);
            loadData();
            showToast('Budget deleted', 'success');
        } catch (e) {
            showToast('Failed to delete', 'error');
        }
    };

    // Filter out categories that already have a budget
    const availableCategories = categories.filter(cat =>
        !budgets.some(b => b.category_id === cat.id)
    );

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
                    <h3 className="text-xl font-bold">Manage Budgets</h3>
                    <button onClick={onClose} className="flex-center" style={{ width: '32px', height: '32px', backgroundColor: 'var(--color-bg-input)', borderRadius: '50%' }}>
                        <X size={20} color="var(--color-text-secondary)" />
                    </button>
                </div>

                {!showAddForm ? (
                    <>
                        <div className="flex-col gap-sm" style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
                            {budgets.length === 0 && !loading && (
                                <div className="text-center text-secondary" style={{ padding: '40px 0' }}>
                                    <div style={{ marginBottom: '16px', opacity: 0.3 }}><PieChart size={48} /></div>
                                    <p>No budgets set.</p>
                                    <p className="text-xs" style={{ marginTop: '8px' }}>Set limits to save money.</p>
                                </div>
                            )}

                            {budgets.map(budget => (
                                <div key={budget.id} className="card" style={{
                                    padding: '16px',
                                    backgroundColor: 'var(--color-bg-input)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    marginBottom: '8px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    <div>
                                        <div className="text-sm font-bold" style={{ color: budget.category?.color || 'var(--color-text-primary)' }}>
                                            {budget.category ? budget.category.name : 'Global Budget'}
                                        </div>
                                        <div className="text-xs text-secondary" style={{ marginTop: '4px' }}>
                                            {formatCurrency(budget.amount, user?.currency)} / month
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(budget.id)} style={{ color: 'var(--color-secondary)', opacity: 0.7 }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button className="btn btn-primary btn-block" onClick={() => setShowAddForm(true)} style={{ marginTop: 'auto', borderRadius: 'var(--radius-full)' }}>
                            <Plus size={20} style={{ marginRight: '8px' }} /> Add Budget
                        </button>
                    </>
                ) : (
                    <form onSubmit={handleCreate}>
                        <div style={{ marginBottom: '20px' }}>
                            <label className="text-xs font-bold text-secondary uppercase" style={{ display: 'block', marginBottom: '8px' }}>Category</label>
                            <div className="input-group">
                                <select
                                    className="input"
                                    value={categoryId}
                                    onChange={e => setCategoryId(e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <option value="">Global (All Expenses)</option>
                                    {availableCategories.filter(c => c.type === 'expense').map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label className="text-xs font-bold text-secondary uppercase" style={{ display: 'block', marginBottom: '8px' }}>Monthly Limit</label>
                            <div className="input-group">
                                <input
                                    type="number"
                                    required
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="input"
                                    placeholder="0.00"
                                    step="0.01"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

                        <div className="flex gap-md">
                            <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowAddForm(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary flex-1">
                                Save
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default BudgetManager;
