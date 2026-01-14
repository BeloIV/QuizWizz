import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import QuizCard from '../components/QuizCard';
import { useQuizList } from '../context/QuizContext';
import { useScores } from '../context/ScoresContext';
import { useSearch } from '../context/SearchContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

function Home() {
  const navigate = useNavigate();
  const { quizzes, loading, error } = useQuizList();
  const { scores } = useScores();
  const { searchTerm } = useSearch();
  const { user, isAuthenticated } = useAuth();
  const { favorites: favoriteQuizzes, loading: favoritesLoading } = useFavorites();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [sortByRating, setSortByRating] = useState('alpha'); // 'alpha' (default A-Z), 'desc', or 'asc'
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const quizzesWithScores = useMemo(() => {
    return quizzes.map((quiz) => {
      const scoreEntry = scores[quiz.id];
      const netRating = (quiz.likes || 0) - (quiz.dislikes || 0);
      return {
        ...quiz,
        lastScore: scoreEntry?.value,
        _takenAt: scoreEntry?.takenAt || 0,
        netRating,
      };
    });
  }, [quizzes, scores]);

  // Apply only filtering, NOT sorting
  const filteredQuizzes = useMemo(() => {
    let result = quizzesWithScores;
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((quiz) => {
        const nameMatch = quiz.name.toLowerCase().includes(term);
        const tagMatch = quiz.tags?.some((tag) => tag.toLowerCase().includes(term));
        const authorMatch = quiz.author?.toLowerCase().includes(term);
        return nameMatch || tagMatch || authorMatch;
      });
    }
    
    return result;
  }, [quizzesWithScores, searchTerm]);

  // Helper function to sort quizzes
  const sortQuizzes = (quizzesToSort) => {
    return [...quizzesToSort].sort((a, b) => {
      if (sortByRating === 'alpha') {
        return a.name.localeCompare(b.name);
      } else if (sortByRating === 'desc') {
        return b.netRating - a.netRating;
      } else if (sortByRating === 'asc') {
        return a.netRating - b.netRating;
      }
      return 0;
    });
  };

  const filteredFavorites = useMemo(() => {
    if (!isAuthenticated) return [];
    let result = favoriteQuizzes || [];
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((quiz) => {
        const nameMatch = quiz.name.toLowerCase().includes(term);
        const tagMatch = quiz.tags?.some((tag) => tag.toLowerCase().includes(term));
        const authorMatch = quiz.author?.toLowerCase().includes(term);
        return nameMatch || tagMatch || authorMatch;
      });
    }
    
    // No sorting applied - favorites are not affected by sort
    return result;
  }, [favoriteQuizzes, isAuthenticated, searchTerm]);

  const recent = useMemo(() => {
    const filtered = filteredQuizzes.filter((quiz) => quiz._takenAt);
    
    // Recent are not affected by sort - always sorted by _takenAt
    return filtered.sort((a, b) => b._takenAt - a._takenAt);
  }, [filteredQuizzes]);

  const recentToDisplay = useMemo(() => {
    return recent.slice(0, 2);
  }, [recent]);

  // All quizzes with sorting applied - no exclusions
  const allList = useMemo(() => {
    // Apply sorting to all filtered quizzes
    return sortQuizzes(filteredQuizzes);
  }, [filteredQuizzes, sortByRating]);

  return (
    <div>
      <div className="home-header">
        <div>
          <h1 className="page-title">QuizWizz</h1>
          {isAuthenticated && user && (
            <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '14px' }}>Hi {user.username} 🎉</p>
          )}
        </div>
        <button
          className="btn primary fab"
          onClick={() => navigate('/create')}
          title="Create new quiz"
          aria-label="Create new quiz"
        >
          <span className="fab-icon">+</span>
        </button>
      </div>

      {loading && <div className="muted">Loading quizzes...</div>}
      {error && !loading && <div className="empty">{error}</div>}
      {!loading && !error && (
        <>
          {searchTerm.trim() && allList.length === 0 && filteredFavorites.length === 0 ? (
            <div className="empty">No quizzes found matching "{searchTerm}"</div>
          ) : (
            <>
              {isAuthenticated && !favoritesLoading && filteredFavorites.length > 0 && (
                <>
                  <h2 className="section-title">Favorites</h2>
                  <section className="cards" id="favorites-list">
                    {filteredFavorites.map((quiz) => (
                      <QuizCard
                        key={quiz.id}
                        quiz={quiz}
                        onClick={() => navigate(`/quiz/${quiz.id}`)}
                      />
                    ))}
                  </section>
                </>
              )}

              {recentToDisplay.length > 0 && (
                <>
                  <h2 className="section-title">Recent</h2>
                  <section className="cards" id="recent-list">
                    {recentToDisplay.map((quiz) => (
                      <QuizCard
                        key={quiz.id}
                        quiz={quiz}
                        onClick={() => navigate(`/quiz/${quiz.id}`)}
                      />
                    ))}
                  </section>
                </>
              )}

              <h2 className="section-title">{searchTerm.trim() ? 'Search Results' : 'All'}</h2>
              {/* Sort by Rating - only affects "All" section */}
              <div className="sort-by-rating-container">
                <label className="sort-by-rating-label">Sort by Rating:</label>
                <div className="custom-dropdown" ref={dropdownRef}>
                  <button
                    className="custom-dropdown-toggle"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    aria-haspopup="listbox"
                    aria-expanded={dropdownOpen}
                  >
                    {sortByRating === 'alpha' ? 'A to Z' : sortByRating === 'desc' ? 'Highest to Lowest' : sortByRating === 'asc' ? 'Lowest to Highest' : 'A to Z'}
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  {dropdownOpen && (
                    <div className="custom-dropdown-menu">
                      <div
                        className={`custom-dropdown-item ${sortByRating === 'alpha' ? 'active' : ''}`}
                        onClick={() => {
                          setSortByRating('alpha');
                          setDropdownOpen(false);
                        }}
                      >
                        A to Z
                      </div>
                      <div
                        className={`custom-dropdown-item ${sortByRating === 'desc' ? 'active' : ''}`}
                        onClick={() => {
                          setSortByRating('desc');
                          setDropdownOpen(false);
                        }}
                      >
                        Highest to Lowest
                      </div>
                      <div
                        className={`custom-dropdown-item ${sortByRating === 'asc' ? 'active' : ''}`}
                        onClick={() => {
                          setSortByRating('asc');
                          setDropdownOpen(false);
                        }}
                      >
                        Lowest to Highest
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <section className="cards" id="all-list">
                {allList.length === 0 ? (
                  <div className="empty">{searchTerm.trim() ? 'No quizzes found.' : 'No quizzes yet. Create one to get started!'}</div>
                ) : (
                  allList.map((quiz) => (
                    <QuizCard
                      key={quiz.id}
                      quiz={quiz}
                      onClick={() => navigate(`/quiz/${quiz.id}`)}
                    />
                  ))
                )}
              </section>
            </>
          )}
        </>
      )}

      <footer className="app-footer">
        <p className="footer-text">
          QuizWizz • Made by Štefan Beluško, Tomáš Magula, Alex Juráška, Klára Suchá and Egor Zvonov
        </p>
        <p className="footer-text footer-text--small">
          School Project 2025/2026
        </p>
      </footer>

      {showScrollTop && (
        <button
          className="scroll-to-top"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <span>↑</span>
        </button>
      )}
    </div>
  );
}

export default Home;
