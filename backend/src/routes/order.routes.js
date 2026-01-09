const express = require('express');
const orderController = require("../controllers/order.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

/* 🔹 Place Order (USER) */
router.post(
  "/",
  authMiddleware.authUserMiddleware,
  orderController.placeOrder
);

/* 🔹 Get Order (USER) */
router.get(
  "/my",
  authMiddleware.authUserMiddleware,
  orderController.getMyOrders
);

/* 🔹 GET /api/partner/orders (Food  Partner) */
router.get(
  "/partner/orders",
  authMiddleware.authFoodPartnerMiddleware,
  orderController.getOrdersForPartner
);

/* 🔹PATCH /api/orders/:id/respond (FOOD PARTNER) */
router.patch(
  "/:id/respond",
  authMiddleware.authFoodPartnerMiddleware,
  orderController.respondToOrder
);

/* 🔹PATCH /api/orders/:id/status (FOOD PARTNER) */
router.patch(
  "/:id/status",
  authMiddleware.authFoodPartnerMiddleware,
  orderController.updateOrderStatus
);

// 🔹 POST /api/orders/reorder (USER) - create a new order copying an existing one
router.post(
  "/reorder",
  authMiddleware.authUserMiddleware,
  orderController.reorderOrder
);

module.exports = router;


