import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useSearch } from '../context/SearchContext';
import { useTheme } from '../context/ThemeContext';

function Header() {
  const containerRef = useRef(null);
  const location = useLocation();
  const { open: searchOpen, openSearch, closeSearch } = useSearch();
  const { toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!containerRef.current) {
        return;
      }
      if (containerRef.current.contains(event.target)) {
        return;
      }
      setMenuOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        closeSearch();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [closeSearch]);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
    closeSearch();
  }, [location, closeSearch]);

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
    setMenuOpen((prev) => !prev);
  };

  const toggleSearch = () => {
    setMenuOpen(false);
    if (searchOpen) {
      closeSearch();
    } else {
      openSearch('');
    }
  };

  return (
    <>
      <div className="app-header__inner" ref={containerRef}>
        <div className="app-header__section app-header__section--left">
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
        </div>
        <Link
          to="/"
          className={`header-brand${route === '/' ? ' active' : ''}`}
        >
          QuizWizz
        </Link>
        <div className="app-header__section app-header__section--right">
          <button
            type="button"
            className={`icon-btn icon-btn--ghost${searchOpen ? ' active' : ''}`}
            data-search-toggle="true"
            aria-label="Search quizzes"
            onClick={toggleSearch}
          >
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
          </button>
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
      {menuOpen && (
        <nav className="app-header__menu" role="menu">
          <Link
            to="/"
            className={`menu-link${route === '/' ? ' active' : ''}`}
            role="menuitem"
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>
          <button
            type="button"
            className={`menu-link${searchOpen ? ' active' : ''}`}
            data-search-toggle="true"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              openSearch('');
            }}
          >
            Search
          </button>
        </nav>
      )}
    </>
  );
}

export default Header;
