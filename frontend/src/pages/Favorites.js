import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import QuizCard from '../components/QuizCard';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';

function Favorites() {
  const navigate = useNavigate();
  const { favorites, loading, error, refresh } = useFavorites();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    }
  }, [isAuthenticated, refresh]);

  if (!isAuthenticated) {
    return <div className="empty">Log in to view your favorites.</div>;
  }

  return (
    <div>
      <div className="home-header">
        <div>
          <h1 className="page-title">Favorites</h1>
          <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '14px' }}>Your saved quizzes</p>
        </div>
      </div>

      {loading && <div className="muted">Loading favorites...</div>}
      {error && !loading && <div className="empty">{error}</div>}
      {!loading && !error && favorites.length === 0 && (
        <div className="empty">No favorites yet. Tap the star on a quiz to save it.</div>
      )}

      {!loading && !error && favorites.length > 0 && (
        <section className="cards" id="favorites-list">
          {favorites.map((quiz) => (
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
