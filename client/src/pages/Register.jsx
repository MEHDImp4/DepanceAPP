import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(email, password);
            navigate('/login');
        } catch (err) {
            setError('Failed to register.');
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', padding: '20px' }}>
            <div className="card glass animate-slide-up" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="text-center" style={{ marginBottom: '32px' }}>
                    <h2 className="text-xl">Create Account</h2>
                    <p className="text-secondary text-sm" style={{ marginTop: '8px' }}>Join us to control your expenses</p>
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
                        Register
                    </button>
                </form>

                <div className="text-center" style={{ marginTop: '24px' }}>
                    <p className="text-secondary text-sm">
                        Already have an account? <Link to="/login" className="text-accent font-bold">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
