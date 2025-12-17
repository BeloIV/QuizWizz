import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { useQuizDetail } from '../hooks/useQuizDetail';
import { useQuizList } from '../context/QuizContext';
import { useScores } from '../context/ScoresContext';
import { useReactions } from '../context/ReactionsContext';
import { useAuth } from '../context/AuthContext';
import ShareQuizModal from '../components/ShareQuizModal';

function Results() {
  const { quizId } = useParams();
  const { quiz, loading, error } = useQuizDetail(quizId);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { registerTemporaryQuiz } = useQuizList();
  const { recordScore } = useScores();
  const { reactions, recordReaction } = useReactions();
  const { isAuthenticated } = useAuth();
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

  return (
    <div>
      <h2 className="section-title">Your score</h2>
      <div className="card stack">
        <div className="row" style={{justifyContent: 'space-between'}}>
          <div style={{fontSize: '40px', fontWeight: 700}}>{score}%</div>

          <div className="reaction">
            <div className="reaction-label">Did you like this quiz?</div>

            <div className="reaction-buttons">
              <button className={"reaction-btn reaction-btn-like" + (currentReaction === "like" ? " active" : "")}
                      onClick={() => {const newValue = currentReaction === 'like' ? null : 'like';
                                            recordReaction(quizId, newValue, currentReaction);}}>👍</button>
              <button className={"reaction-btn reaction-btn-dislike" + (currentReaction === "dislike" ? " active" : "")}
                      onClick={() => {const newValue = currentReaction === 'dislike' ? null : 'dislike';
                                            recordReaction(quizId, newValue, currentReaction);}}>👎</button>
            </div>
          </div>

        </div>
        <div className="muted">
          {quiz.name} • {quiz.questions.length} questions
        </div>
        {wrongCount ? (
            <div className="muted">Missed: {wrongCount}</div>
        ) : (
            <div className="muted">Perfect run!</div>
        )}
        <div className="row">
          <Link className="btn btn-secondary" to="/">
            Home
          </Link>
          <Link 
            className="btn btn-secondary"
            to={`/review/${quizId}?score=${score}&wrong=${wrongAnswers.join(',')}&answers=${searchParams.get('answers') || '{}'}&incorrect=${searchParams.get('incorrect') || '{}'}`}
          >
            Review Answers
          </Link>
          {isAuthenticated && (
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowShareModal(true)}
            >
              Share Quiz
            </button>
          )}
          {wrongCount ? (
              <button id="retryWrong" className="btn success" type="button" onClick={handleRetryWrong}>
                Retry failed
            </button>
          ) : null}
        </div>
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
