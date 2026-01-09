const Order = require("../models/order.model");
const Food = require("../models/food.model");
const socketService = require("../services/socket.service");

/* 🔹 Place Order (USER) */
exports.placeOrder = async (req, res) => {
  try {
    const userId = req.user.id
    const { foodId, foodPartnerId, quantity, totalPrice } = req.body

    const orderData = {
      user: userId,
      food: foodId,
      foodPartner: foodPartnerId,
      quantity,
      totalPrice
    }

    if (req.body.payment) {
      orderData.payment = req.body.payment
    }

    const order = await Order.create(orderData)

    res.status(201).json({
      message: "Order placed successfully",
      order
    })

    // notify food partner in real-time (if socket available)
    try {
      const io = socketService.getIO();
      if (io && order.foodPartner) {
        io.to(`partner:${order.foodPartner}`).emit('newOrder', order);
      }
    } catch (err) {
      // non-fatal
      console.error('Socket emit error (placeOrder):', err);
    }

  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/* 🔹 Get Order (USER) */
exports.getMyOrders = async (req, res) => {
  try {
    console.log("USER FROM TOKEN:", req.user);

    const orders = await Order.find({ user: req.user._id })
      .populate("food")
      .sort({ createdAt: -1 });

    res.status(200).json({ orders });
  } catch (err) {
    console.error("GET MY ORDERS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};


/* 🔹 Get Order (Food  Partner) */
exports.getOrdersForPartner = async (req, res) => {
  try {
    if (!req.foodPartner) return res.status(401).json({ message: "Please login as food partner" });
    const foodPartnerId = req.foodPartner.id || req.foodPartner._id;

    const orders = await Order.find({ foodPartner: foodPartnerId })
      .populate('user', 'fullName email phone')
      .populate("food", "name price image")
      .sort({ createdAt: -1 });

    res.status(200).json({ orders });
  } catch (error) {
    console.error("GET ORDERS FOR PARTNER ERROR:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/* 🔹 Accept/Reject Order (FOOD PARTNER) */
exports.respondToOrder = async (req, res) => {
  try {
    const { status } = req.body; // accepted | rejected
    const order = await Order.findById(req.params.id);

    if (!order)
      return res.status(404).json({ message: "Order not found" });

    if (!req.foodPartner || order.foodPartner.toString() !== (req.foodPartner.id || req.foodPartner._id).toString())
      return res.status(403).json({ message: "Unauthorized" });

    if (order.status !== "pending")
      return res.status(400).json({ message: "Order already processed" });

    order.status = status === "accepted" ? "confirmed" : "cancelled";
    await order.save();

    res.status(200).json({ message: "Order updated", order });

    // notify partner and user in real-time
    try {
      const io = socketService.getIO();
      if (io) {
        io.to(`partner:${order.foodPartner}`).emit('orderUpdated', order);
        io.to(`user:${order.user}`).emit('orderUpdated', order);
      }
    } catch (err) {
      console.error('Socket emit error (respondToOrder):', err);
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to update order" });
  }
};

/* 🔹Update Order Status (Preparing → Delivered) (FOOD PARTNER) */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatus = [
      "preparing",
      "out_for_delivery",
      "completed"
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(req.params.id);

    if (!order)
      return res.status(404).json({ message: "Order not found"});

    if (!req.foodPartner || order.foodPartner.toString() !== (req.foodPartner.id || req.foodPartner._id).toString())
      return res.status(403).json({ message: "Unauthorized" });

    order.status = status;
    await order.save();

    res.status(200).json({ message: "Status updated", order });

    // push real-time status change to partner and user
    try {
      const io = socketService.getIO();
      if (io) {
        io.to(`partner:${order.foodPartner}`).emit('orderUpdated', order);
        io.to(`user:${order.user}`).emit('orderUpdated', order);
      }
    } catch (err) {
      console.error('Socket emit error (updateOrderStatus):', err);
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to update status" });
  }
};


/* 🔹 Reorder - create a new order copying values from an existing order */
exports.reorderOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });

    const original = await Order.findById(orderId);
    if (!original) return res.status(404).json({ message: 'Original order not found' });

    // only the original owner can reorder their past order
    if (original.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to reorder this order' });
    }

    // try to use current food price if available
    const food = await Food.findById(original.food);
    const unitPrice = (food && food.price) ? food.price : (original.totalPrice / original.quantity);
    const totalPrice = unitPrice * original.quantity;

    const newOrder = await Order.create({
      user: req.user._id,
      food: original.food,
      foodPartner: original.foodPartner,
      quantity: original.quantity,
      totalPrice
    });

    // populate for consistent client response
    await newOrder.populate('food').execPopulate ? await newOrder.populate('food') : null;
    await newOrder.populate('foodPartner')

    res.status(201).json({ message: 'Reorder placed', order: newOrder });
  } catch (err) {
    console.error('REORDER ERROR:', err);
    res.status(500).json({ message: 'Failed to place reorder' });
  }
};



