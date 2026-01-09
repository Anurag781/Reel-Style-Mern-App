// create server
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');
const foodRoutes = require('./routes/food.routes');
const foodPartnerRoutes = require('./routes/food-partner.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payments.routes');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(cookieParser());
app.use(express.json({
    verify: (req, res, buf) => {
        // store raw body for signature verification of webhooks
        req.rawBody = buf;
    }
}));

app.get("/", (req, res) => {
    res.send("Hello World");
})

app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/comments', require('./routes/comments.routes'));
app.use('/api/food-partner', foodPartnerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

module.exports = app;