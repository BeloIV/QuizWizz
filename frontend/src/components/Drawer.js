import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoginModal from './LoginModal';

function Drawer({ isOpen, onClose }) {
    const drawerRef = useRef(null);
    const { user, logout, isAuthenticated, loading } = useAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const navigate = useNavigate();

    // NOTE: do not return early before declaring all hooks —
    // we'll check `loading` after hooks to avoid changing hook order.

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape' && isOpen && !isClosing) {
                closeDrawer();
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
        closeDrawer(() => {
            navigate(path);
        });
    };

    const closeDrawer = (afterClose) => {
        if (isClosing) return;

        setIsClosing(true);

        const drawer = drawerRef.current;
        const duration =
            parseFloat(getComputedStyle(drawer).animationDuration) * 1000;

        setTimeout(() => {
            setIsClosing(false);
            onClose();
            afterClose?.();
        }, duration);
    };

    if (!isOpen) {
        return null;
    }

    return (
        <>
            <div
                className={`drawer-overlay ${isClosing ? 'overlay--closing' : ''}`}
                onClick={() => { closeDrawer()}}
                role="presentation"
            />
            <div
                className={`drawer ${isClosing ? 'drawer--closing' : ''}`}
                ref={drawerRef}
                onClick={(e) => e.stopPropagation()}
                role="navigation"
                aria-label="Main navigation"
            >
                <nav className="drawer-menu">
                    {/* User Account Section */}
                    <div className="drawer-section">
                        <h3 className="drawer-section-title">Accounts</h3>
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
                                    <svg
                                        className="text-icon"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M9 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h3"/>
                                        <path d="M14 7l5 5-5 5"/>
                                        <path d="M19 12H7"/>
                                    </svg>

                                    <span> Logout</span>
                                </button>
                            </>
                        ) : (
                            <button
                                className="drawer-menu-button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    console.log('Login button clicked');
                                    setShowLoginModal(true);
                                }}
                            >
                                <svg
                                    className="text-icon"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M15 3h3a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-3"/>
                                    <path d="M10 17l5-5-5-5"/>
                                    <path d="M15 12H3"/>
                                </svg>


                                <span>  Login</span>
                            </button>
                        )}
                    </div>

                    {/* Messaging Section */}
                    {isAuthenticated && (
                        <>
                            <div className="drawer-divider"></div>
                            <div className="drawer-section">
                                <h3 className="drawer-section-title">My Content</h3>
                                <button
                                    className="drawer-menu-button"
                                    onClick={() => navigateTo('/my-quizzes')}
                                >
                                    My Quizzes
                                </button>
                            </div>
                            <div className="drawer-divider"></div>
                            <div className="drawer-section">
                                <h3 className="drawer-section-title">Social</h3>
                                <button
                                    className="drawer-menu-button"
                                    onClick={() => navigateTo('/messages')}
                                >
                                    💬 Messages
                                </button>
                                <button
                                    className="drawer-menu-button"
                                    onClick={() => navigateTo('/shared-quizzes')}
                                >
                                    🔗 Shared Quizzes
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
                            🏠 Home
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
