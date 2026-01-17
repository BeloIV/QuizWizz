import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate,  } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { LuLogOut, LuUser } from 'react-icons/lu';

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
  const [showPlayLeaveConfirm, setShowPlayLeaveConfirm] = useState(false);

  const isHomePage = location.pathname === '/';
  const isPlayRoute = location.pathname.startsWith('/play');

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();

    setShowPlayLeaveConfirm(false);
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
          <button
            type={"button"}
            className={`header-brand${route === '/' ? ' active' : ''}`}
            onClick={handleHomeClick}
          >
            QuizWizz
          </button>
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
                <LuUser size={20} />
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

      {showLogoutConfirm && createPortal(
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
        </div>,
        document.body
      )}

      {showPlayLeaveConfirm && createPortal(
          <div
              className="dialog-overlay"
              role="presentation"
              onClick={() => setShowPlayLeaveConfirm(false)}
          >
            <div
                className="dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="leave-play-title"
                onClick={(e) => e.stopPropagation()}
            >
              <h3 id="leave-play-title" className="dialog__title">
                Are you sure you want to quit?
              </h3>
              <p className="dialog__body">You will lose your answers.</p>
              <div className="dialog__actions">
                <button type="button" className="btn" onClick={() => setShowPlayLeaveConfirm(false)}>
                  Cancel
                </button>
                <button
                    type="button"
                    className="btn danger"
                    onClick={confirmLeavePlayToHome}
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
