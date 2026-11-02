import OrderTracking from "./features/orders/OrderTracking.jsx";
import WebsiteRuntime from "./features/home/components/WebsiteRuntime.jsx";
import CheckoutPage from "./features/checkout/CheckoutPage.jsx";
import ShopPage from "./features/shop/pages/ShopPage.jsx";
import ProductDetails from "./features/products/pages/ProductDetails.jsx";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import AdminDashboard from "./admin/dashboard/AdminDashboard.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <WebsiteRuntime />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/orders/track" element={<OrderTracking />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:slug" element={<ProductDetails />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/login" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
