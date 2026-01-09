const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  food: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "food",
    required: true
  },
  foodPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "foodpartner",
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: [
      "pending",
      "confirmed",
      "preparing",
      "out_for_delivery",
      "completed",
      "cancelled"
    ],
    default: "pending"
  },

}, { timestamps: true })

module.exports = mongoose.model("Order", orderSchema)
