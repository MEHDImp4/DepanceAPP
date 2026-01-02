import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import api from '../services/api';
import { currencies } from '../utils/currencyUtils';
import {
    Sun, Moon, Coins, User, Shield, Bell, Globe,
    Github, ChevronRight, LogOut, Mail, Tag
} from 'lucide-react';
import CategoryManager from '../components/CategoryManager';
import BudgetManager from '../components/BudgetManager';
import RecurringManager from '../components/RecurringManager';
import { PieChart, Repeat } from 'lucide-react';

const Settings = () => {
    const { theme, toggleTheme } = useTheme();
    const { user, logout, updateUser } = useAuth();
    const { showToast } = useUI();
    const [showCategories, setShowCategories] = useState(false);
    const [showBudgets, setShowBudgets] = useState(false);
    const [showRecurring, setShowRecurring] = useState(false);

    const handleCurrencyChange = async (e) => {
        const newCurrency = e.target.value;
        try {
            await api.put('/auth/profile', { currency: newCurrency });
            updateUser({ currency: newCurrency });
            showToast('Currency updated');
        } catch (e) { showToast('Failed to update currency', 'error'); }
    };

    const sections = [
        {
            title: 'Appearance',
            items: [
                {
                    icon: theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />,
                    iconColor: '#5E5CE6',
                    label: 'Dark Mode',
                    action: <div className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`} onClick={toggleTheme}>
                        <div className="toggle-knob" />
                    </div>
                },
                {
                    icon: <Coins size={20} />,
                    iconColor: '#FFCC00',
                    label: 'Primary Currency',
                    action: <select
                        value={user?.currency || 'USD'}
                        onChange={handleCurrencyChange}
                        style={{ border: 'none', background: 'transparent', color: 'var(--color-primary)', fontWeight: 'bold' }}
                    >
                        {currencies.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                    </select>
                }
            ]
        },
        {
            title: 'Account',
            items: [
                { icon: <User size={20} />, iconColor: '#007AFF', label: 'Username', value: user?.username || 'Not set' },
                { icon: <Mail size={20} />, iconColor: '#5856D6', label: 'Email', value: user?.email },
                { icon: <Shield size={20} />, iconColor: '#34C759', label: 'Security', arrow: true },
                { icon: <Bell size={20} />, iconColor: '#FF9500', label: 'Notifications', arrow: true },
            ]
        },
        {
            title: 'Management',
            items: [
                { icon: <Tag size={20} />, iconColor: '#FF2D55', label: 'Categories', arrow: true, onClick: () => setShowCategories(true) },
                { icon: <PieChart size={20} />, iconColor: '#5AC8FA', label: 'Budgets', arrow: true, onClick: () => setShowBudgets(true) },
                { icon: <Repeat size={20} />, iconColor: '#BF5AF2', label: 'Recurring', arrow: true, onClick: () => setShowRecurring(true) },
            ]
        },
        {
            title: 'About',
            items: [
                { icon: <Globe size={20} />, iconColor: '#AF52DE', label: 'Website', arrow: true },
                { icon: <Github size={20} />, iconColor: '#FFFFFF', label: 'GitHub', arrow: true },
            ]
        }
    ];

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
            <div style={{ padding: '8px 0 20px' }}>
                <h2 className="text-xl">Settings</h2>
            </div>

            <div className="flex-col gap-lg">
                {sections.map((section, idx) => (
                    <div key={idx}>
                        <h3 className="text-sm font-bold text-secondary uppercase" style={{ marginLeft: '16px', marginBottom: '8px' }}>{section.title}</h3>
                        <div className="card" style={{ padding: 0, overflow: 'hidden', border: 'none', borderRadius: 'var(--radius-lg)' }}>
                            {section.items.map((item, i) => (
                                <div key={i} style={{
                                    padding: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderBottom: i < section.items.length - 1 ? '1px solid var(--color-border)' : 'none',
                                    cursor: 'pointer',
                                    backgroundColor: 'var(--color-bg-card)'
                                }} onClick={item.onClick ? item.onClick : (item.arrow ? () => showToast('Feature coming soon') : undefined)}>
                                    <div className="flex items-center gap-sm" style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center' }}>
                                        <div className="flex-center" style={{
                                            width: '32px', height: '32px', borderRadius: '8px',
                                            backgroundColor: item.iconColor ? `${item.iconColor}20` : 'var(--color-bg-input)',
                                            color: item.iconColor || 'var(--color-primary)',
                                            flexShrink: 0
                                        }}>
                                            {React.cloneElement(item.icon, { size: 18 })}
                                        </div>
                                        <span className="text-sm font-bold text-primary truncate">{item.label}</span>
                                    </div>
                                    <div className="flex items-center gap-sm text-secondary" style={{ flexShrink: 0, marginLeft: '4px', display: 'flex', alignItems: 'center' }}>
                                        {item.value && <span className="text-xs truncate" style={{ maxWidth: '100px' }}>{item.value}</span>}
                                        {item.action}
                                        {item.arrow && <ChevronRight size={18} color="var(--color-text-tertiary)" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <button onClick={logout} className="btn" style={{
                    width: '100%',
                    backgroundColor: 'var(--color-bg-card)',
                    color: 'var(--color-danger)',
                    marginTop: '20px',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    Log Out
                </button>

                <p className="text-center text-xs text-secondary" style={{ marginTop: '32px' }}>
                    Depance v1.0.0
                </p>
            </div>

            {showCategories && <CategoryManager onClose={() => setShowCategories(false)} />}
            {showBudgets && <BudgetManager onClose={() => setShowBudgets(false)} />}
            {showRecurring && <RecurringManager onClose={() => setShowRecurring(false)} />}

            <style>{`
                .toggle-switch {
                    width: 50px;
                    height: 30px;
                    background-color: var(--color-bg-input);
                    border-radius: 99px;
                    position: relative;
                    transition: background-color 0.3s;
                    cursor: pointer;
                }
                .toggle-switch.active {
                    background-color: var(--color-success);
                }
                .toggle-knob {
                    width: 26px;
                    height: 26px;
                    background-color: white;
                    border-radius: 50%;
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .toggle-switch.active .toggle-knob {
                    transform: translateX(20px);
                }
            `}</style>
        </div>
    );
};

export default Settings;
