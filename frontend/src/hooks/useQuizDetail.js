import { useEffect, useState } from 'react';

import { useQuizList } from '../context/QuizContext';

export function useQuizDetail(quizId) {
  const { getQuiz } = useQuizList();
  const [state, setState] = useState({ quiz: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    if (!quizId) {
      setState({ quiz: null, loading: false, error: 'Missing quiz id' });
      return () => {
        cancelled = true;
      };
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    getQuiz(quizId)
      .then((quiz) => {
        if (cancelled) {
          return;
        }
        setState({ quiz, loading: false, error: null });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setState({ quiz: null, loading: false, error: error.message || 'Failed to load quiz' });
      });
    return () => {
      cancelled = true;
    };
  }, [quizId, getQuiz]);

  return state;
}
