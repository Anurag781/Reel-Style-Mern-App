import React from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Loads external script
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return resolve(true);
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load script ' + src));
    document.body.appendChild(script);
  });
}

const RazorpayCheckout = ({ order, onSuccess }) => {
  const handlePay = async () => {
    try {
      // create razorpay order on backend
      const res = await axios.post('http://localhost:3000/api/payments/razorpay/create-order', { orderId: order._id }, { withCredentials: true });
      const { key, orderId: razorpayOrderId, amount, currency } = res.data;

      // load checkout
      await loadScript('https://checkout.razorpay.com/v1/checkout.js');

      const options = {
        key,
        amount,
        currency,
        order_id: razorpayOrderId,
        name: order.food?.name || 'Order',
        description: `Payment for order ${order._id}`,
        handler: async function (response) {
          try {
            await axios.post('http://localhost:3000/api/payments/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order._id
            }, { withCredentials: true });

            toast.success('Payment successful');
            if (onSuccess) onSuccess();
          } catch (err) {
            console.error('Verification error', err);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: order.user?.fullName || '',
          email: order.user?.email || ''
        },
        theme: { color: '#F37254' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Create order error', err);
      toast.error(err?.response?.data?.message || 'Failed to create payment');
    }
  };

  return (
    <button className="order-pay-btn" onClick={handlePay}>
      Pay Now
    </button>
  );
};

export default RazorpayCheckout;