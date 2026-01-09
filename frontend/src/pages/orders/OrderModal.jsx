import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"  // no container here
import "../../styles/order-modal.css"

const OrderModal = ({ food, onClose }) => {
  const [qty, setQty] = useState(1)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [animateQty, setAnimateQty] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cod') // 'cod' | 'paynow'
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState(null)
  const navigate = useNavigate()

  const price = food?.price ?? 120
  const total = price * qty

  // helper to dynamically load Razorpay Checkout script
  const loadScript = (src) => new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) return resolve(true)
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => reject(new Error('Failed to load script ' + src))
    document.body.appendChild(script)
  })

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => (document.body.style.overflow = "auto")
  }, [])

  const animateCount = () => {
    setAnimateQty(true)
    setTimeout(() => setAnimateQty(false), 200)
  }

  const increase = () => {
    setQty((q) => q + 1)
    animateCount()
  }

  const decrease = () => {
    if (qty > 1) {
      setQty((q) => q - 1)
      animateCount()
    }
  }

  const placeOrder = async () => {
    if (isPlacingOrder) return

    try {
      setIsPlacingOrder(true)

      // Pay Now flow: create local order first, then create Razorpay order and open checkout
      if (paymentMethod === 'paynow') {
        setIsProcessingPayment(true)
        try {
          // 1) create local order (no payment yet)
          const createResp = await axios.post(
            "http://localhost:3000/api/orders",
            {
              foodId: food._id,
              foodPartnerId: food.foodPartner,
              quantity: qty,
              totalPrice: total
            },
            { withCredentials: true }
          )

          const createdOrder = createResp.data.order

          // 2) request a Razorpay order for the created order
          const rResp = await axios.post('http://localhost:3000/api/payments/razorpay/create-order', { orderId: createdOrder._id }, { withCredentials: true })
          const { key, orderId: razorpayOrderId, amount, currency } = rResp.data

          // 3) open Razorpay checkout
          await loadScript('https://checkout.razorpay.com/v1/checkout.js')

          const options = {
            key,
            amount,
            currency,
            order_id: razorpayOrderId,
            name: food?.name || 'Order',
            description: `Payment for order ${createdOrder._id}`,
            handler: async function (response) {
              try {
                await axios.post('http://localhost:3000/api/payments/razorpay/verify', {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: createdOrder._id
                }, { withCredentials: true })

                toast.success('Payment successful')

                onClose()
                setTimeout(() => navigate('/my-orders'), 300)
              } catch (err) {
                console.error('Verification error', err)
                toast.error('Payment verification failed')
              }
            },
            prefill: {
              name: '',
              email: ''
            },
            theme: { color: '#F37254' }
          }

          const rzp = new window.Razorpay(options)
          rzp.open()

          // keep loader active until user finishes payment handler
          return
        } catch (err) {
          console.error('Pay now flow failed', err)
          toast.error('Failed to initiate payment')
          setIsProcessingPayment(false)
          setIsPlacingOrder(false)
          return
        }
      }

      // default: cash on delivery - place order immediately
      const response = await axios.post(
        "http://localhost:3000/api/orders",
        {
          foodId: food._id,
          foodPartnerId: food.foodPartner,
          quantity: qty,
          totalPrice: total
        },
        { withCredentials: true }
      )

      console.log("Order response:", response.data)

      toast.success("Order placed successfully!")

      onClose()

      // give toast a moment to register before navigation
      setTimeout(() => navigate("/my-orders"), 300)
    } catch (error) {
      console.error("Order failed:", error)
      toast.error("Failed to place order")
    } finally {
      setIsPlacingOrder(false)
    }
  }

return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-drag-handle" /> {/* Added for visual polish */}
        
        <div className="modal-header">
          <div>
            <h2>{food?.name || "Confirm Order"}</h2>
            <p className="food-desc">{food?.description}</p>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="order-details-card">
          <div className="price-row">
            <span>Unit Price</span>
            <span className="price-val">₹{price}</span>
          </div>

          <div className="qty-section">
            <span>Quantity</span>
            <div className="qty-controls">
              <button className="qty-btn" onClick={decrease}>−</button>
              <span className={`qty-count ${animateQty ? "bounce" : ""}`}>{qty}</span>
              <button className="qty-btn" onClick={increase}>+</button>
            </div>
          </div>
        </div>

        <div className="payment-section">
          <label className="payment-row">
            <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
            <div>
              <div className="payment-label">Cash on Delivery</div>
              <div className="payment-sub">Pay when your order arrives</div>
            </div>
          </label>

          <label className="payment-row">
            <input type="radio" name="payment" value="paynow" checked={paymentMethod === 'paynow'} onChange={() => setPaymentMethod('paynow')} />
            <div>
              <div className="payment-label">Pay Now (Razorpay)</div>
              <div className="payment-sub">Pay securely with Razorpay</div>
            </div>
          </label>
        </div>

        <div className="total-section">
          <div className="total-row">
            <div className="total-label">
                <span>Total Amount</span>
                <small>Incl. taxes and charges</small>
            </div>
            <span className="total-amount">₹{total}</span>
          </div>

          <button
            className="confirm-btn"
            onClick={placeOrder}
            disabled={isPlacingOrder || isProcessingPayment}
          >
            {isProcessingPayment ? (
              <span className="loader-text">Processing Payment...</span>
            ) : isPlacingOrder ? (
              <span className="loader-text">Placing Order...</span>
            ) : (paymentMethod === 'paynow' ? 'Pay Now' : 'Confirm Order')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default OrderModal;
