import { useState, useEffect } from "react";
import axios from "axios";
import CreateFood from "./CreateFood";
import FoodPartnerOrders from "./FoodPartnerOrders";
import "../../styles/food-partner-dashboard.css";
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useNavigate } from "react-router-dom";

const FoodPartnerDashboard = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("orders");
  const [partner, setPartner] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false); // Added for mobile responsiveness

  useEffect(() => {
    let mounted = true;
    axios
      .get("http://localhost:3000/api/food-partner/me/food-partner", { withCredentials: true })
      .then((res) => {
        if (mounted) setPartner(res.data.foodPartner || null);
      })
      .catch(() => {
        if (mounted) setPartner(null);
      });
    return () => { mounted = false; };
  }, []);

  const initials = (name) => {
    if (!name) return "FP";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  }

  const handleLogout = async () => {
    try {
      await axios.get(
        "http://localhost:3000/api/auth/food-partner/logout",
        { withCredentials: true }
      );
      toast.success("Logged out successfully!", {
        onClose: () => navigate("/food-partner/login")
      });
    } catch (err) {
      console.error("Logout failed:", err);
      toast.error("Logout failed!");
    }
  };

  return (
    <div className="fp-container">
      {/* Mobile Header Toggle */}
      <div className="mobile-top-bar">
        <div className="sidebar-header">
          <div className="brand-dot"></div>
          <span className="brand-name">Partner</span>
        </div>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      <aside className={`fp-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-header desktop-only">
          <div className="brand-dot"></div>
          <span className="brand-name">Partner</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => { setActiveTab("orders"); setMenuOpen(false); }}
          >
            Orders
          </button>
          <button
            className={`nav-btn ${activeTab === "create" ? "active" : ""}`}
            onClick={() => { setActiveTab("create"); setMenuOpen(false); }}
          >
            Menu
          </button>
        </nav>

        <div className="sidebar-profile">
          <div className="avatar">{initials(partner?.name || partner?.contactName)}</div>
          <div className="profile-info">
            <p className="p-name">{partner?.name || "Your Kitchen"}</p>
            <p className="p-status">{partner ? partner.phone : "—"}</p>
          </div>
        </div>
        <button className="fp-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="fp-viewport">
        <header className="content-header">
          <div className="header-meta">
            <h1>{activeTab === "orders" ? "Current Orders" : "Add New Item"}</h1>
            <div className="breadcrumb">Dashboard / {activeTab}</div>
          </div>

          <div className="header-stats">
            <div className="h-stat">
              <span className="h-label">Total Meals</span>
              <span className="h-value">{partner?.totalMeals ?? '—'}</span>
            </div>
            <div className="h-divider"></div>
            <div className="h-stat">
              <span className="h-label">Served</span>
              <span className="h-value">{partner?.customersServed ?? '—'}</span>
            </div>
          </div>
        </header>

        <div className="main-stage">
          {activeTab === "orders" && <FoodPartnerOrders partnerId={partner?._id} />}
          {activeTab === "create" && <CreateFood />}
        </div>
      </main>
    </div>
  );
};

export default FoodPartnerDashboard;