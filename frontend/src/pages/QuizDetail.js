import { Link, useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

import { useQuizDetail } from '../hooks/useQuizDetail';
import { useScores } from '../context/ScoresContext';
import { useReactions } from "../context/ReactionsContext";
import { useAuth } from '../context/AuthContext';
import ShareQuizModal from '../components/ShareQuizModal';

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

  return (
    <div>
      <h2 className="section-title">{quiz.name}</h2>
      <div className="card stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="pill">{quiz.tags.join(' • ')}</span>
          <span className="muted">by {quiz.author}</span>
        </div>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <div className="reaction-stats">
            <div className="reaction-stat">
              <span className={`reaction-stat-number ${scoreClass}`}>{score}</span>
              <span className="reaction-stat-icon">{scoreIcon}</span>
            </div>
          </div>
        </div>
        <div>{quiz.questions.length} questions</div>
        <div className="muted" style={{ fontSize: '14px' }}>
          {hasMultiAnswer ? '⚠️ One or more answers can be correct' : '✓ Single answer per question'}
        </div>
        {scoreEntry?.value !== undefined && (
          <div className="muted">Last score: {scoreEntry.value}%</div>
        )}
        <div className="row">
          <Link className="btn cta" to={`/play/${quiz.id}`}>
            🧠 Start
          </Link>
          {isAuthenticated && (
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowShareModal(true)}
              style={{ marginLeft: '8px' }}
            >
              🔗 Share
            </button>
          )}
          <Link className="btn btn-secondary" to="/">
            ← Back
          </Link>
        </div>
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
