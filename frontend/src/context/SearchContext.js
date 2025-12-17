import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const SearchContext = createContext({
  open: false,
  searchTerm: '',
  openSearch: () => {},
  closeSearch: () => {},
  setSearchTerm: () => {},
});

export function SearchProvider({ children }) {
  const [state, setState] = useState({ open: false, searchTerm: '' });

  const openSearch = useCallback(() => {
    setState((prev) => ({ ...prev, open: true }));
  }, []);

  const closeSearch = useCallback(() => {
    setState({ open: false, searchTerm: '' });
  }, []);

  const setSearchTerm = useCallback((term) => {
    setState((prev) => ({ ...prev, searchTerm: term }));
  }, []);

  const value = useMemo(
    () => ({
      open: state.open,
      searchTerm: state.searchTerm,
      openSearch,
      closeSearch,
      setSearchTerm,
    }),
    [state, openSearch, closeSearch, setSearchTerm]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  return useContext(SearchContext);
}
