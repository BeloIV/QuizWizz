import Header from './Header';
import SearchOverlay from './SearchOverlay';

function Layout({ children }) {
  return (
    <>
      <header className="app-header">
        <Header />
      </header>
      <main id="app" className="app-main" aria-live="polite">
        {children}
      </main>
      <SearchOverlay />
    </>
  );
}

export default Layout;
