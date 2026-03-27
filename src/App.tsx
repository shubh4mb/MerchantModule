import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ConfirmDialogProvider } from "./context/ConfirmDialogContext";
import Login from "./pages/auth/Login";
import FlashFitsSignUp from "./pages/auth/FlashFitsSignUp";
import Register from "./pages/auth/Register";
import AppLayout from "./components/layout/AppLayout";

import AddNewProduct from "./pages/products/AddNewProduct";
import AddBrandPage from "./pages/brands/AddBrandPage";
import ProfilePage from "./pages/ProfilePage";

import InventoryPage from "./pages/products/InventoryPage";
import OrderManagement from "./pages/OrderManagement";
import RevenuePage from "./pages/Revenue";
import EditProductPage from "./pages/products/EditProductPage";
import DashboardPage from "./pages/Dashboard";

// ✅ Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/merchant/login" replace />;
  }

  return <>{children}</>;
};

// ✅ Public Route Component (prevents logged-in users from accessing login/signup)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (token) {
    return <Navigate to="/merchant/inventory" replace />;
  }

  return <>{children}</>;
};

const AppRoot: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <NotificationProvider>
          <ConfirmDialogProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/merchant/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/merchant/signup" element={<PublicRoute><FlashFitsSignUp /></PublicRoute>} />

              {/* Authenticated Setup Route */}
              <Route path="/merchant/register" element={<ProtectedRoute><Register /></ProtectedRoute>} />

              {/* Dashboard with Sidebar */}
              <Route path="/merchant" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="revenue" element={<RevenuePage />} />
                <Route path="edit/:id" element={<EditProductPage />} />
                <Route path="orders" element={<OrderManagement />} />
                <Route path="add-product" element={<AddNewProduct />} />
                <Route path="add-brand" element={<AddBrandPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route index element={<Navigate to="dashboard" />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/merchant/login" />} />
            </Routes>
          </ConfirmDialogProvider>
        </NotificationProvider>
      </Router>
    </AuthProvider>
  );
};

export default AppRoot;

