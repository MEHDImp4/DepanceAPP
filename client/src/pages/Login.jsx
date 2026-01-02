import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, User, Lock } from 'lucide-react';

const Login = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(identifier, password);
        } catch (err) {
            console.error(err);
            setError('Failed to login. Check credentials.');
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', padding: '20px', backgroundColor: 'var(--color-bg)' }}>
            <div className="card glass animate-slide-up" style={{ width: '100%', maxWidth: '380px', padding: '32px 24px' }}>
                <div className="text-center" style={{ marginBottom: '32px' }}>
                    <div className="flex-center" style={{
                        width: '60px', height: '60px', borderRadius: '18px',
                        background: 'linear-gradient(135deg, var(--color-accent) 0%, #5856D6 100%)',
                        margin: '0 auto 16px',
                        boxShadow: '0 10px 20px rgba(0, 122, 255, 0.2)'
                    }}>
                        <Lock size={28} color="white" />
                    </div>
                    <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '800' }}>Welcome Back</h2>
                    <p className="text-secondary" style={{ marginTop: '8px', fontSize: '14px' }}>Sign in to continue to Depance</p>
                </div>

                {error && (
                    <div className="animate-fade-in" style={{
                        backgroundColor: 'rgba(255, 59, 48, 0.1)',
                        color: 'var(--color-danger)',
                        padding: '12px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        fontSize: '13px',
                        textAlign: 'center',
                        fontWeight: '500'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex-col gap-md">
                    <div className="input-group">
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                            <input
                                type="text"
                                placeholder="Email or Username"
                                className="input"
                                style={{ paddingLeft: '48px' }}
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                className="input"
                                style={{ paddingLeft: '48px', paddingRight: '48px' }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'transparent', color: 'var(--color-text-tertiary)', padding: '4px'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" style={{ height: '50px', fontSize: '16px', marginTop: '8px' }}>
                        Sign In
                    </button>
                </form>

                <div className="text-center" style={{ marginTop: '32px' }}>
                    <p className="text-secondary" style={{ fontSize: '14px' }}>
                        Don't have an account? <Link to="/register" className="text-accent font-bold" style={{ textDecoration: 'none' }}>Register</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
