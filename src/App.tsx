import React, { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ConfirmDialogProvider } from "./context/ConfirmDialogContext";
import AppLayout from "./components/layout/AppLayout";

// Lazy load pages to optimize initial bundle size and page loading speed
const Login = lazy(() => import("./pages/auth/Login"));
const FlashFitsSignUp = lazy(() => import("./pages/auth/FlashFitsSignUp"));
const Register = lazy(() => import("./pages/auth/Register"));
const PendingVerification = lazy(() => import("./pages/auth/PendingVerification"));
const PaymentPage = lazy(() => import("./pages/auth/PaymentPage"));
const RejectedPage = lazy(() => import("./pages/auth/RejectedPage"));

const AddNewProduct = lazy(() => import("./pages/products/AddNewProduct"));
const BulkUploadProducts = lazy(() => import("./pages/products/BulkUploadProducts"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const MobileUploadProof = lazy(() => import("./pages/order/MobileUploadProof"));

const InventoryPage = lazy(() => import("./pages/products/InventoryPage"));
const OrderManagement = lazy(() => import("./pages/OrderManagement"));
const CourierOrders = lazy(() => import("./pages/CourierOrders"));
const RevenuePage = lazy(() => import("./pages/Revenue"));
const EditProductPage = lazy(() => import("./pages/products/EditProductPage"));
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const OffersPage = lazy(() => import("./pages/OffersPage"));
const ZipCovers = lazy(() => import("./pages/ZipCovers"));

// Premium loading fallback for Suspense
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
    <div className="spinner" />
  </div>
);

// ✅ Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!token) {
    return <Navigate to="/merchant/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, merchant, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingFallback />;
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
            <Suspense fallback={<LoadingFallback />}>
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
            </Suspense>
          </ConfirmDialogProvider>
        </NotificationProvider>
      </Router>
    </AuthProvider>
  );
};

export default AppRoot;
