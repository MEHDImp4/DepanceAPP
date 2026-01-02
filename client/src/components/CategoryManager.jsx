import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Plus, Trash2, Tag } from 'lucide-react';
import { getCategories, createCategory, deleteCategory } from '../services/categoryService';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';

const CategoryManager = ({ onClose }) => {
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState('expense');
    const { showToast } = useUI();
    const { user } = useAuth(); // If needed for token, but api interceptor handles it

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            showToast('Failed to load categories', 'error');
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await createCategory({
                name: newCategoryName,
                type: newCategoryType,
                // Default colors/icons for now
                color: newCategoryType === 'income' ? '#34C759' : '#FF3B30'
            });
            setNewCategoryName('');
            loadCategories();
            showToast('Category created', 'success');
        } catch (error) {
            showToast('Failed to create category', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this category? Transactions will be uncategorized.')) return;
        try {
            await deleteCategory(id);
            setCategories(categories.filter(c => c.id !== id));
            showToast('Category deleted', 'success');
        } catch (error) {
            showToast('Failed to delete category', 'error');
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
                backgroundColor: 'var(--color-bg-card)',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex', flexDirection: 'column'
            }} onClick={e => e.stopPropagation()}>

                <div className="flex-between" style={{ marginBottom: '24px' }}>
                    <h3 className="text-xl font-bold flex items-center gap-sm">
                        Manage Categories
                    </h3>
                    <button onClick={onClose} className="flex-center" style={{ width: '32px', height: '32px', backgroundColor: 'var(--color-bg-input)', borderRadius: '50%' }}>
                        <X size={20} color="var(--color-text-secondary)" />
                    </button>
                </div>

                {/* Add New Form */}
                {/* Add New Form */}
                <form onSubmit={handleAdd} style={{ marginBottom: '24px' }}>
                    <div style={{
                        backgroundColor: 'var(--color-bg-input)',
                        padding: '4px',
                        borderRadius: '12px',
                        display: 'flex',
                        marginBottom: '16px'
                    }}>
                        <button type="button" className="btn flex-1" onClick={() => setNewCategoryType('expense')} style={{
                            padding: '8px',
                            borderRadius: '10px',
                            backgroundColor: newCategoryType === 'expense' ? 'var(--color-bg-card)' : 'transparent',
                            color: newCategoryType === 'expense' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                            boxShadow: newCategoryType === 'expense' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                            fontWeight: '600',
                            fontSize: '13px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}>Expense</button>
                        <button type="button" className="btn flex-1" onClick={() => setNewCategoryType('income')} style={{
                            padding: '8px',
                            borderRadius: '10px',
                            backgroundColor: newCategoryType === 'income' ? 'var(--color-bg-card)' : 'transparent',
                            color: newCategoryType === 'income' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                            boxShadow: newCategoryType === 'income' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                            fontWeight: '600',
                            fontSize: '13px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}>Income</button>
                    </div>

                    <div className="flex gap-sm">
                        <div className="input-group flex-1" style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                                className="input"
                                placeholder="Category Name"
                                value={newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value)}
                                required
                                style={{ borderBottom: 'none' }}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary flex-center" style={{ width: '50px', borderRadius: '12px', padding: 0 }}>
                            <Plus size={24} />
                        </button>
                    </div>
                </form>

                {/* List */}
                <div className="flex-col gap-sm" style={{ flex: 1, overflowY: 'auto' }}>
                    {categories.length === 0 && <p className="text-center text-secondary text-sm" style={{ padding: '20px' }}>No categories yet.</p>}

                    {['income', 'expense'].map(type => {
                        const typeCats = categories.filter(c => c.type === type);
                        if (typeCats.length === 0) return null;
                        return (
                            <div key={type}>
                                <h4 className="text-xs font-bold text-secondary uppercase mb-xs mt-sm">{type}s</h4>
                                {typeCats.map(cat => (
                                    <div key={cat.id} className="flex-between" style={{
                                        padding: '12px 16px',
                                        backgroundColor: 'var(--color-bg-input)',
                                        borderRadius: '12px',
                                        marginBottom: '8px'
                                    }}>
                                        <div className="flex items-center gap-sm">
                                            <div style={{
                                                width: '12px', height: '12px', borderRadius: '50%',
                                                backgroundColor: cat.color || (cat.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)'),
                                                marginTop: '2px'
                                            }} />
                                            <span className="font-bold text-sm" style={{ lineHeight: 1 }}>{cat.name}</span>
                                        </div>
                                        <button onClick={() => handleDelete(cat.id)} style={{ color: 'var(--color-secondary)', opacity: 0.7 }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )
                    })}
                </div>

            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default CategoryManager;
