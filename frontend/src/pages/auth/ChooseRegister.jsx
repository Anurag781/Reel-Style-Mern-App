import React from "react";
import { Link } from "react-router-dom";
import "../../styles/auth-shared.css";
import "../../styles/auth-shared.css";

const ChooseRegister = () => {
  return (
    <div className="auth-page-wrapper">
      <div
        className="auth-card"
        role="region"
        aria-labelledby="choose-register-title"
      >
        <header>
          <h1 id="choose-register-title" className="auth-title">
            Register
          </h1>
          <p className="auth-subtitle">
            Pick how you want to join the platform.
          </p>
        </header>

        {/* Register Buttons */}
        <div className="choose-register-links">
          <Link to="/user/register" className="auth-submit btn-primary">
            Register as Normal User
          </Link>

          <Link
            to="/food-partner/register"
            className="auth-submit btn-secondary"
          >
            Register as Food Partner
          </Link>
        </div>

        {/* Sign-in Section below buttons */}
        <div className="signin-section">
          <span className="already-text">Already have an account?</span>

          <div className="signin-links">
            <Link to="/user/login" className="signin-link">
              User Sign In
            </Link>
            <span className="separator">|</span>
            <Link to="/food-partner/login" className="signin-link">
              Partner Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChooseRegister;
