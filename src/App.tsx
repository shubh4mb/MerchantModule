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
import PendingVerification from "./pages/auth/PendingVerification";
import PaymentPage from "./pages/auth/PaymentPage";
import RejectedPage from "./pages/auth/RejectedPage";
import AppLayout from "./components/layout/AppLayout";

import AddNewProduct from "./pages/products/AddNewProduct";
import BulkUploadProducts from "./pages/products/BulkUploadProducts";
import ProfilePage from "./pages/ProfilePage";
import MobileUploadProof from "./pages/order/MobileUploadProof";

import InventoryPage from "./pages/products/InventoryPage";
import OrderManagement from "./pages/OrderManagement";
import CourierOrders from "./pages/CourierOrders";
import RevenuePage from "./pages/Revenue";
import EditProductPage from "./pages/products/EditProductPage";
import DashboardPage from "./pages/Dashboard";
import OffersPage from "./pages/OffersPage";
import ZipCovers from "./pages/ZipCovers";

// ✅ Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/merchant/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, merchant, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (token) {
    if (merchant) {
      if (merchant.status === 'pending_payment') return <Navigate to="/merchant/payment" replace />;
      if (merchant.status === 'pending_verification' || merchant.status === 'payment_pending_verification') {
        return <Navigate to="/merchant/pending-verification" replace />;
      }
      if (merchant.status === 'rejected') return <Navigate to="/merchant/rejected" replace />;
      if (merchant.status === 'incomplete' || !merchant.isActive) {
        return <Navigate to="/merchant/register" replace />;
      }
    }
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
              <Route path="/merchant/order/upload-proof" element={<MobileUploadProof />} />

              {/* Authenticated Setup Route */}
              <Route path="/merchant/register" element={<ProtectedRoute><Register /></ProtectedRoute>} />
              <Route path="/merchant/pending-verification" element={<ProtectedRoute><PendingVerification /></ProtectedRoute>} />
              <Route path="/merchant/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
              <Route path="/merchant/rejected" element={<ProtectedRoute><RejectedPage /></ProtectedRoute>} />

              {/* Dashboard with Sidebar */}
              <Route path="/merchant" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="revenue" element={<RevenuePage />} />
                <Route path="edit/:id" element={<EditProductPage />} />
                <Route path="orders" element={<OrderManagement />} />
                <Route path="courier-orders" element={<CourierOrders />} />
                <Route path="add-product" element={<AddNewProduct />} />
                <Route path="bulk-upload" element={<BulkUploadProducts />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="offers" element={<OffersPage />} />
                <Route path="zip-covers" element={<ZipCovers />} />
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

