import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ConfirmDialogProvider } from "./context/ConfirmDialogContext";
import Login from "./components/Login/Login";
import FlashFitsSignUp from "./components/Login/FlashFitsSignUp";
import Register from "./components/Login/Register";
import AppLayout from "./AppLayout";
import ProductPage from "./components/ProductPage/ProductPage";
import OrderManagement from "./components/Order/OrderManagement";
import AddNewProduct from "./components/Products/AddNewProduct";
import AddBrandPage from "./components/Brand/AddBrandPage";
// import NotificationBell from "./components/Order/styles/NotificationBell";

const AppRoot: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
      <NotificationProvider>
        <ConfirmDialogProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/merchant/login" element={<Login />} />
              <Route path="/merchant/signup" element={<FlashFitsSignUp />} />
              <Route path="/merchant/register" element={<Register />} />

              {/* Dashboard with Sidebar */}
              <Route path="/merchant" element={<AppLayout />}>
                <Route path="products" element={<ProductPage />} />
                <Route path="orders" element={<OrderManagement />} />
                <Route path="add-product" element={<AddNewProduct />} />
                <Route path="add-brand" element={<AddBrandPage />} />
                <Route index element={<Navigate to="products" />} />
              </Route>
              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/merchant/products" />} />
            </Routes>
          
        </ConfirmDialogProvider>
      </NotificationProvider>
      </Router>
    </AuthProvider>
  );
};

export default AppRoot;
