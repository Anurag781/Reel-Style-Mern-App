import React from 'react';
import '../../styles/auth-shared.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // Import toast

const FoodPartnerLogin = () => {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    // 1. Basic Validation
    if (!email || !password) {
      return toast.error("Please fill in all fields");
    }

    // 2. Email format validation (checks for @ and domain)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.includes('@') || !emailRegex.test(email)) {
      return toast.error("Please enter a valid business email");
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/api/auth/food-partner/login",
        { email, password },
        { withCredentials: true }
      );

      console.log(response.data);
      toast.success("Login successful!");
      navigate("/partner/dashboard"); 

    } catch (error) {
      // 3. Handle Bad Requests (400, 401, etc.)
      if (error.response) {
        // Shows "Invalid credentials" or the specific message from your backend
        toast.error(error.response.data.message || "Invalid credentials. Please try again.");
      } else {
        toast.error("Network error. Please try again later.");
      }
      console.error("Login Error:", error);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card" role="region" aria-labelledby="partner-login-title">
        <header>
          <h1 id="partner-login-title" className="auth-title">Partner login</h1>
          <p className="auth-subtitle">Access your dashboard and manage orders.</p>
        </header>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="business@example.com" 
              autoComplete="email" 
            />
          </div>
          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="Password" 
              autoComplete="current-password" 
            />
          </div>
          <button className="auth-submit" type="submit">Sign In</button>
        </form>
        <div className="auth-alt-action">
          New partner? <a href="/food-partner/register">Create an account</a>
        </div>
      </div>
    </div>
  );
};

export default FoodPartnerLogin;