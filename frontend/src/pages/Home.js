import { useMemo, useState, useEffect } from 'react';
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

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    // Only sort by _takenAt if not sorting by rating
    if (sortByRating) {
      return filtered; // Keep the rating sort from filteredQuizzes
    }
    return filtered.sort((a, b) => b._takenAt - a._takenAt);
  }, [filteredQuizzes, sortByRating]);

  const recentToDisplay = useMemo(() => {
    return recent.slice(0, 2);
  }, [recent]);

  const recentIds = useMemo(() => {
    return new Set(recentToDisplay.map((quiz) => quiz.id));
  }, [recentToDisplay]);

  const remaining = useMemo(() => {
    return filteredQuizzes.filter((quiz) => !recentIds.has(quiz.id));
  }, [filteredQuizzes, recentIds]);


  return (
    <div>
      <div className="home-header">
        <h1 className="page-title">QuizWizz</h1>
        <button
          className="btn primary fab"
          onClick={() => navigate('/create')}
          title="Create new quiz"
          aria-label="Create new quiz"
        >
          <span className="fab-icon">+</span>
        </button>
      </div>

      {/* Sort by Rating */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        marginBottom: '1rem',
        background: 'rgba(22, 38, 72, 0.85)',
        borderRadius: '8px',
        border: '1px solid rgba(118, 139, 180, 0.25)',
      }}>
        <label htmlFor="rating-sort" style={{ fontWeight: '500', fontSize: '0.85rem', color: 'var(--text)' }}>Sort by Rating:</label>
        <select
          id="rating-sort"
          value={sortByRating || ''}
          onChange={(e) => setSortByRating(e.target.value || null)}
          style={{
            padding: '0.4rem 0.6rem',
            borderRadius: '6px',
            border: '1px solid rgba(118, 139, 180, 0.35)',
            background: 'rgba(20, 35, 66, 0.6)',
            color: 'var(--text)',
            fontSize: '0.85rem',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="">Default</option>
          <option value="desc">Highest to Lowest</option>
          <option value="asc">Lowest to Highest</option>
        </select>
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

              {recentToDisplay.length > 0 && !searchTerm.trim() && (
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
                {remaining.length === 0 ? (
                  <div className="empty">{searchTerm.trim() ? 'No quizzes found.' : 'No quizzes yet. Create one to get started!'}</div>
                ) : (
                  remaining.map((quiz) => (
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
