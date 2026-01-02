import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login({ onClose }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password);
        
        if (result.success) {
            if (onClose) {
                onClose();
            } else {
                navigate('/');
            }
        } else {
            setError(result.error);
        }
        
        setLoading(false);
    };

    const quickLogin = async (user) => {
        setUsername(user);
        setPassword(user);
        setError('');
        setLoading(true);

        const result = await login(user, user);
        
        if (result.success) {
            if (onClose) {
                onClose();
            } else {
                navigate('/');
            }
        } else {
            setError(result.error);
        }
        
        setLoading(false);
    };

    return (
        <div style={onClose ? {} : { maxWidth: '400px', margin: '40px auto', padding: '20px' }}>
            <div className="login-container">
                <h2>Login</h2>
            
            {error && (
                <div className="login-error">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        disabled={loading}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        disabled={loading}
                        required
                    />
                </div>

                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                    {onClose && (
                        <button 
                            type="button" 
                            className="btn-secondary" 
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <div className="quick-login-section">
                <p className="quick-login-title">Quick Login:</p>
                <div className="quick-login-buttons">
                    <button 
                        onClick={() => quickLogin('user1')} 
                        className="btn-secondary btn-small"
                        disabled={loading}
                    >
                        User 1
                    </button>
                    <button 
                        onClick={() => quickLogin('user2')} 
                        className="btn-secondary btn-small"
                        disabled={loading}
                    >
                        User 2
                    </button>
                    <button 
                        onClick={() => quickLogin('user3')} 
                        className="btn-secondary btn-small"
                        disabled={loading}
                    >
                        User 3
                    </button>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '15px' }}>
                Don't have an account? <Link to="/register">Register here</Link>
            </div>
            </div>
        </div>
    );
}

export default Login;
