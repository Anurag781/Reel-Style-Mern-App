import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io as socketIOClient } from "socket.io-client";
import '../../styles/FoodPartner-order.css'

const FoodPartnerOrders = ({ partnerId }) => {
  const [orders, setOrders] = useState([]);
  const socketRef = useRef(null);

const customerName = (user) => {
  if (!user) return "Guest User";

  // Prefer canonical fullName if available
  if (user.fullName?.trim()) return user.fullName.trim();

  const first = user.firstName?.trim();
  const last = user.lastName?.trim();
  const full = [first, last].filter(Boolean).join(" ");

  // If full name exists, return it
  if (full) return full;

  // If user.name is provided and not empty
  if (user.name?.trim()) return user.name.trim();

  // Only use email if really nothing else
  if (user.email) return user.email.split("@")[0];

  return "Guest User";
};


  useEffect(() => {
    fetchOrders();

    if (partnerId) {
      try {
        socketRef.current = socketIOClient("http://localhost:3000", { withCredentials: true });
        socketRef.current.emit('join', `partner:${partnerId}`);

        socketRef.current.on('newOrder', () => {
          // re-fetch to ensure user is populated
          fetchOrders();
        });

        socketRef.current.on('orderUpdated', () => {
          // re-fetch to ensure updated order has populated fields
          fetchOrders();
        });
      } catch (err) {
        console.error('Socket connect error:', err);
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [partnerId]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/orders/partner/orders", { withCredentials: true });
      setOrders(res.data.orders);
    } catch (err) {
      console.error("Failed to load partner orders:", err.response ? err.response.data : err.message);
      setOrders([]);
    }
  };

async function respond(orderId, status) {
    try {
      const res = await axios.patch(
        `http://localhost:3000/api/orders/${orderId}/respond`,
        { status },
        { withCredentials: true }
      );
      
      // FIX: Merge previous order data (food info) with updated status
      setOrders(prev => prev.map(o => 
        o._id === orderId ? { ...o, ...res.data.order } : o
      ));
    } catch (err) {
      console.error('Failed to respond to order:', err?.response?.data || err.message);
    }
  }

  async function updateStatus(orderId, status) {
    try {
      const res = await axios.patch(
        `http://localhost:3000/api/orders/${orderId}/status`,
        { status },
        { withCredentials: true }
      );
      
      // FIX: Merge previous order data (food info) with updated status
      setOrders(prev => prev.map(o => 
        o._id === orderId ? { ...o, ...res.data.order } : o
      ));
    } catch (err) {
      console.error('Failed to update status:', err?.response?.data || err.message);
    }
  }

  const formatCurrency = (value) => {
    if (value == null) return '₹0';
    return `₹${Number(value).toLocaleString('en-IN')}`;
  };

  const friendlyStatus = (s) => s ? s.replace(/_/g, ' ') : '—';

  return (
    <div className="partner-orders-container">
      <header className="page-header">
        <div>
          <h2 className="page-title">Live Orders</h2>
          <p className="page-subtitle">Manage and track your incoming food requests</p>
        </div>
        <div className="live-indicator">
          <span className="pulse-dot"></span> Live
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🍽️</div>
          <p>No orders currently in queue.</p>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map(order => (
            <article key={order._id} className={`order-card card-status-${order.status}`} aria-live="polite">
              <div className="order-card-inner">
                <header className="order-card-header">
                  <div className="food-info">
                    <span className="order-id-tag">#{order._id.slice(-6).toUpperCase()}</span>
                    <h3 className="food-name">{order.food?.name || 'Unknown Item'}</h3>
                  </div>
                  <div className={`status-badge status-${order.status}`}>
                    {friendlyStatus(order.status)}
                  </div>
                </header>

                <div className="order-body">
                  <div className="detail-item">
                    <label>Customer</label>
                    <span>{customerName(order.user)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Total Value</label>
                    <span className="price-text">{formatCurrency(order.totalPrice)}</span>
                  </div>
                  {order.user?.phone && (
                    <div className="detail-item">
                      <label>Contact</label>
                      <span>{order.user.phone}</span>
                    </div>
                  )}
                  <div className="detail-item full-width">
                    <label>Placed At</label>
                    <span className="timestamp">{new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <footer className="order-actions">
                  {order.status === "pending" ? (
                    <div className="action-group">
                      <button className="btn btn-accept" onClick={() => respond(order._id, "accepted")}>Accept Order</button>
                      <button className="btn btn-reject" onClick={() => respond(order._id, "rejected")}>Decline</button>
                    </div>
                  ) : order.status === "confirmed" ? (
                    <button className="btn btn-primary full-btn" onClick={() => updateStatus(order._id, "preparing")}>Start Preparation</button>
                  ) : order.status === "preparing" ? (
                    <button className="btn btn-primary full-btn" onClick={() => updateStatus(order._id, "out_for_delivery")}>Dispatch Order</button>
                  ) : order.status === "out_for_delivery" ? (
                    <button className="btn btn-success full-btn" onClick={() => updateStatus(order._id, "completed")}>Confirm Delivery</button>
                  ) : (
                    <div className="order-note-finished">Order processed successfully</div>
                  )}
                </footer>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodPartnerOrders;