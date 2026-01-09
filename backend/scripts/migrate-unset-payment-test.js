/*
 * Migration: unset payment.test field if exists on orders
 * Run: node scripts/migrate-unset-payment-test.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../src/models/order.model');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to DB');

    // Pull sample documents where payment.test exists
    const docs = await Order.find({ 'payment.test': { $exists: true } }).limit(10).lean();
    console.log('Found docs with payment.test (showing up to 10):', docs.map(d => ({ id: d._id, payment: d.payment })));

    const res = await Order.updateMany({ 'payment.test': { $exists: true } }, { $unset: { 'payment.test': 1 } });
    console.log('Migration result:', res);

    await mongoose.disconnect();
    console.log('Disconnected');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();