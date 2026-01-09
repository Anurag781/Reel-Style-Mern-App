const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authUserMiddleware } = require('../middlewares/auth.middleware');

// Creates a Razorpay order and returns the razorpay order id + key id to the client
router.post('/razorpay/create-order', authUserMiddleware, paymentController.createRazorpayOrder);

// Verifies payment signature sent from client/checkout
router.post('/razorpay/verify', authUserMiddleware, paymentController.verifyRazorpayPayment);

// Webhook endpoint (Razorpay will POST events here). Raw body is captured in app.js via express.json verify
router.post('/razorpay/webhook', paymentController.razorpayWebhook);

module.exports = router;