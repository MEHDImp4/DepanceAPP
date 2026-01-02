import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, UserPlus } from 'lucide-react';

const Register = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const res = await register(email, username, password);
            navigate('/login', { state: { message: 'Account created! Please login.' } });
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to register. Choose a different email or username.');
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', padding: '20px', backgroundColor: 'var(--color-bg)' }}>
            <div className="card glass animate-slide-up" style={{ width: '100%', maxWidth: '400px', padding: '32px 24px' }}>
                <div className="text-center" style={{ marginBottom: '32px' }}>
                    <div className="flex-center" style={{
                        width: '60px', height: '60px', borderRadius: '18px',
                        background: 'linear-gradient(135deg, var(--color-success) 0%, #34C759 100%)',
                        margin: '0 auto 16px',
                        boxShadow: '0 10px 20px rgba(52, 199, 89, 0.2)'
                    }}>
                        <UserPlus size={28} color="white" />
                    </div>
                    <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '800' }}>Create Account</h2>
                    <p className="text-secondary" style={{ marginTop: '8px', fontSize: '14px' }}>Join Depance to take control of your money</p>
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
                            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                            <input
                                type="email"
                                placeholder="Email Address"
                                className="input"
                                style={{ paddingLeft: '48px' }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                            <input
                                type="text"
                                placeholder="Username"
                                className="input"
                                style={{ paddingLeft: '48px' }}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
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

                    <div className="input-group">
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Confirm Password"
                                className="input"
                                style={{ paddingLeft: '48px' }}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" style={{ height: '50px', fontSize: '16px', marginTop: '8px' }}>
                        Create Account
                    </button>
                </form>

                <div className="text-center" style={{ marginTop: '32px' }}>
                    <p className="text-secondary" style={{ fontSize: '14px' }}>
                        Already have an account? <Link to="/login" className="text-accent font-bold" style={{ textDecoration: 'none' }}>Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
