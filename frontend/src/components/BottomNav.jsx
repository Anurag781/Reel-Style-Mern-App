import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "../styles/bottom-nav.css";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleHomeClick = (e) => {
    // If already on /home, scroll to top
    if (location.pathname === "/home") {
      e.preventDefault();
      const feed = document.querySelector(".reels-feed");
      if (feed) {
        feed.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      // Not on /home — navigate there
      e.preventDefault();
      navigate("/home");
    }
  };

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Bottom">
      <div className="bottom-nav__inner">

        <NavLink
          to="/home"
          onClick={handleHomeClick}
          className={({ isActive }) =>
            `bottom-nav__item ${isActive ? "is-active" : ""}`
          }
        >
          <span className="bottom-nav__icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" />
            </svg>
          </span>
          <span className="bottom-nav__label">Home</span>
        </NavLink>

        <NavLink
          to="/my-orders"
          className={({ isActive }) =>
            `bottom-nav__item ${isActive ? "is-active" : ""}`
          }
        >
          <span className="bottom-nav__icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 16V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8" />
              <path d="M7 10h10" />
            </svg>
          </span>
          <span className="bottom-nav__label">My Orders</span>
        </NavLink>

        <NavLink
          to="/saved"
          className={({ isActive }) =>
            `bottom-nav__item ${isActive ? "is-active" : ""}`
          }
        >
          <span className="bottom-nav__icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
            </svg>
          </span>
          <span className="bottom-nav__label">Saved</span>
        </NavLink>

      </div>
    </nav>
  );
};

export default BottomNav;
