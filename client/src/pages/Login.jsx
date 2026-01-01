import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
        } catch (err) {
            console.error(err);
            setError('Failed to login. Check credentials.');
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', padding: '20px' }}>
            <div className="card glass animate-slide-up" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="text-center" style={{ marginBottom: '32px' }}>
                    <h2 className="text-xl">Welcome Back</h2>
                    <p className="text-secondary text-sm" style={{ marginTop: '8px' }}>Sign in to manage your finances</p>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: 'rgba(255, 59, 48, 0.1)',
                        color: 'var(--color-danger)',
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '20px',
                        fontSize: '13px',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group" style={{ marginBottom: '24px' }}>
                        <input
                            type="email"
                            placeholder="Email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block">
                        Sign In
                    </button>
                </form>

                <div className="text-center" style={{ marginTop: '24px' }}>
                    <p className="text-secondary text-sm">
                        Don't have an account? <Link to="/register" className="text-accent font-bold">Register</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
