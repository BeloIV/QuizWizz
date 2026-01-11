import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LuLogOut, LuLogIn } from 'react-icons/lu';

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
  const { open: searchOpen, searchTerm, openSearch, closeSearch, setSearchTerm } = useSearch();
  const { toggleTheme } = useTheme();
  const { unreadCount, unviewedQuizzesCount } = useMessages();
  const { isAuthenticated, logout, loading } = useAuth();
  const { showLoginModal, showRegisterModal, openLoginModal, openRegisterModal, closeModals } = useAuthModal();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const isHomePage = location.pathname === '/';

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const totalNotifications = unreadCount + unviewedQuizzesCount;

  useEffect(() => {
    closeSearch();
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

  const toggleSearch = () => {
    if (!isHomePage) return;
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

  return (
    <>
      <div className={`app-header__inner${searchOpen ? ' search-active' : ''}`} ref={containerRef}>
        <div className="app-header__section app-header__section--left">
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
          {!searchOpen && !loading && (
            <button
              type="button"
              className="icon-btn icon-btn--ghost"
              aria-label="Toggle theme"
              onClick={toggleTheme}
            >
              <span aria-hidden="true">🌗</span>
            </button>
          )}
          {searchOpen && isHomePage && (
            <div className="header-search-wrapper">
              <input
                ref={searchInputRef}
                type="text"
                className="header-search-input"
                placeholder="Search by name, tag, or creator"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
          )}
        </div>
        {!searchOpen && (
          <Link
            to="/"
            className={`header-brand${route === '/' ? ' active' : ''}`}
          >
            QuizWizz
          </Link>
        )}
        <div className="app-header__section app-header__section--right">
          {!searchOpen && !loading && (
            isAuthenticated ? (
              <button
                type="button"
                className="icon-btn icon-btn--logout"
                aria-label="Logout"
                onClick={handleLogoutClick}
              >
                <LuLogOut size={20} />
              </button>
            ) : (
              <button
                type="button"
                className="icon-btn"
                aria-label="Login"
                onClick={openLoginModal}
              >
                <LuLogIn size={20} />
              </button>
            )
          )}
        </div>
      </div>

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
    </>
  );
}

export default Header;
