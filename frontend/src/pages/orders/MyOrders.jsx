import React, { useEffect, useState } from "react"
import axios from "axios"
import "../../styles/orders.css"
import OrderReelModal from '../orders/OrderReelModal'
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const MyOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [reorderingId, setReorderingId] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = () => {
    axios
      .get("http://localhost:3000/api/orders/my", { withCredentials: true })
      .then((res) => {
        setOrders(res.data.orders)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const handleReorder = async (order) => {
    setReorderingId(order._id);
    try {
      const response = await axios.post(
        `http://localhost:3000/api/orders/reorder`,
        { orderId: order._id },
        { withCredentials: true }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success(`Reordered ${order.food?.name || 'item'} successfully!`)
        fetchOrders()
      } else {
        toast.error(response.data?.message || "❌ Failed to reorder.")
      }
    } catch (err) {
      const message = err?.response?.data?.message || err.message
      toast.error(`❌ ${message}`)
    } finally {
      setReorderingId(null)
    }
  }

  const statusClass = (s) => {
    const status = s?.toLowerCase() || ''
    if (status === 'completed') return 'status-completed'
    if (status === 'cancelled') return 'status-cancelled'
    return 'status-pending'
  }

  const formatStatus = (s) => s ? s.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) : ''

  const formatPrice = (num) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR', 
      maximumFractionDigits: 0 
    }).format(num)
  }

  if (loading) return (
    <div className="orders-container">
      <div className="loader-ring"><div></div><div></div></div>
    </div>
  )

  return (
    <div className="orders-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <header className="orders-header">
        <div>
          <h1>Order History</h1>
          <p className="order-count">You have placed {orders.length} orders</p>
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="empty-state-container">
          <div className="empty-icon">🛍️</div>
          <h3>No orders yet</h3>
          <p>Your delicious journey hasn't started yet.</p>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order._id} className="modern-order-card">
              <div className="card-media" onClick={() => setSelectedOrder(order)}>
                {order.food?.video ? (
                  <video src={order.food.video} muted playsInline onMouseOver={e => e.target.play()} onMouseOut={e => {e.target.pause(); e.target.currentTime = 0;}} />
                ) : (
                  <div className="initials-placeholder">
                    {(order.food?.name || 'F').split(' ').slice(0,2).map(w=>w[0]).join('')}
                  </div>
                )}
                <div className="media-overlay"><span>Play Reel</span></div>
              </div>

              <div className="card-body">
                <div className="card-header-row">
                  <div>
                    <h3 className="item-name">{order.food?.name}</h3>
                    <p className="partner-name">{order.foodPartner?.name}</p>
                  </div>
                  <div className={`status-pill ${statusClass(order.status)}`}>
                    {formatStatus(order.status)}
                  </div>
                </div>

                <div className="card-info-grid">
                  <div className="info-item">
                    <span className="info-label">Quantity</span>
                    <span className="info-value">{order.quantity} Units</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Total</span>
                    <span className="info-value price">{formatPrice(order.totalPrice)}</span>
                  </div>
                </div>

                <div className="card-footer">
                  <span className="timestamp">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="card-actions">
                    <button 
                      className="text-btn" 
                      disabled={reorderingId === order._id}
                      onClick={() => handleReorder(order)}
                    >
                      {reorderingId === order._id ? 'Ordering...' : 'Reorder'}
                    </button>
                    <button className="view-btn" onClick={() => setSelectedOrder(order)}>View</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <OrderReelModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onReorder={handleReorder}
        />
      )}
    </div>
  )
}

export default MyOrders
