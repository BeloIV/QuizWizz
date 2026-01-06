import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import QuizCard from '../components/QuizCard';
import { useQuizList } from '../context/QuizContext';
import { useAuth } from '../context/AuthContext';

function CreatedQuizzes() {
  const { quizzes, loading, error } = useQuizList();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const myQuizzes = useMemo(() => {
    if (!isAuthenticated || !user) return [];
    return quizzes.filter((q) => (q.author || '').toLowerCase() === (user.username || '').toLowerCase());
  }, [isAuthenticated, user, quizzes]);

  if (!isAuthenticated) {
    return <div className="empty">Please log in to see your created quizzes.</div>;
  }

  if (loading) {
    return <div className="muted">Loading your quizzes…</div>;
  }

  if (error) {
    return <div className="empty">{error}</div>;
  }

  if (!myQuizzes.length) {
    return (
      <div className="empty">
        You have no created quizzes yet.
        <div style={{ marginTop: '12px' }}>
          <button className="btn primary" onClick={() => navigate('/create')}>
            + Create your first quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: '12px' }}>
      <h2 className="section-title">My quizzes</h2>
      <div className="grid" style={{ gap: '12px' }}>
        {myQuizzes.map((quiz) => (
          <QuizCard key={quiz.id} quiz={quiz} onClick={() => navigate(`/quiz/${quiz.id}`)} />
        ))}
      </div>
    </div>
  );
}

export default CreatedQuizzes;
