import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import QuizCard from '../components/QuizCard';
import { useQuizList } from '../context/QuizContext';
import { useScores } from '../context/ScoresContext';

function Home() {
  const navigate = useNavigate();
  const { quizzes, loading, error } = useQuizList();
  const { scores } = useScores();

  const quizzesWithScores = useMemo(() => {
    return quizzes.map((quiz) => {
      const scoreEntry = scores[quiz.id];
      return {
        ...quiz,
        lastScore: scoreEntry?.value,
        _takenAt: scoreEntry?.takenAt || 0,
      };
    });
  }, [quizzes, scores]);

  const recent = useMemo(() => {
    return quizzesWithScores
      .filter((quiz) => quiz._takenAt)
      .sort((a, b) => b._takenAt - a._takenAt);
  }, [quizzesWithScores]);

  const recentToDisplay = useMemo(() => {
    return recent.slice(0, 3);
  }, [recent]);

  const recentIds = useMemo(() => {
    return new Set(recentToDisplay.map((quiz) => quiz.id));
  }, [recentToDisplay]);

  const remaining = useMemo(() => {
    return quizzesWithScores.filter((quiz) => !recentIds.has(quiz.id));
  }, [quizzesWithScores, recentIds]);

  return (
    <div>
      {loading && <div className="muted">Loading quizzes...</div>}
      {error && !loading && <div className="empty">{error}</div>}
      {!loading && !error && (
        <>
          {recentToDisplay.length > 0 && (
            <>
              <h2 className="section-title">Recent</h2>
              <section className="cards" id="recent-list">
                {recentToDisplay.map((quiz) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    onClick={() => navigate(`/quiz/${quiz.id}`)}
                  />
                ))}
              </section>
            </>
          )}

          <h2 className="section-title">All</h2>
          <section className="cards" id="all-list">
            {quizzesWithScores.length === 0 ? (
              <div className="empty">No quizzes yet. Start with Search.</div>
            ) : remaining.length === 0 ? (
              <div className="empty">All your quizzes are already in Recent.</div>
            ) : (
              remaining.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  onClick={() => navigate(`/quiz/${quiz.id}`)}
                />
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default Home;
