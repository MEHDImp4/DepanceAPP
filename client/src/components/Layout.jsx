import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, CreditCard, Repeat, DollarSign, LogOut, Settings } from 'lucide-react';
import '../styles/Layout.css';

const Layout = ({ children }) => {
    const { logout } = useAuth();

    const navItems = [
        { name: 'Home', path: '/', icon: <Home size={24} strokeWidth={2} /> },
        { name: 'Accounts', path: '/accounts', icon: <CreditCard size={24} strokeWidth={2} /> },
        { name: 'Pay', path: '/transactions', icon: <DollarSign size={24} strokeWidth={2} /> },
        { name: 'Fast', path: '/templates', icon: <Repeat size={24} strokeWidth={2} /> },
        { name: 'Settings', path: '/settings', icon: <Settings size={24} strokeWidth={2} /> },
    ];

    return (
        <div className="flex">
            {/* Navigation Bar (Mobile Bottom / Desktop Sidebar) */}
            <nav className="nav-bar">
                {/* Desktop Logo */}
                <div className="desktop-only" style={{ marginBottom: '32px', paddingLeft: '16px' }}>
                    <h1 className="text-xl" style={{
                        background: 'linear-gradient(135deg, var(--color-accent) 0%, #5856D6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: '24px'
                    }}>
                        Depance
                    </h1>
                </div>

                <div className="nav-container">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span className="nav-label">{item.name}</span>
                        </NavLink>
                    ))}
                </div>

                {/* Desktop Logout */}
                <button
                    onClick={logout}
                    className="nav-item desktop-only"
                    style={{ marginTop: 'auto', color: 'var(--color-text-secondary)' }}
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </nav>

            <main className="main-content">
                {/* Mobile Header */}
                <header className="mobile-only flex-center" style={{ marginBottom: '8px', paddingTop: '4px', paddingLeft: '8px', paddingRight: '8px' }}>
                    <h1 className="text-xl" style={{
                        background: 'linear-gradient(135deg, var(--color-accent) 0%, #5856D6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Depance
                    </h1>
                </header>

                {children}
            </main>
        </div>
    );
};

export default Layout;
