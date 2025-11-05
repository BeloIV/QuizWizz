import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const SCORE_KEY = 'quizwizz:scores';

const ScoresContext = createContext({
  scores: {},
  recordScore: () => {},
});

function readInitialScores() {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const raw = localStorage.getItem(SCORE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    // Normalize to ensure consistent shape.
    return Object.fromEntries(
      Object.entries(parsed).map(([quizId, value]) => {
        if (typeof value === 'object' && value !== null) {
          return [quizId, value];
        }
        return [quizId, { value, takenAt: Date.now() }];
      })
    );
  } catch (error) {
    console.warn('Failed to parse stored scores', error);
    return {};
  }
}

export function ScoresProvider({ children }) {
  const [scores, setScores] = useState(readInitialScores);

  useEffect(() => {
    try {
      localStorage.setItem(SCORE_KEY, JSON.stringify(scores));
    } catch (error) {
      console.warn('Failed to persist scores', error);
    }
  }, [scores]);

  const recordScore = useCallback((quizId, scoreValue) => {
    setScores((prev) => ({
      ...prev,
      [quizId]: { value: scoreValue, takenAt: Date.now() },
    }));
  }, []);

  const value = useMemo(() => ({ scores, recordScore }), [scores, recordScore]);

  return <ScoresContext.Provider value={value}>{children}</ScoresContext.Provider>;
}

export function useScores() {
  return useContext(ScoresContext);
}
