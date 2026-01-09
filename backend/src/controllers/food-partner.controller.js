const foodPartnerModel = require('../models/foodpartner.model');
const foodModel = require('../models/food.model');
const Order = require("../models/order.model");

/* 🔹 Utility function */
async function getCustomersServed(foodPartnerId) {
  return await Order.countDocuments({
    foodPartner: foodPartnerId,
    status: "completed"
  });
}

/* 🔹 Main API */
async function getFoodPartnerById(req, res) {
  try {
    const foodPartnerId = req.params.id;

    const foodPartner = await foodPartnerModel.findById(foodPartnerId);
    if (!foodPartner) {
      return res.status(404).json({ message: "Food partner not found" });
    }

    const foodItemsByFoodPartner = await foodModel.find({
      foodPartner: foodPartnerId
    });

    const customersServed = await getCustomersServed(foodPartnerId);

    res.status(200).json({
      message: "Food partner retrieved successfully",
      foodPartner: {
        ...foodPartner.toObject(),
        foodItems: foodItemsByFoodPartner,
        totalMeals: foodItemsByFoodPartner.length,
        customersServed               // ⭐ FINAL FIX
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/* 🔹 Get authenticated food partner with extra stats */
async function getMyFoodPartner(req, res) {
  try {
    const foodPartnerId = req.foodPartner._id;

    const foodPartner = await foodPartnerModel.findById(foodPartnerId);
    if (!foodPartner) {
      return res.status(404).json({ message: "Food partner not found" });
    }

    const foodItemsByFoodPartner = await foodModel.find({
      foodPartner: foodPartnerId
    });

    const customersServed = await getCustomersServed(foodPartnerId);

    res.status(200).json({
      message: "Authenticated food partner retrieved successfully",
      foodPartner: {
        ...foodPartner.toObject(),
        foodItems: foodItemsByFoodPartner,
        totalMeals: foodItemsByFoodPartner.length,
        customersServed
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getFoodPartnerById,
  getMyFoodPartner
};
