import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import '../styles/StarButton.css';

function StarButton({ quizId, size = 'medium' }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  const favorite = isFavorite(quizId);

  const handleClick = (e) => {
    e.stopPropagation();
    toggleFavorite(quizId);
  };

  return (
    <button
      className={`star-button star-button--${size} ${favorite ? 'star-button--filled' : 'star-button--outlined'}`}
      onClick={handleClick}
      title={favorite ? 'Remove from favorites' : 'Add to favorites'}
      aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <span className="star-button__icon">★</span>
    </button>
  );
}

export default StarButton;
