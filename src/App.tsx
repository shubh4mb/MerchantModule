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
import Login from "./components/Login/Login";
import FlashFitsSignUp from "./components/Login/FlashFitsSignUp";
import Register from "./components/Login/Register";
import AppLayout from "./AppLayout";

import AddNewProduct from "./pages/AddNewProduct";
import AddBrandPage from "./pages/AddBrandPage";

import InventoryPage from "./pages/InventoryPage";
import OrderManagement from "./pages/OrderManagement";
import RevenuePage from "./pages/Revenue";
import EditProductPage from "./components/Products/EditProductPage";

// ✅ Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><defs><pattern id=%22grain%22 width=%22100%22 height=%22100%22 patternUnits=%22userSpaceOnUse%22><circle cx=%2250%22 cy=%2250%22 r=%220.5%22 fill=%22rgba(255,255,255,0.03)%22/></pattern></defs><rect width=%22100%22 height=%22100%22 fill=%22url(%23grain)%22/></svg>')] opacity-30 pointer-events-none"></div>
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
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
      <div className="min-h-screen flex items-center justify-center bg-primary-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><defs><pattern id=%22grain%22 width=%22100%22 height=%22100%22 patternUnits=%22userSpaceOnUse%22><circle cx=%2250%22 cy=%2250%22 r=%220.5%22 fill=%22rgba(255,255,255,0.03)%22/></pattern></defs><rect width=%22100%22 height=%22100%22 fill=%22url(%23grain)%22/></svg>')] opacity-30 pointer-events-none"></div>
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (token) {
    return <Navigate to="/merchant/orders" replace />;
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
                <Route index element={<Navigate to="orders" />} />
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

