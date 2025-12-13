import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function LoginModal({ isOpen, onClose }) {
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
        } else {
            setError(result.error);
        }
        
        setLoading(false);
    };

    const quickLogin = async (user) => {
        setError('');
        setLoading(true);
        console.debug('LoginModal: quickLogin', { user });
        const result = await login(user, user);
        
        if (result.success) {
            onClose();
        } else {
            setError(result.error);
        }
        
        setLoading(false);
    };

    useEffect(() => {
        console.log('LoginModal: isOpen =>', isOpen);
    }, [isOpen]);

    if (!isOpen) return null;

    console.log('LoginModal rendering, isOpen:', isOpen);

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

                    <div className="modal-actions">
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                        <button 
                            type="button" 
                            className="btn-secondary" 
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    </div>
                </form>

                <div className="quick-login-section">
                    <p className="quick-login-title">Quick Login (for testing):</p>
                    <div className="quick-login-buttons">
                        <button 
                            onClick={() => quickLogin('user1')} 
                            className="btn-secondary"
                            disabled={loading}
                        >
                            User 1
                        </button>
                        <button 
                            onClick={() => quickLogin('user2')} 
                            className="btn-secondary"
                            disabled={loading}
                        >
                            User 2
                        </button>
                        <button 
                            onClick={() => quickLogin('user3')} 
                            className="btn-secondary"
                            disabled={loading}
                        >
                            User 3
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginModal;
