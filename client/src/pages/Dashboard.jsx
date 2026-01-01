import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { format } from 'date-fns';
import { ArrowUp, ArrowDown, Send, Plus, CreditCard, MoreHorizontal } from 'lucide-react';

const Dashboard = () => {
    const [balance, setBalance] = useState(0);
    const [recentTx, setRecentTx] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [accRes, txRes] = await Promise.all([
                api.get('/accounts'),
                api.get('/transactions')
            ]);
            const total = accRes.data.reduce((sum, acc) => sum + acc.balance, 0);
            setBalance(total);
            setRecentTx(txRes.data.slice(0, 5));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const QuickAction = ({ icon, label, to }) => (
        <Link to={to} className="flex-col flex-center gap-sm" style={{ textDecoration: 'none' }}>
            <div className="flex-center" style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-bg-card)',
                boxShadow: 'var(--shadow-sm)',
                color: 'var(--color-accent)',
                transition: 'all 0.2s ease'
            }}>
                {icon}
            </div>
            <span className="text-xs font-bold text-secondary">{label}</span>
        </Link>
    );

    return (
        <div className="animate-fade-in">
            {/* Header / Balance */}
            <div style={{ padding: '24px 0 40px', textAlign: 'center' }}>
                <h2 className="text-sm text-secondary font-bold" style={{ marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Balance</h2>
                <h1 style={{
                    fontSize: '48px',
                    fontWeight: '800',
                    letterSpacing: '-1px',
                    color: 'var(--color-text-primary)'
                }}>
                    ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h1>
            </div>

            {/* Quick Actions */}
            <div className="flex-between" style={{ padding: '0 20px 40px', maxWidth: '400px', margin: '0 auto' }}>
                <QuickAction icon={<Send size={24} />} label="Transfer" to="/transactions" />
                <QuickAction icon={<Plus size={24} />} label="Add" to="/transactions" />
                <QuickAction icon={<CreditCard size={24} />} label="Cards" to="/accounts" />
                <QuickAction icon={<MoreHorizontal size={24} />} label="More" to="/settings" />
            </div>

            {/* Recent Activity */}
            <div>
                <div className="flex-between" style={{ marginBottom: '16px', padding: '0 8px' }}>
                    <h3 className="text-lg">Recent Activity</h3>
                    <Link to="/transactions" className="text-sm text-accent font-bold">See All</Link>
                </div>

                <div className="flex-col gap-md">
                    {recentTx.map(tx => (
                        <div key={tx.id} className="card flex-between" style={{ padding: '16px', borderRadius: 'var(--radius-lg)' }}>
                            <div className="flex" style={{ gap: '16px', alignItems: 'center' }}>
                                <div className="flex-center" style={{
                                    width: '44px', height: '44px', borderRadius: '50%',
                                    backgroundColor: tx.type === 'income' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                                }}>
                                    {tx.type === 'income'
                                        ? <ArrowUp size={20} color="var(--color-success)" strokeWidth={2.5} />
                                        : <ArrowDown size={20} color="var(--color-danger)" strokeWidth={2.5} />
                                    }
                                </div>
                                <div>
                                    <div className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>{tx.description}</div>
                                    <div className="text-xs text-secondary" style={{ marginTop: '2px' }}>
                                        {format(new Date(tx.created_at), 'MMM d, yyyy')}
                                    </div>
                                </div>
                            </div>
                            <div className="text-base font-bold" style={{
                                color: tx.type === 'income' ? 'var(--color-success)' : 'var(--color-text-primary)'
                            }}>
                                {tx.type === 'income' ? '+' : ''}${tx.amount.toFixed(2)}
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
