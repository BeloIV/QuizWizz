import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function RegisterModal({ isOpen, onClose, onSwitchToLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!username || !password) {
            setError('Username and password are required');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        console.debug('RegisterModal: submit', { username });
        const result = await register(username, password);
        
        if (result.success) {
            setUsername('');
            setPassword('');
            setConfirmPassword('');
            onClose();
        } else {
            setError(result.error);
        }
        
        setLoading(false);
    };

    useEffect(() => {
        console.log('RegisterModal: isOpen =>', isOpen);
    }, [isOpen]);

    if (!isOpen) return null;

    console.log('RegisterModal rendering, isOpen:', isOpen);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content login-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Register to QuizWizz</h2>
                
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
                            placeholder="Choose a username"
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
                            placeholder="Enter password (min 6 characters)"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="modal-actions" style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '140px' }}>
                            {loading ? 'Creating Account...' : 'Register'}
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

                {onSwitchToLogin && (
                    <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                        <p style={{ margin: '0 0 10px 0', color: '#666' }}>Already have an account?</p>
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            disabled={loading}
                            className="btn btn-link"
                            style={{ textDecoration: 'underline', cursor: 'pointer' }}
                        >
                            Login here
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RegisterModal;
