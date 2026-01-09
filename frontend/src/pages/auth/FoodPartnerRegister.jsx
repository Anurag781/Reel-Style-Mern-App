import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/auth-shared.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // Import toast

const FoodPartnerRegister = () => {
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => { // Changed to async
    e.preventDefault();

    const businessName = e.target.businessName.value.trim();
    const contactName = e.target.contactName.value.trim();
    const phone = e.target.phone.value.trim();
    const email = e.target.email.value.trim();
    const password = e.target.password.value;
    const address = e.target.address.value.trim();

    // 1. Frontend Validation
    if (!businessName || !contactName || !phone || !email || !password || !address) {
      return toast.error("Please fill in all fields");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.includes('@') || !emailRegex.test(email)) {
      return toast.error("Please enter a valid business email");
    }

    try {
      // 2. Request Logic (Structure remains identical)
      const response = await axios.post("http://localhost:3000/api/auth/food-partner/register", {
        name: businessName,
        contactName,
        phone,
        email,
        password,
        address
      }, { withCredentials: true });

      console.log(response.data);
      toast.success("Partner registration successful!");
      navigate("/food-partner/login"); 

    } catch (error) {
      // 3. Duplicate Email / Error Handling
      if (error.response) {
        // Specifically catches the "Email already registered" error from backend
        toast.error(error.response.data.message || "Registration failed. This email may be in use.");
      } else {
        toast.error("Network error. Please try again.");
      }
      console.error("Partner Registration Error:", error);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card" role="region" aria-labelledby="partner-register-title">
        <header>
          <h1 id="partner-register-title" className="auth-title">Partner sign up</h1>
          <p className="auth-subtitle">Grow your business with our platform.</p>
        </header>
        <nav className="auth-alt-action" style={{marginTop: '-4px'}}>
          <strong style={{fontWeight:600}}>Switch:</strong> <Link to="/user/register">User</Link> • <Link to="/food-partner/register">Food partner</Link>
        </nav>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="businessName">Business Name</label>
            <input id="businessName" name="businessName" placeholder="Tasty Bites" autoComplete="organization" />
          </div>
          <div className="two-col">
            <div className="field-group">
              <label htmlFor="contactName">Contact Name</label>
              <input id="contactName" name="contactName" placeholder="Jane Doe" autoComplete="name" />
            </div>
            <div className="field-group">
              <label htmlFor="phone">Phone</label>
              <input id="phone" name="phone" placeholder="+1 555 123 4567" autoComplete="tel" />
            </div>
          </div>
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="business@example.com" autoComplete="email" />
          </div>
          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" placeholder="Create password" autoComplete="new-password" />
          </div>
          <div className="field-group">
            <label htmlFor="address">Address</label>
            <input id="address" name="address" placeholder="123 Market Street" autoComplete="street-address" />
            <p className="small-note">Full address helps customers find you faster.</p>
          </div>
          <button className="auth-submit" type="submit">Create Partner Account</button>
        </form>
        <div className="auth-alt-action">
          Already a partner? <Link to="/food-partner/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default FoodPartnerRegister;