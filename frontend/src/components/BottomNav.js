import { NavLink } from 'react-router-dom';
import { IoMdHome, IoMdShare, IoMdMail, IoMdListBox, IoMdStar } from 'react-icons/io';

function BottomNav() {
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
      <NavLink to="/shared-quizzes" className="bottom-nav__item">
        <IoMdShare size={22} />
        <span>Shared</span>
      </NavLink>
      <NavLink to="/messages" className="bottom-nav__item">
        <IoMdMail size={22} />
        <span>Messages</span>
      </NavLink>
      <NavLink to="/favorites" className="bottom-nav__item">
        <IoMdStar size={22} />
        <span>Favorites</span>
      </NavLink>
    </nav>
  );
}

export default BottomNav;
