import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext({
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: async () => {},
  loading: false,
  error: null,
});

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  // Fetch favorites when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [isAuthenticated]);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/quizzes/favorites/`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to load favorites (${response.status})`);
      }
      const data = await response.json();
      // Extract quiz IDs from the favorites list
      setFavorites(data.map((fav) => fav.id || fav));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch favorites', err);
      setError(err.message || 'Unable to load favorites');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const isFavorite = useCallback((quizId) => {
    return favorites.includes(quizId);
  }, [favorites]);

  const toggleFavorite = useCallback(
    async (quizId) => {
      if (!isAuthenticated) {
        return;
      }

      try {
        const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
        
        const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/favorite/`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to toggle favorite (${response.status})`);
        }

        const data = await response.json();
        
        // Update local favorites list
        if (data.is_favorite) {
          setFavorites((prev) => [...new Set([...prev, quizId])]);
        } else {
          setFavorites((prev) => prev.filter((id) => id !== quizId));
        }

        return data.is_favorite;
      } catch (err) {
        console.error('Failed to toggle favorite', err);
        setError(err.message || 'Unable to toggle favorite');
        throw err;
      }
    },
    [isAuthenticated]
  );

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite, loading, error }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
