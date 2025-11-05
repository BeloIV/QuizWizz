import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import QuizCard from '../components/QuizCard';
import { useQuizList } from '../context/QuizContext';
import { useScores } from '../context/ScoresContext';
import { useSearch } from '../context/SearchContext';

function Home() {
  const navigate = useNavigate();
  const { quizzes, loading, error } = useQuizList();
  const { scores } = useScores();
  const { openSearch } = useSearch();

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

  const items = recent.length ? recent : quizzesWithScores;

  return (
    <div>
      <h2 className="section-title">Recently taken</h2>
      {loading && <div className="muted">Loading quizzes...</div>}
      {error && !loading && <div className="empty">{error}</div>}
      {!loading && !error && (
        <section className="cards" id="recent-list">
          {items.length === 0 ? (
            <div className="empty">No quizzes yet. Start with Search.</div>
          ) : (
            items.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onClick={() => navigate(`/quiz/${quiz.id}`)}
              />
            ))
          )}
        </section>
      )}
      <div className="divider" />
      <div className="row">
        <button className="btn primary" type="button" data-action="open-search" onClick={() => openSearch('')}>
          Find quizzes
        </button>
      </div>
    </div>
  );
}

export default Home;
