import { NavLink, useNavigate } from 'react-router-dom';
import { IoMdHome, IoMdShare, IoMdMail, IoMdListBox, IoMdStar } from 'react-icons/io';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { useMessages } from '../context/MessagesContext';

function BottomNav() {
  const { isAuthenticated } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { unreadCount, unviewedQuizzesCount } = useMessages();
  const navigate = useNavigate();

  const handleFavoritesClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      openLoginModal();
    }
  };

  const handleSharedClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      openLoginModal();
    }
  };

  return (
    <nav className="bottom-nav" aria-label="Primary">
      <NavLink to="/" className="bottom-nav__item">
        <IoMdHome size={22} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/my-quizzes" className="bottom-nav__item">
        <IoMdListBox size={22} />
        <span>Created</span>
      </NavLink>
      <NavLink to="/shared-quizzes" className="bottom-nav__item" onClick={handleSharedClick}>
        <IoMdShare size={22} />
        <span>Shared</span>
        {unviewedQuizzesCount > 0 && (
          <span className="badge badge-bottom-nav">{unviewedQuizzesCount}</span>
        )}
      </NavLink>
      <NavLink to="/messages" className="bottom-nav__item">
        <IoMdMail size={22} />
        <span>Messages</span>
        {unreadCount > 0 && (
          <span className="badge badge-bottom-nav">{unreadCount}</span>
        )}
      </NavLink>
      <NavLink to="/favorites" className="bottom-nav__item" onClick={handleFavoritesClick}>
        <IoMdStar size={22} />
        <span>Favorites</span>
      </NavLink>
    </nav>
  );
}

export default BottomNav;
