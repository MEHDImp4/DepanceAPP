import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { format } from 'date-fns';
import { ArrowUp, ArrowDown, Send, Plus, CreditCard, MoreHorizontal } from 'lucide-react';
import { formatCurrency } from '../utils/currencyUtils';
import { processRecurring } from '../services/recurringService';

const Dashboard = () => {
    const [balance, setBalance] = useState(0);
    const [currency, setCurrency] = useState('USD');
    const [recentTx, setRecentTx] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [summaryRes, txRes, budgetRes] = await Promise.all([
                api.get('/accounts/summary'),
                api.get('/transactions'),
                api.get('/budgets'),
                processRecurring() // Check and process recurring transactions
            ]);
            setBalance(summaryRes.data.totalBalance);
            setCurrency(summaryRes.data.currency);
            setRecentTx(txRes.data.slice(0, 5));
            setBudgets(budgetRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const QuickAction = ({ icon, label, to }) => (
        <Link to={to} className="flex-col flex-center gap-sm" style={{ textDecoration: 'none' }}>
            <div className="flex-center" style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-bg-card)',
                boxShadow: 'var(--shadow-sm)',
                color: 'var(--color-accent)',
                transition: 'all 0.2s ease'
            }}>
                {React.cloneElement(icon, { size: 20 })}
            </div>
            <span className="text-xs font-bold text-secondary">{label}</span>
        </Link>
    );

    return (
        <div className="animate-fade-in">
            {/* Header / Balance */}
            <div style={{ padding: '8px 0 24px', textAlign: 'center' }}>
                <h2 className="text-sm text-secondary font-bold" style={{ marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Balance</h2>
                <h1 style={{
                    fontSize: 'var(--font-size-xxl)',
                    fontWeight: '800',
                    letterSpacing: '-2px',
                    color: 'var(--color-text-primary)'
                }}>
                    {formatCurrency(balance, currency)}
                </h1>
            </div>

            {/* Dashboard Actions */}
            <div style={{ padding: '0 20px 40px', display: 'flex', justifyContent: 'center' }}>
                <Link to="/transactions" state={{ openModal: 'transaction' }} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 32px',
                    backgroundColor: 'var(--color-accent)',
                    borderRadius: 'var(--radius-full)',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: 'var(--font-size-sm)',
                    boxShadow: '0 8px 16px rgba(0, 122, 255, 0.3)',
                    textDecoration: 'none'
                }}>
                    <Plus size={20} strokeWidth={3} />
                    <span>Add Transaction</span>
                </Link>
            </div>

            {/* Budgets Section */}
            {budgets.length > 0 && (
                <div style={{ marginBottom: '32px', padding: '0 8px' }}>
                    <div className="flex-between" style={{ marginBottom: '12px' }}>
                        <h3 className="text-lg">Budgets</h3>
                        <Link to="/settings" className="text-sm text-accent font-bold">Manage</Link>
                    </div>
                    <div className="flex-col gap-md">
                        {budgets.map(budget => {
                            const percent = Math.min(100, (budget.spent / budget.amount) * 100);
                            const isOver = budget.spent > budget.amount;
                            let color = 'var(--color-success)';
                            if (percent > 75) color = '#FFCC00'; // Yellow
                            if (percent > 90) color = 'var(--color-danger)'; // Red

                            return (
                                <div key={budget.id} className="card" style={{ padding: '16px', borderRadius: 'var(--radius-lg)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{
                                                width: '8px', height: '8px', borderRadius: '50%',
                                                backgroundColor: budget.category?.color || 'var(--color-text-primary)'
                                            }} />
                                            <span className="text-sm font-bold" style={{ lineHeight: 1 }}>{budget.category ? budget.category.name : 'Global Budget'}</span>
                                        </div>
                                        <div className="text-xs font-bold" style={{ color: color, lineHeight: 1 }}>
                                            {formatCurrency(budget.spent, currency)} / {formatCurrency(budget.amount, currency)}
                                        </div>
                                    </div>
                                    <div style={{
                                        width: '100%', height: '6px',
                                        backgroundColor: 'var(--color-bg-input)',
                                        borderRadius: '3px', overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${percent}%`, height: '100%',
                                            backgroundColor: color,
                                            borderRadius: '4px',
                                            transition: 'width 0.5s ease'
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            <div>
                <div className="flex-between" style={{ marginBottom: '16px', padding: '0 8px' }}>
                    <h3 className="text-lg">Recent Activity</h3>
                    <Link to="/transactions" className="text-sm text-accent font-bold">See All</Link>
                </div>

                <div className="flex-col gap-md">
                    {recentTx.map(tx => (
                        <div key={tx.id} className="card" style={{
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px'
                        }}>
                            <div className="flex" style={{ gap: '12px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                <div className="flex-center" style={{
                                    width: '40px', height: '40px', borderRadius: '12px',
                                    backgroundColor: tx.category?.color ? `${tx.category.color}20` : (tx.type === 'income' ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 59, 48, 0.12)'),
                                    flexShrink: 0,
                                    color: tx.category?.color || (tx.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)')
                                }}>
                                    {/* Use Category Initial or Icon if available, else Arrow */}
                                    {/* For Dashboard we can import Tag from lucide-react if needed, but let's stick to arrows if no category, or colored arrows */}
                                    {tx.type === 'income'
                                        ? <ArrowUp size={18} strokeWidth={3} />
                                        : <ArrowDown size={18} strokeWidth={3} />
                                    }
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="text-xs text-secondary flex items-center" style={{ marginTop: '4px' }}>
                                        <span style={{ opacity: 0.7 }}>{tx.account?.name} • {format(new Date(tx.created_at), 'MMM d')}</span>
                                        {tx.category && (
                                            <span style={{
                                                color: tx.category.color,
                                                backgroundColor: `${tx.category.color}15`,
                                                fontWeight: '700',
                                                fontSize: '10px',
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                marginLeft: '8px',
                                                letterSpacing: '0.3px'
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
                                flexShrink: 0,
                                marginLeft: '8px'
                            }}>
                                <div style={{ fontSize: '15px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.convertedAmount || tx.amount, currency)}
                                </div>
                                {tx.account?.currency !== currency && (
                                    <div className="text-secondary" style={{ fontSize: '10px', fontWeight: '500', whiteSpace: 'nowrap', marginTop: '1px' }}>
                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, tx.account?.currency)}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {!loading && recentTx.length === 0 && (
                        <div className="text-center text-secondary" style={{ padding: '40px' }}>
                            No recent activity
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
