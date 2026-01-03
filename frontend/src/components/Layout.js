import Header from './Header';
import BottomNav from './BottomNav';

function Layout({ children }) {
  return (
    <>
      <header className="app-header">
        <Header />
      </header>
      <main id="app" className="app-main" aria-live="polite">
        {children}
      </main>
      <BottomNav />
    </>
  );
}

export default Layout;
