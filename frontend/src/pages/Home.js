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
  const [sortByRating, setSortByRating] = useState(null); // null, 'asc', or 'desc'
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
    
    // Sort by rating if enabled
    if (sortByRating) {
      result = [...result].sort((a, b) => {
        return sortByRating === 'desc' 
          ? b.netRating - a.netRating 
          : a.netRating - b.netRating;
      });
    }
    
    return result;
  }, [quizzesWithScores, searchTerm, sortByRating]);

  const filteredFavorites = useMemo(() => {
    if (!isAuthenticated) return [];
    if (!searchTerm.trim()) {
      return favoriteQuizzes || [];
    }
    const term = searchTerm.toLowerCase();
    return (favoriteQuizzes || []).filter((quiz) => {
      const nameMatch = quiz.name.toLowerCase().includes(term);
      const tagMatch = quiz.tags?.some((tag) => tag.toLowerCase().includes(term));
      const authorMatch = quiz.author?.toLowerCase().includes(term);
      return nameMatch || tagMatch || authorMatch;
    });
  }, [favoriteQuizzes, isAuthenticated, searchTerm]);

  const recent = useMemo(() => {
    const filtered = filteredQuizzes.filter((quiz) => quiz._takenAt);
    // Don't show recent section when sorting by rating
    if (sortByRating) {
      return []; // Return empty when sorting by rating
    }
    return filtered.sort((a, b) => b._takenAt - a._takenAt);
  }, [filteredQuizzes, sortByRating]);

  const recentToDisplay = useMemo(() => {
    return recent.slice(0, 2);
  }, [recent]);

  const remaining = useMemo(() => {
    const recentIds = new Set(recentToDisplay.map((quiz) => quiz.id));
    return filteredQuizzes.filter((quiz) => !recentIds.has(quiz.id));
  }, [filteredQuizzes, recentToDisplay]);

  const allList = useMemo(() => {
    return searchTerm.trim() ? filteredQuizzes : remaining;
  }, [filteredQuizzes, remaining, searchTerm]);

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
          {/* Sort by Rating */}
          <div className="sort-by-rating-container">
            <label className="sort-by-rating-label">Sort by Rating:</label>
            <div className="custom-dropdown" ref={dropdownRef}>
              <button
                className="custom-dropdown-toggle"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
              >
                {sortByRating === 'desc' ? 'Highest to Lowest' : sortByRating === 'asc' ? 'Lowest to Highest' : 'Default'}
                <span className="dropdown-arrow">▼</span>
              </button>
              {dropdownOpen && (
                <div className="custom-dropdown-menu">
                  <div
                    className={`custom-dropdown-item ${sortByRating === null ? 'active' : ''}`}
                    onClick={() => {
                      setSortByRating(null);
                      setDropdownOpen(false);
                    }}
                  >
                    Default
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
