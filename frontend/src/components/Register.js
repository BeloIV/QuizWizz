import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

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

        const result = await register(username, password);
        
        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }
        
        setLoading(false);
    };

    return (
        <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px' }}>
            <h2>Create Account</h2>
            
            {error && (
                <div className="login-error" style={{ 
                    padding: '10px', 
                    marginBottom: '20px', 
                    backgroundColor: '#fee', 
                    border: '1px solid #fcc',
                    borderRadius: '4px',
                    color: '#c33'
                }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label htmlFor="username" style={{ display: 'block', marginBottom: '5px' }}>
                        Username *
                    </label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Choose a username"
                        disabled={loading}
                        required
                        style={{ 
                            width: '100%', 
                            padding: '8px', 
                            borderRadius: '4px',
                            border: '1px solid #ccc'
                        }}
                    />
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
                        Password *
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password (min 6 characters)"
                        disabled={loading}
                        required
                        style={{ 
                            width: '100%', 
                            padding: '8px', 
                            borderRadius: '4px',
                            border: '1px solid #ccc'
                        }}
                    />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '5px' }}>
                        Confirm Password *
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        disabled={loading}
                        required
                        style={{ 
                            width: '100%', 
                            padding: '8px', 
                            borderRadius: '4px',
                            border: '1px solid #ccc'
                        }}
                    />
                </div>

                <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={loading}
                    style={{ width: '100%', padding: '10px', marginBottom: '15px' }}
                >
                    {loading ? 'Creating Account...' : 'Register'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                    Already have an account? <Link to="/login">Login here</Link>
                </div>
            </form>
        </div>
    );
}

export default Register;
