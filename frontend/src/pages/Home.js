import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import QuizCard from '../components/QuizCard';
import { useQuizList } from '../context/QuizContext';
import { useScores } from '../context/ScoresContext';
import { useSearch } from '../context/SearchContext';

function Home() {
  const navigate = useNavigate();
  const { quizzes, loading, error } = useQuizList();
  const { scores } = useScores();
  const { searchTerm } = useSearch();
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

  const recent = useMemo(() => {
    const filtered = filteredQuizzes.filter((quiz) => quiz._takenAt);
    // Only sort by _takenAt if not sorting by rating
    if (sortByRating) {
      return filtered; // Keep the rating sort from filteredQuizzes
    }
    return filtered.sort((a, b) => b._takenAt - a._takenAt);
  }, [filteredQuizzes, sortByRating]);

  const recentToDisplay = useMemo(() => {
    return recent.slice(0, 3);
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
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        background: 'rgba(22, 38, 72, 0.85)',
        borderRadius: '12px',
        border: '1px solid rgba(118, 139, 180, 0.25)',
      }}>
        <span style={{ fontWeight: '500', fontSize: '0.95rem', color: 'var(--text)' }}>Sort by Rating:</span>
        <button
          onClick={() => setSortByRating(sortByRating === 'desc' ? null : 'desc')}
          style={{
            padding: '0.5rem 0.75rem',
            border: sortByRating === 'desc' ? '1px solid rgba(110, 168, 255, 0.6)' : '1px solid rgba(118, 139, 180, 0.35)',
            borderRadius: '10px',
            background: sortByRating === 'desc' ? 'rgba(110, 168, 255, 0.28)' : 'rgba(20, 35, 66, 0.6)',
            color: sortByRating === 'desc' ? 'var(--primary)' : 'var(--text)',
            cursor: 'pointer',
            fontSize: '1.2rem',
            fontWeight: sortByRating === 'desc' ? '700' : '400',
            transition: 'all 0.2s ease',
            minWidth: '44px',
            boxShadow: sortByRating === 'desc' ? '0 8px 18px rgba(10, 20, 42, 0.35)' : 'none',
          }}
          title="Sort highest rating first"
          onMouseEnter={(e) => {
            if (sortByRating !== 'desc') {
              e.currentTarget.style.background = 'rgba(110, 168, 255, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(110, 168, 255, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (sortByRating !== 'desc') {
              e.currentTarget.style.background = 'rgba(20, 35, 66, 0.6)';
              e.currentTarget.style.borderColor = 'rgba(118, 139, 180, 0.35)';
            }
          }}
        >
          ↓
        </button>
        <button
          onClick={() => setSortByRating(sortByRating === 'asc' ? null : 'asc')}
          style={{
            padding: '0.5rem 0.75rem',
            border: sortByRating === 'asc' ? '1px solid rgba(110, 168, 255, 0.6)' : '1px solid rgba(118, 139, 180, 0.35)',
            borderRadius: '10px',
            background: sortByRating === 'asc' ? 'rgba(110, 168, 255, 0.28)' : 'rgba(20, 35, 66, 0.6)',
            color: sortByRating === 'asc' ? 'var(--primary)' : 'var(--text)',
            cursor: 'pointer',
            fontSize: '1.2rem',
            fontWeight: sortByRating === 'asc' ? '700' : '400',
            transition: 'all 0.2s ease',
            minWidth: '44px',
            boxShadow: sortByRating === 'asc' ? '0 8px 18px rgba(10, 20, 42, 0.35)' : 'none',
          }}
          title="Sort lowest rating first"
          onMouseEnter={(e) => {
            if (sortByRating !== 'asc') {
              e.currentTarget.style.background = 'rgba(110, 168, 255, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(110, 168, 255, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (sortByRating !== 'asc') {
              e.currentTarget.style.background = 'rgba(20, 35, 66, 0.6)';
              e.currentTarget.style.borderColor = 'rgba(118, 139, 180, 0.35)';
            }
          }}
        >
          ↑
        </button>
      </div>

      {loading && <div className="muted">Loading quizzes...</div>}
      {error && !loading && <div className="empty">{error}</div>}
      {!loading && !error && (
        <>
          {searchTerm.trim() && filteredQuizzes.length === 0 ? (
            <div className="empty">No quizzes found matching "{searchTerm}"</div>
          ) : (
            <>
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
                {quizzesWithScores.length === 0 ? (
                  <div className="empty">No quizzes yet. Create one to get started!</div>
                ) : remaining.length === 0 && !searchTerm.trim() ? (
                  <div className="empty">All your quizzes are already in Recent.</div>
                ) : searchTerm.trim() ? (
                  filteredQuizzes.map((quiz) => (
                    <QuizCard
                      key={quiz.id}
                      quiz={quiz}
                      onClick={() => navigate(`/quiz/${quiz.id}`)}
                    />
                  ))
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
