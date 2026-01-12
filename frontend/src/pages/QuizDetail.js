import { Link, useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

import { useQuizDetail } from '../hooks/useQuizDetail';
import { useScores } from '../context/ScoresContext';
import { useReactions } from "../context/ReactionsContext";
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import CommentsSection from '../components/CommentsSection';
import { IoMdShare, IoMdHome } from "react-icons/io";
import ShareQuizModal from '../components/ShareQuizModal';
import { useFavorites } from '../context/FavoritesContext';
import StarButton from '../components/StarButton';

function QuizDetail() {
  const { quizId } = useParams();
  const { quiz, loading, error } = useQuizDetail(quizId);
  const { scores } = useScores();
  const scoreEntry = quiz ? scores[quiz.id] : null;
  const { reactions } = useReactions();
  const reactionInfo = reactions[quizId];
  const [popup, setPopup] = useState(null);
  const popupTimeoutRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [showShareModal, setShowShareModal] = useState(false);

  // Check for success message from quiz creation
  useEffect(() => {
    const successMessage = sessionStorage.getItem('quizSuccessMessage');
    if (successMessage) {
      setPopup({ message: successMessage, type: 'success' });
      sessionStorage.removeItem('quizSuccessMessage');
    }
  }, []);

  // Auto-dismiss popup after 2 seconds
  useEffect(() => {
    if (popup) {
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
      popupTimeoutRef.current = setTimeout(() => {
        setPopup(null);
      }, 2000);
    }
    return () => {
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
    };
  }, [popup]);

  if (loading) {
    return <div className="muted">Loading quiz...</div>;
  }

  if (error || !quiz) {
    return <div className="empty">Quiz not found.</div>;
  }

  // Determine if quiz has multi-answer questions
  const hasMultiAnswer = quiz.questions.some(q => {
    const correctCount = q.options?.filter(opt => opt.is_correct).length || 0;
    return correctCount > 1;
  });

  const likes = reactionInfo?.likes ?? quiz.likes ?? 0;
  const dislikes = reactionInfo?.dislikes ?? quiz.dislikes ?? 0;
  const score = likes - dislikes;
  const scoreClass =
            score > 0 ? 'reaction-score-positive'
          : score < 0 ? 'reaction-score-negative'
              : 'reaction-score-neutral';
  const scoreIcon = score < 0 ? '👎' : '👍';

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    try {
      await toggleFavorite(quiz);
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 60px)', gap: '16px', paddingBottom: '16px' }}>
      <div className="card stack" style={{ flex: '0 0 auto' }}>
        <div className="quiz-card__header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 className="quiz-card__title" style={{ fontSize: '20px', margin: 0 }}>{quiz.name}</h2>
            <span className="quiz-card__author">by {quiz.author}</span>
            {scoreEntry?.value !== undefined && (
              <span className="quiz-card__score" style={{ marginTop: '4px' }}>Last score: {scoreEntry.value}%</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            {isAuthenticated && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <StarButton
                  active={favoriteIds.has(quiz.id)}
                  onToggle={handleFavoriteToggle}
                  size={44}
                  title={favoriteIds.has(quiz.id) ? 'Remove from favorites' : 'Save to favorites'}
                />
                <button
                  className="icon-btn"
                  onClick={() => setShowShareModal(true)}
                  aria-label="Share quiz"
                  style={{ width: '44px', height: '44px', fontSize: '22px' }}
                >
                  <IoMdShare size={24} />
                </button>
              </div>
            )}
            <div className="quiz-card__reaction" style={{ fontSize: '20px', gap: '8px' }}>
              <span className={`quiz-card__reaction-number ${scoreClass}`} style={{ fontSize: '20px' }}>{score}</span>
              <span className="quiz-card__reaction-icon" style={{ fontSize: '22px' }}>{scoreIcon}</span>
            </div>
          </div>
        </div>

        <div className="quiz-card__footer" style={{ alignItems: 'flex-end' }}>
          <div className="quiz-card__footer-left" />
          <div className="quiz-card__footer-right">
            <span className="quiz-card__tag">{quiz.tags?.[0] || 'general'}</span>
            <span className="quiz-card__icon">{quiz.icon || '📝'}</span>
          </div>
        </div>

        <div>{quiz.questions.length} questions</div>
        <div className="muted" style={{ fontSize: '14px' }}>
          {hasMultiAnswer ? '⚠️ One or more answers can be correct' : '✓ Single answer per question'}
        </div>
      </div>

      <CommentsSection quizId={quiz.id} />

      <div aria-hidden="true" style={{ flex: 1 }} />

      <div className="footer-actions row" style={{ justifyContent: 'space-between', alignSelf: 'stretch', marginBottom: '12px' }}>
        <Link className="btn btn-secondary" to="/">
          🏠 Home
        </Link>
        <Link className="btn primary" to={`/play/${quiz.id}`}>
          🧠 Start
        </Link>
      </div>

      {popup && (
        <div
          className={`popup ${popup.type === 'warning' ? 'popup--danger' : 'popup--success'} popup--top`}
          role="alert"
          aria-live="assertive"
        >
          {popup.message}
        </div>
      )}

      {showShareModal && (
        <ShareQuizModal 
          quiz={quiz} 
          onClose={() => setShowShareModal(false)} 
        />
      )}
    </div>
  );
}

export default QuizDetail;
