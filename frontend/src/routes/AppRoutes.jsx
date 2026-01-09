import React from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import UserRegister from '../pages/auth/UserRegister';
import ChooseRegister from '../pages/auth/ChooseRegister';
import UserLogin from '../pages/auth/UserLogin';
import FoodPartnerRegister from '../pages/auth/FoodPartnerRegister';
import FoodPartnerLogin from '../pages/auth/FoodPartnerLogin';
import Home from '../pages/general/Home';
import Saved from '../pages/general/Saved';
import BottomNav from '../components/BottomNav';
import CreateFood from '../pages/food-partner/CreateFood';
import Profile from '../pages/food-partner/Profile';
import MyOrders from "../pages/orders/MyOrders"
import FoodPartnerOrders from '../pages/food-partner/FoodPartnerOrders';
import FoodPartnerDashboard from "../pages/food-partner/FoodPartnerDashboard";
import ProtectedFoodPartnerRoute from "../routes/ProtectedFoodPartnerRoute";

const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/register" replace />} />
                <Route path="/register" element={<ChooseRegister />} />
                <Route path="/user/register" element={<UserRegister />} />
                <Route path="/user/login" element={<UserLogin />} />
                <Route path="/food-partner/register" element={<FoodPartnerRegister />} />
                <Route path="/food-partner/login" element={<FoodPartnerLogin />} />
                <Route path="/home" element={<><Home /><BottomNav /></>} />
                <Route path="/saved" element={<><Saved /><BottomNav /></>} />
                <Route path="/create-food" element={<CreateFood />} />
                <Route path="/food-partner/:id" element={<Profile />} />
                <Route path="/my-orders" element={<MyOrders />} />
                <Route path="/partner/orders" element={<FoodPartnerOrders />} />
                <Route
                    path="/partner/dashboard"
                    element={
                        <ProtectedFoodPartnerRoute>
                            <FoodPartnerDashboard />
                        </ProtectedFoodPartnerRoute>
                    }
                />

            </Routes>
        </Router>
    )
}

export default AppRoutes
