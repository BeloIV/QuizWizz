import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import QuizCard from '../components/QuizCard';
import { useQuizList } from '../context/QuizContext';
import { useScores } from '../context/ScoresContext';
import { useSearch } from '../context/SearchContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';

function Favorites() {
  const navigate = useNavigate();
  const { quizzes, loading, error } = useQuizList();
  const { scores } = useScores();
  const { searchTerm } = useSearch();
  const { favorites } = useFavorites();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const favoriteQuizzes = useMemo(() => {
    return quizzes.filter(quiz => favorites.includes(quiz.id));
  }, [quizzes, favorites]);

  const quizzesWithScores = useMemo(() => {
    return favoriteQuizzes.map((quiz) => {
      const scoreEntry = scores[quiz.id];
      return {
        ...quiz,
        lastScore: scoreEntry?.value,
        _takenAt: scoreEntry?.takenAt || 0,
      };
    });
  }, [favoriteQuizzes, scores]);

  const filteredQuizzes = useMemo(() => {
    if (!searchTerm.trim()) {
      return quizzesWithScores;
    }
    const term = searchTerm.toLowerCase();
    return quizzesWithScores.filter((quiz) => {
      const nameMatch = quiz.name.toLowerCase().includes(term);
      const tagMatch = quiz.tags?.some((tag) => tag.toLowerCase().includes(term));
      const authorMatch = quiz.author?.toLowerCase().includes(term);
      return nameMatch || tagMatch || authorMatch;
    });
  }, [quizzesWithScores, searchTerm]);

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return <div className="muted">Loading favorites...</div>;
  }

  if (error) {
    return <div className="empty">{error}</div>;
  }

  return (
    <div>
      <div className="home-header">
        <h1 className="page-title">My Favorites</h1>
      </div>

      {favoriteQuizzes.length === 0 && !searchTerm.trim() ? (
        <div className="empty">You haven't added any favorites yet. Star your favorite quizzes to see them here.</div>
      ) : searchTerm.trim() && filteredQuizzes.length === 0 ? (
        <div className="empty">No favorite quizzes found matching "{searchTerm}"</div>
      ) : (
        <section className="cards" id="favorites-list">
          {filteredQuizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onClick={() => navigate(`/quiz/${quiz.id}`)}
            />
          ))}
        </section>
      )}
    </div>
  );
}

export default Favorites;
