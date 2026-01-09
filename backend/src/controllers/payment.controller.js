const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/order.model');

// initialize Razorpay instance with keys from .env
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });

    if (order.payment && order.payment.status === 'succeeded') {
      return res.status(400).json({ message: 'Order already paid' });
    }

    const amountInPaise = Math.round(order.totalPrice * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: order._id.toString(),
      payment_capture: 1
    };

    const rOrder = await razorpayInstance.orders.create(options);

    order.payment = {
      provider: 'razorpay',
      amount: order.totalPrice,
      currency: 'INR',
      status: 'pending',
      transactionId: rOrder.id
    };

    await order.save();

    res.json({
      key: process.env.RAZORPAY_KEY_ID,
      orderId: rOrder.id,
      amount: rOrder.amount,
      currency: rOrder.currency
    });
  } catch (err) {
    console.error('CREATE RAZORPAY ORDER ERROR:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ message: 'Missing parameters' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.payment = {
      provider: 'razorpay',
      amount: order.totalPrice,
      currency: 'INR',
      status: 'succeeded',
      transactionId: razorpay_payment_id
    };

    await order.save();

    res.json({ message: 'Payment verified', order });
  } catch (err) {
    console.error('VERIFY RAZORPAY PAYMENT ERROR:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('Webhook secret not configured (RAZORPAY_WEBHOOK_SECRET)');
      return res.status(500).json({ message: 'Webhook secret not configured' });
    }

    const rawBody = req.rawBody ? (Buffer.isBuffer(req.rawBody) ? req.rawBody.toString('utf8') : req.rawBody.toString()) : (req.body instanceof Buffer ? req.body.toString('utf8') : JSON.stringify(req.body));
    const signature = req.headers['x-razorpay-signature'];

    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

    if (signature !== expected) {
      console.warn('Invalid webhook signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = JSON.parse(rawBody);
    const eventName = event.event;

    if (eventName === 'payment.captured' || eventName === 'payment.authorized') {
      const paymentEntity = event.payload && event.payload.payment && event.payload.payment.entity;
      if (paymentEntity) {
        const razorpayOrderId = paymentEntity.order_id;
        const razorpayPaymentId = paymentEntity.id;
        const amount = paymentEntity.amount ? (paymentEntity.amount / 100) : null;

        const order = await Order.findOne({ 'payment.transactionId': razorpayOrderId });
        if (order) {
          order.payment = {
            provider: 'razorpay',
            amount: amount || order.totalPrice,
            currency: paymentEntity.currency || 'INR',
            status: 'succeeded',
            transactionId: razorpayPaymentId
          };
          await order.save();
          console.log('Order updated via webhook', order._id.toString());
        } else {
          console.warn('No local order found for razorpay order id', razorpayOrderId);
        }
      }
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('RAZORPAY WEBHOOK ERROR:', err);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};