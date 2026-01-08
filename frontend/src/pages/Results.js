import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { IoMdShare } from "react-icons/io";

import { useQuizDetail } from '../hooks/useQuizDetail';
import { useQuizList } from '../context/QuizContext';
import { useScores } from '../context/ScoresContext';
import { useReactions } from '../context/ReactionsContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import ShareQuizModal from '../components/ShareQuizModal';
import StarButton from '../components/StarButton';

function Results() {
  const { quizId } = useParams();
  const { quiz, loading, error } = useQuizDetail(quizId);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { registerTemporaryQuiz } = useQuizList();
  const { recordScore } = useScores();
  const { reactions, recordReaction } = useReactions();
  const { isAuthenticated } = useAuth();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [showShareModal, setShowShareModal] = useState(false);

  const currentReaction = reactions[quizId]?.userReaction || null;

  const score = useMemo(() => {
    const value = Number(searchParams.get('score') || '0');
    return Number.isNaN(value) ? 0 : value;
  }, [searchParams]);

  const wrongAnswers = useMemo(() => {
    const raw = searchParams.get('wrong') || '';
    return raw.split(',').filter(Boolean);
  }, [searchParams]);

  useEffect(() => {
    if (quizId && !Number.isNaN(score)) {
      recordScore(quizId, score);
    }
  }, [quizId, score, recordScore]);

  const handleRetryWrong = () => {
    if (!quiz || wrongAnswers.length === 0) {
      return;
    }
    const failedQuestions = quiz.questions.filter((question) => wrongAnswers.includes(question.id));
    if (failedQuestions.length === 0) {
      return;
    }
    const baseId = quiz.id.replace(/-failed$/, '');
    const tempId = `${baseId}-failed`;
    registerTemporaryQuiz({
      ...quiz,
      id: tempId,
      name: `${quiz.name} • Failed`,
      questions: failedQuestions,
    });
    navigate(`/play/${tempId}`);
  };

  if (loading) {
    return <div className="muted">Loading results...</div>;
  }

  if (error || !quiz) {
    return <div className="empty">Quiz not found.</div>;
  }

  const wrongCount = wrongAnswers.length;
  const likes = reactions[quizId]?.likes ?? quiz.likes ?? 0;
  const dislikes = reactions[quizId]?.dislikes ?? quiz.dislikes ?? 0;
  const reactionScore = likes - dislikes;
  const reactionScoreClass =
            reactionScore > 0 ? 'reaction-score-positive'
          : reactionScore < 0 ? 'reaction-score-negative'
              : 'reaction-score-neutral';
  const reactionScoreIcon = reactionScore < 0 ? '👎' : '👍';

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 100px)', gap: '16px', paddingBottom: '80px' }}>
      <h2 className="section-title">Your score</h2>

      <div className="card stack" style={{ flex: '0 0 auto' }}>
        <div className="quiz-card__header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 className="quiz-card__title" style={{ fontSize: '20px', margin: 0 }}>{quiz.name}</h2>
            <span className="quiz-card__author">by {quiz.author}</span>
            <span style={{ fontSize: '40px', fontWeight: 700, marginTop: '6px' }}>{score}%</span>
            <div className="muted" style={{ marginTop: '6px' }}>
              {quiz.questions.length} questions
            </div>
            <div className="muted" style={{ fontSize: '14px' }}>
              {wrongCount ? `Missed: ${wrongCount}` : 'Perfect run!'}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            {isAuthenticated && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <StarButton
                  active={favoriteIds.has(quiz.id)}
                  onToggle={handleFavoriteToggle}
                  size={44}
                  title={favoriteIds.has(quiz.id) ? 'Remove from favorites' : 'Save to favorites'}
                />
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowShareModal(true)}
                  aria-label="Share quiz"
                  style={{ width: '44px', height: '44px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <IoMdShare size={24} />
                </button>
              </div>
            )}
            <div className="reaction-buttons" style={{ alignSelf: 'flex-end' }}>
              <button className={"reaction-btn reaction-btn-like" + (currentReaction === "like" ? " active" : "")}
                      onClick={() => {const newValue = currentReaction === 'like' ? null : 'like';
                                            recordReaction(quizId, newValue, currentReaction);}}>👍</button>
              <button className={"reaction-btn reaction-btn-dislike" + (currentReaction === "dislike" ? " active" : "")}
                      onClick={() => {const newValue = currentReaction === 'dislike' ? null : 'dislike';
                                            recordReaction(quizId, newValue, currentReaction);}}>👎</button>
            </div>
            <div className="quiz-card__reaction" style={{ marginTop: '6px', fontSize: '20px' }}>
              <span className={`quiz-card__reaction-number ${reactionScoreClass}`}>{reactionScore}</span>
              <span className="quiz-card__reaction-icon">{reactionScoreIcon}</span>
            </div>
          </div>
        </div>


        

        <div className="quiz-card__footer" style={{ alignItems: 'flex-end', marginTop: '6px' }}>
          <div className="quiz-card__footer-left" aria-hidden="true" />
          <div className="quiz-card__footer-right">
            <span className="quiz-card__tag">{quiz.tags?.[0] || 'general'}</span>
            <span className="quiz-card__icon">{quiz.icon || '📝'}</span>
          </div>
        </div>
      </div>

      <div aria-hidden="true" style={{ flex: 1 }} />

      <div className="row" style={{ justifyContent: 'space-between', alignSelf: 'stretch', marginBottom: '8px' }}>
        <div className="row" style={{ gap: '8px' }}>
          <Link className="btn btn-secondary" to="/">
            🏠 Home
          </Link>
          <Link 
            className="btn btn-secondary"
            to={`/review/${quizId}?score=${score}&wrong=${wrongAnswers.join(',')}&answers=${searchParams.get('answers') || '{}'}&incorrect=${searchParams.get('incorrect') || '{}'}`}
          >
            📊 Review Answers
          </Link>
        </div>
        {wrongCount ? (
          <button id="retryWrong" className="btn primary" type="button" onClick={handleRetryWrong}>
            Retry failed
          </button>
        ) : <div />}
      </div>

      {showShareModal && (
        <ShareQuizModal 
          quiz={quiz} 
          onClose={() => setShowShareModal(false)} 
        />
      )}
    </div>
  );
}

export default Results;
