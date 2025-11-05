import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { API_BASE_URL } from '../config';

const QuizContext = createContext({
  quizzes: [],
  loading: true,
  error: null,
  refresh: async () => {},
  getQuiz: async () => undefined,
  registerTemporaryQuiz: () => {},
});

export function QuizProvider({ children }) {
  const [quizzes, setQuizzes] = useState([]);
  const [quizDetails, setQuizDetails] = useState({});
  const [tempQuizzes, setTempQuizzes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/quizzes/`);
      if (!response.ok) {
        throw new Error(`Failed to load quizzes (${response.status})`);
      }
      const data = await response.json();
      data.sort((a, b) => a.name.localeCompare(b.name));
      setQuizzes(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch quizzes', err);
      setError(err.message || 'Unable to load quizzes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const getQuiz = useCallback(
    async (quizId) => {
      if (!quizId) {
        throw new Error('Quiz id is required');
      }
      if (tempQuizzes[quizId]) {
        return tempQuizzes[quizId];
      }
      if (quizDetails[quizId]) {
        return quizDetails[quizId];
      }
      const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/`);
      if (!response.ok) {
        throw new Error(`Quiz not found (${response.status})`);
      }
      const data = await response.json();
      setQuizDetails((prev) => ({ ...prev, [quizId]: data }));
      return data;
    },
    [quizDetails, tempQuizzes]
  );

  const registerTemporaryQuiz = useCallback((quiz) => {
    if (!quiz?.id) {
      return;
    }
    setTempQuizzes((prev) => ({ ...prev, [quiz.id]: quiz }));
  }, []);

  const value = useMemo(
    () => ({
      quizzes,
      loading,
      error,
      refresh: fetchQuizzes,
      getQuiz,
      registerTemporaryQuiz,
    }),
    [quizzes, loading, error, fetchQuizzes, getQuiz, registerTemporaryQuiz]
  );

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuizList() {
  return useContext(QuizContext);
}
