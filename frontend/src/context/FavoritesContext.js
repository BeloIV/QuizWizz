import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

import { API_BASE_URL } from '../config';
import { useAuth } from './AuthContext';

axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [favoriteQuizzes, setFavoriteQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoriteQuizzes([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/favorites/`);
      const quizzes = (response.data || []).map((fav) => fav.quiz).filter(Boolean);
      setFavoriteQuizzes(quizzes);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch favorites', err);
      setError(err.response?.data?.detail || 'Unable to load favorites');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        fetchFavorites();
      } else {
        setFavoriteQuizzes([]);
      }
    }
  }, [authLoading, isAuthenticated, fetchFavorites]);

  const favoriteIds = useMemo(() => new Set(favoriteQuizzes.map((quiz) => quiz.id)), [favoriteQuizzes]);

  const addFavorite = useCallback(
    async (quizId) => {
      if (!quizId) return;
      await axios.post(`${API_BASE_URL}/favorites/`, { quiz_id: quizId });
      await fetchFavorites();
    },
    [fetchFavorites]
  );

  const removeFavorite = useCallback(
    async (quizId) => {
      if (!quizId) return;
      await axios.delete(`${API_BASE_URL}/favorites/${quizId}/`);
      await fetchFavorites();
    },
    [fetchFavorites]
  );

  const toggleFavorite = useCallback(
    async (quiz) => {
      if (!quiz?.id) return;
      if (!isAuthenticated) {
        throw new Error('Login required to favorite quizzes');
      }

      if (favoriteIds.has(quiz.id)) {
        await removeFavorite(quiz.id);
      } else {
        await addFavorite(quiz.id);
      }
    },
    [addFavorite, favoriteIds, isAuthenticated, removeFavorite]
  );

  const isFavorite = useCallback((quizId) => favoriteIds.has(quizId), [favoriteIds]);

  const value = useMemo(
    () => ({
      favorites: favoriteQuizzes,
      favoriteIds,
      loading,
      error,
      isFavorite,
      toggleFavorite,
      refresh: fetchFavorites,
    }),
    [favoriteQuizzes, favoriteIds, loading, error, isFavorite, toggleFavorite, fetchFavorites]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return ctx;
}
