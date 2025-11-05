import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const SearchContext = createContext({
  open: false,
  preset: '',
  openSearch: () => {},
  closeSearch: () => {},
});

export function SearchProvider({ children }) {
  const [state, setState] = useState({ open: false, preset: '' });

  const openSearch = useCallback((preset = '') => {
    setState({ open: true, preset });
  }, []);

  const closeSearch = useCallback(() => {
    setState({ open: false, preset: '' });
  }, []);

  const value = useMemo(
    () => ({
      open: state.open,
      preset: state.preset,
      openSearch,
      closeSearch,
    }),
    [state, openSearch, closeSearch]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  return useContext(SearchContext);
}
