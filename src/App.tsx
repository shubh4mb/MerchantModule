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


import AddNewProduct from "./pages/AddNewProduct";
import AddBrandPage from "./pages/AddBrandPage";

import InventoryPage from "./pages/InventoryPage";
import OrderManagement from "./pages/OrderManagement";
import BulkProductUpload from "./pages/BulkProductUpload";

import EditProductPage from "./components/Products/EditProductPage";

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
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="edit/:id" element={<EditProductPage />} />
                <Route path="bulkupload" element={<BulkProductUpload />} />
                <Route path="orders" element={<OrderManagement />} />
                <Route path="add-product" element={<AddNewProduct />} />
                <Route path="add-brand" element={<AddBrandPage />} />
                <Route index element={<Navigate to="products" />} />
              </Route>
              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/merchant/inventory" />} />
            </Routes>
        </ConfirmDialogProvider>
      </NotificationProvider>
      </Router>
    </AuthProvider>
  );
};

export default AppRoot;
