import React from 'react';
import '../../styles/auth-shared.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // Import toast

const UserLogin = () => {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    // 1. Basic Validation for Email and Password
    if (!email || !password) {
      return toast.error("Please fill in all fields");
    }

    // 2. Check for missing @ or invalid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.includes('@') || !emailRegex.test(email)) {
      return toast.error("Please enter a valid email address (e.g., name@example.com)");
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/api/auth/user/login",
        { email, password },
        { withCredentials: true }
      );

      console.log(response.data);
      toast.success("Login successful!");
      navigate("/home"); 
      
    } catch (error) {
      // 3. Handle Bad Requests (400, 401, etc.)
      if (error.response) {
        // Specifically check for unauthorized or bad request
        toast.error(error.response.data.message || "Invalid credentials. Please try again.");
      } else {
        toast.error("Network error. Please try again later.");
      }
      console.error("Login Error:", error);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card" role="region" aria-labelledby="user-login-title">
        <header>
          <h1 id="user-login-title" className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to continue your food journey.</p>
        </header>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="you@example.com" 
              autoComplete="email" 
              required
            />
          </div>
          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              autoComplete="current-password" 
              required
            />
          </div>
          <button className="auth-submit" type="submit">Sign In</button>
        </form>
        <div className="auth-alt-action">
          New here? <a href="/user/register">Create account</a>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;