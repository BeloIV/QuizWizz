import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import Drawer from './Drawer';
import { useSearch } from '../context/SearchContext';
import { useTheme } from '../context/ThemeContext';

function Header() {
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const location = useLocation();
  const { open: searchOpen, searchTerm, openSearch, closeSearch, setSearchTerm } = useSearch();
  const { toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    setMenuOpen(false);
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

  const toggleMenu = () => {
    console.log('toggleMenu called, menuOpen will be:', !menuOpen);
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
          <Link
            to="/"
            className={`header-brand${route === '/' ? ' active' : ''}`}
          >
            QuizWizz
          </Link>
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
    </>
  );
}

export default Header;
