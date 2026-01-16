import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';

import Drawer from './Drawer';
import { useSearch } from '../context/SearchContext';
import { useTheme } from '../context/ThemeContext';
import { useMessages } from '../context/MessagesContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';

function Header() {
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { open: searchOpen, searchTerm, openSearch, closeSearch, setSearchTerm } = useSearch();
  const { toggleTheme } = useTheme();
  const { unreadCount, unviewedQuizzesCount } = useMessages();
  const { isAuthenticated, logout, loading } = useAuth();
  const { showLoginModal, showRegisterModal, openLoginModal, openRegisterModal, closeModals } = useAuthModal();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPlayLeaveConfirm, setShowPlayLeaveConfirm] = useState(false);

  const isHomePage = location.pathname === '/';
  const isPlayRoute = location.pathname.startsWith('/play');

  const totalNotifications = unreadCount + unviewedQuizzesCount;

  useEffect(() => {
    setMenuOpen(false);
    closeSearch();
    setShowPlayLeaveConfirm(false);
  }, [location, closeSearch]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const route = useMemo(() => {
    if (location.pathname.startsWith('/quiz')) {
      return '/quiz';
    }
    if (location.pathname.startsWith('/play')) {
      return '/play';
    }
    if (location.pathname.startsWith('/results')) {
      return '/results';
    }
    return '/';
  }, [location.pathname]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const toggleSearch = () => {
    if (!isHomePage) return;
    setMenuOpen(false);
    if (searchOpen) {
      closeSearch();
    } else {
      openSearch();
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeSearch();
    }
  };

  const handleHomeClick = () => {
    if (isPlayRoute) {
      setShowPlayLeaveConfirm(true);
      return;
    }
    navigate('/');
  };

  const confirmLeavePlayToHome = () => {
    setShowPlayLeaveConfirm(false);
    navigate('/');
  };

  return (
    <>
      <div className={`app-header__inner${searchOpen ? ' search-active' : ''}`} ref={containerRef}>
        <div className="app-header__section app-header__section--left">
          {!searchOpen && (
            <button
              type="button"
              className={`icon-btn hamburger-btn${menuOpen ? ' is-open' : ''}`}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={toggleMenu}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {totalNotifications > 0 && (
                <span className="badge badge-hamburger">{totalNotifications}</span>
              )}
            </button>
          )}
        </div>
        {searchOpen && isHomePage ? (
          <div className="header-search-wrapper">
            <input
              ref={searchInputRef}
              type="text"
              className="header-search-input"
              placeholder="Search quizzes by name or tag"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
        ) : (
          <button
            type={"button"}
            className={`header-brand${route === '/' ? ' active' : ''}`}
            onClick={handleHomeClick}
          >
            QuizWizz
          </button>
        )}
        <div className="app-header__section app-header__section--right">
          {isHomePage && (
            <button
              type="button"
              className={`icon-btn icon-btn--ghost${searchOpen ? ' active' : ''}`}
              data-search-toggle="true"
              aria-label={searchOpen ? 'Close search' : 'Search quizzes'}
              onClick={toggleSearch}
            >
              {searchOpen ? (
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M6 6l12 12M6 18L18 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <circle
                    cx="11"
                    cy="11"
                    r="5.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <path
                    d="M15.8 15.8 20 20"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          )}
          <button
            type="button"
            className="icon-btn icon-btn--ghost"
            aria-label="Toggle theme"
            onClick={toggleTheme}
          >
            <span aria-hidden="true">🌗</span>
          </button>
        </div>
      </div>

      <Drawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <LoginModal
        isOpen={showLoginModal}
        onClose={closeModals}
        onSwitchToRegister={openRegisterModal}
      />

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={closeModals}
        onSwitchToLogin={openLoginModal}
      />

      {showLogoutConfirm && (
        <div className="modal-backdrop" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Logout</h2>
            <p>Are you sure you want to logout?</p>
            <div className="modal-buttons">
              <button
                className="btn secondary"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn primary"
                onClick={confirmLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {showPlayLeaveConfirm && createPortal(
          <div className="dialog-overlay" role="presentation" onClick={() => setShowQuitDialog(false)}>
            <div
                className="dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="quit-title"
                onClick={(e) => e.stopPropagation()}
            >
              <h3 id="quit-title" className="dialog__title">Are you sure you want to quit?</h3>
              <p className="dialog__body">You will lose your answers.</p>
              <div className="dialog__actions">
                <button type="button" className="btn" onClick={() => setShowPlayLeaveConfirm(false)}>
                  Cancel
                </button>
                <button
                    type="button"
                    className="btn danger"
                    onClick={() => navigate('/')}
                    autoFocus
                >
                  Quit
                </button>
              </div>
            </div>
          </div>,
          document.body
      )}
    </>
  );
}

export default Header;
