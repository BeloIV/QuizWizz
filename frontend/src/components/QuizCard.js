import { useReactions } from "../context/ReactionsContext";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../context/AuthContext";
import StarButton from "./StarButton";

function QuizCard({ quiz, onClick }) {
  const { reactions } = useReactions();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { isAuthenticated } = useAuth();
  const reactionInfo = reactions[quiz.id];

  const likes = reactionInfo?.likes ?? quiz.likes ?? 0;
  const dislikes = reactionInfo?.dislikes ?? quiz.dislikes ?? 0;
  const score = likes - dislikes;
  const scoreClass =
            score > 0 ? 'reaction-score-positive'
          : score < 0 ? 'reaction-score-negative'
              : 'reaction-score-neutral';
  const scoreIcon = score < 0 ? '👎' : '👍';

  const handleFavoriteToggle = async () => {
    try {
      await toggleFavorite(quiz);
    } catch (err) {
      if (!isAuthenticated) {
        alert('Login to save favorites');
      } else {
        console.error('Failed to toggle favorite', err);
      }
    }
  };

  const handleActivate = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
      <article
          className="card quiz-card"
          onClick={handleActivate}
          role="button"
          tabIndex={0}
          onKeyUp={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleActivate();
            }
          }}
      >
        <div className="quiz-card__header" style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
          <h3 className="quiz-card__title" style={{ margin: 0 }}>{quiz.name}</h3>
          <StarButton
            active={favoriteIds.has(quiz.id)}
            onToggle={handleFavoriteToggle}
            size={36}
            title={favoriteIds.has(quiz.id) ? 'Remove from favorites' : 'Save to favorites'}
            disabled={!isAuthenticated}
          />
        </div>
        <div className="quiz-card__meta">
          <span className="quiz-card__author">by {quiz.author}</span>
          <span className="quiz-card__score">
          {quiz.lastScore !== undefined && quiz.lastScore !== null
              ? `Last score: ${quiz.lastScore}%`
              : 'Not taken yet'}
        </span>
        </div>
        <div className="quiz-card__footer">
          <div className="quiz-card__footer-left">
            <div className={`quiz-card__reaction`}>
              <span className={`quiz-card__reaction-number ${scoreClass}`}>{score}</span>
              <span className="quiz-card__reaction-icon">{scoreIcon}</span>
            </div>
          </div>

          <div className="quiz-card__footer-right">
            <span className="quiz-card__tag">{quiz.tags?.[0] || 'general'}</span>
            <span className="quiz-card__icon">{quiz.icon || '📝'}</span>
          </div>
        </div>
      </article>
  );
}

export default QuizCard;
