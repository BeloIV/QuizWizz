import { Link, useParams } from 'react-router-dom';

import { useQuizDetail } from '../hooks/useQuizDetail';
import { useScores } from '../context/ScoresContext';

function QuizDetail() {
  const { quizId } = useParams();
  const { quiz, loading, error } = useQuizDetail(quizId);
  const { scores } = useScores();
  const scoreEntry = quiz ? scores[quiz.id] : null;

  if (loading) {
    return <div className="muted">Loading quiz...</div>;
  }

  if (error || !quiz) {
    return <div className="empty">Quiz not found.</div>;
  }

  return (
    <div>
      <h2 className="section-title">{quiz.name}</h2>
      <div className="card stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="pill">{quiz.tags.join(' • ')}</span>
          <span className="muted">by {quiz.author}</span>
        </div>
        <div>{quiz.questions.length} questions</div>
        {scoreEntry?.value !== undefined && (
          <div className="muted">Last score: {scoreEntry.value}%</div>
        )}
        <div className="row">
          <Link className="btn cta" to={`/play/${quiz.id}`}>
            Start
          </Link>
          <Link className="btn" to="/">
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}

export default QuizDetail;
