import Header from './Header';

function Layout({ children }) {
  return (
    <>
      <header className="app-header">
        <Header />
      </header>
      <main id="app" className="app-main" aria-live="polite">
        {children}
      </main>
    </>
  );
}

export default Layout;
