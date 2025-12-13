import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoginModal from './LoginModal';

function Drawer({ isOpen, onClose }) {
    const drawerRef = useRef(null);
    const { user, logout, isAuthenticated, loading } = useAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const navigate = useNavigate();

    // NOTE: do not return early before declaring all hooks —
    // we'll check `loading` after hooks to avoid changing hook order.

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        document.body.classList.toggle('menu-open', isOpen);
        return () => {
            document.body.classList.remove('menu-open');
        };
    }, [isOpen]);

    // Wait for auth check before rendering drawer to avoid stuck "logged out" UI
    if (loading) {
        return null; // or return a spinner element if you want
    }

    console.log('Drawer rendering, isOpen:', isOpen, 'loading:', loading, 'showLoginModal:', showLoginModal);

    const handleLogout = async () => {
        await logout();
    };

    const navigateTo = (path) => {
        navigate(path);
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <>
            <div
                className="drawer-overlay"
                onClick={() => { console.log('drawer overlay clicked'); onClose && onClose(); }}
                role="presentation"
            />
            <div
                className="drawer"
                ref={drawerRef}
                role="navigation"
                aria-label="Main navigation"
            >
                <nav className="drawer-menu">
                    {/* User Account Section */}
                    <div className="drawer-section">
                        <h3 className="drawer-section-title">Accountss</h3>
                        {isAuthenticated ? (
                            <>
                                <div className="drawer-user-info">
                                    <p className="drawer-username">
                                        Logged in as: <strong>{user?.username}</strong>
                                    </p>
                                </div>
                                <button
                                    className="drawer-menu-button"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <button
                                className="drawer-menu-button"
                                onClick={(e) => { e.stopPropagation(); console.log('Login button clicked'); setShowLoginModal(true); }}
                            >
                                Login
                            </button>
                        )}
                    </div>

                    {/* Messaging Section */}
                    {isAuthenticated && (
                        <>
                            <div className="drawer-divider"></div>
                            <div className="drawer-section">
                                <h3 className="drawer-section-title">Social</h3>
                                <button
                                    className="drawer-menu-button"
                                    onClick={() => navigateTo('/messages')}
                                >
                                    Messages
                                </button>
                                <button
                                    className="drawer-menu-button"
                                    onClick={() => navigateTo('/shared-quizzes')}
                                >
                                    Shared Quizzes
                                </button>
                            </div>
                        </>
                    )}

                    {/* Home Navigation */}
                    <div className="drawer-divider"></div>
                    <div className="drawer-section">
                        <button
                            className="drawer-menu-button"
                            onClick={() => navigateTo('/')}
                        >
                            Home
                        </button>
                    </div>
                </nav>
            </div>

            {/* Login Modal */}
            <LoginModal 
                isOpen={showLoginModal} 
                onClose={() => setShowLoginModal(false)} 
            />
        </>
    );
}

export default Drawer;
