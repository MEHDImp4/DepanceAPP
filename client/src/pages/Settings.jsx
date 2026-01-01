import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Moon, Sun, User, Shield, Bell, ChevronRight, LogOut, Github, Globe } from 'lucide-react';

const Settings = () => {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();

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
                }
            ]
        },
        {
            title: 'Account',
            items: [
                { icon: <User size={20} />, iconColor: '#007AFF', label: 'Profile', value: user?.email },
                { icon: <Shield size={20} />, iconColor: '#34C759', label: 'Security', arrow: true },
                { icon: <Bell size={20} />, iconColor: '#FF9500', label: 'Notifications', arrow: true },
            ]
        },
        {
            title: 'About',
            items: [
                { icon: <Globe size={20} />, iconColor: '#AF52DE', label: 'Website', arrow: true },
                { icon: <Github size={20} />, iconColor: '#1C1C1E', label: 'GitHub', arrow: true },
            ]
        }
    ];

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
            <div style={{ padding: '24px 0 32px' }}>
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
                                }} onClick={item.arrow ? () => alert('Not implemented yet') : undefined}>
                                    <div className="flex items-center gap-md">
                                        <div className="flex-center" style={{
                                            width: '32px', height: '32px', borderRadius: '8px',
                                            backgroundColor: item.iconColor ? `${item.iconColor}20` : 'var(--color-bg-input)', // 20 opacity
                                            color: item.iconColor || 'var(--color-primary)'
                                        }}>
                                            {React.cloneElement(item.icon, { size: 18 })}
                                        </div>
                                        <span className="text-base font-bold text-primary">{item.label}</span>
                                    </div>
                                    <div className="flex items-center gap-sm text-secondary">
                                        {item.value && <span className="text-sm">{item.value}</span>}
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
