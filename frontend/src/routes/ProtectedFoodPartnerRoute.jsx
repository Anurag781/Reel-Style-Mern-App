import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const ProtectedFoodPartnerRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/food-partner/me/food-partner", {
        withCredentials: true
      })
      .then(() => {
        setAuthorized(true);
        setLoading(false);
      })
      .catch(() => {
        setAuthorized(false);
        setLoading(false);
      });
  }, []);

  if (loading) return <p style={{ padding: 20 }}>Checking access...</p>;
  if (!authorized) return <Navigate to="/food-partner/login" />;

  return children;
};

export default ProtectedFoodPartnerRoute;
