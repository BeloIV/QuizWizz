import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function LoginModal({ isOpen, onClose, onSwitchToRegister, onSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        console.debug('LoginModal: submit', { username });
        const result = await login(username, password);
        
        if (result.success) {
            setUsername('');
            setPassword('');
            onClose();
            if (onSuccess) {
                onSuccess();
            }
        } else {
            setError(result.error);
        }
        
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content login-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Login to QuizWizz</h2>
                
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

                    <div className="modal-actions" style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '120px' }}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                            style={{ minWidth: '120px' }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>

                {onSwitchToRegister && (
                    <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                        <p style={{ margin: '0 0 10px 0', color: '#666' }}>Don't have an account?</p>
                        <button
                            type="button"
                            onClick={onSwitchToRegister}
                            disabled={loading}
                            className="btn btn-link"
                            style={{ textDecoration: 'underline', cursor: 'pointer' }}
                        >
                            Create a new account
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LoginModal;
