import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { API_BASE_URL } from '../config';

const QuizContext = createContext({
  quizzes: [],
  loading: true,
  error: null,
  refresh: async () => {},
  getQuiz: async () => undefined,
  registerTemporaryQuiz: () => {},
  createQuiz: async () => {},
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

  const createQuiz = useCallback(
    async (quizData) => {
      // Get CSRF token from cookie
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
      
      const response = await fetch(`${API_BASE_URL}/quizzes/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        body: JSON.stringify(quizData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Quiz creation error:', errorData);

        // Robustly format nested Django errors
        const formatErr = (val) => {
          if (val == null) return '';
          if (Array.isArray(val)) return val.map(formatErr).join(', ');
          if (typeof val === 'object') return Object.entries(val).map(([k, v]) => `${k}: ${formatErr(v)}`).join('; ');
          return String(val);
        };

        if (errorData && typeof errorData === 'object') {
          const messages = Object.entries(errorData)
            .map(([field, errors]) => `${field}: ${formatErr(errors)}`)
            .join('\n');
          throw new Error(messages || `Failed to create quiz (${response.status})`);
        }

        throw new Error(errorData?.detail || `Failed to create quiz (${response.status})`);
      }

      const data = await response.json();
      setQuizzes((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return data;
    },
    []
  );

  const updateQuiz = useCallback(
    async (quizId, quizData) => {
      // Get CSRF token from cookie
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
      
      const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        body: JSON.stringify(quizData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Quiz update error:', errorData);
        
        if (errorData && typeof errorData === 'object') {
          const messages = Object.entries(errorData)
            .map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`;
              }
              return `${field}: ${errors}`;
            })
            .join('\n');
          throw new Error(messages || `Failed to update quiz (${response.status})`);
        }
        
        throw new Error(errorData.detail || `Failed to update quiz (${response.status})`);
      }

      const data = await response.json();
      setQuizzes((prev) => prev.map(q => q.id === quizId ? data : q).sort((a, b) => a.name.localeCompare(b.name)));
      setQuizDetails((prev) => ({ ...prev, [quizId]: data }));
      return data;
    },
    []
  );

  const deleteQuiz = useCallback(
    async (quizId) => {
      // Get CSRF token from cookie
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
      
      const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Quiz deletion error:', errorData);
        throw new Error(errorData.detail || `Failed to delete quiz (${response.status})`);
      }

      setQuizzes((prev) => prev.filter(q => q.id !== quizId));
      setQuizDetails((prev) => {
        const newDetails = { ...prev };
        delete newDetails[quizId];
        return newDetails;
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      quizzes,
      loading,
      error,
      refresh: fetchQuizzes,
      getQuiz,
      registerTemporaryQuiz,
      createQuiz,
      updateQuiz,
      deleteQuiz,
    }),
    [quizzes, loading, error, fetchQuizzes, getQuiz, registerTemporaryQuiz, createQuiz, updateQuiz, deleteQuiz]
  );

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuizList() {
  return useContext(QuizContext);
}

