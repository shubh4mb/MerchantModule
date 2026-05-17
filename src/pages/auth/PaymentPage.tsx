import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, CreditCard, Loader2 } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';

// Helper to load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PaymentPage: React.FC = () => {
  const { merchant, token, logout, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    if (!merchant) return;
    setIsLoading(true);

    try {
      const res = await loadRazorpayScript();
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        setIsLoading(false);
        return;
      }

      // Create Order
      const mId = merchant.id || (merchant as any)._id;
      const orderResponse = await axiosInstance.post(`merchant/${mId}/registration-fee/create-order`);
      
      if (!orderResponse.data.success) {
          throw new Error(orderResponse.data.message || "Failed to create payment order");
      }

      // Auto-activate if fee is 0
      if (orderResponse.data.status === 'active') {
         alert('Registration fee is 0. Account activated automatically.');
         const updatedMerchant = { ...merchant, isActive: true, status: 'active' };
         login(updatedMerchant, token!);
         window.location.href = "/merchant/inventory";
         return;
      }

      const { amount, orderId, currency, keyId } = orderResponse.data;

      const options = {
        key: keyId,
        amount: amount.toString(),
        currency: currency,
        name: 'FlashFits',
        description: 'Merchant Registration Fee',
        image: '/icon.png', // Add your logo path here
        order_id: orderId,
        handler: async function (response: any) {
          try {
            setIsLoading(true);
            const mId = merchant.id || (merchant as any)._id;
            const verifyResponse = await axiosInstance.post(`merchant/${mId}/registration-fee/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResponse.data.success) {
              alert('Payment successful! Your account is now active.');
              // Update merchant context
              const updatedMerchant = { ...merchant, isActive: true, status: 'active' };
              login(updatedMerchant, token!);
              window.location.href = "/merchant/inventory";
            }
          } catch (error) {
            console.error(error);
            alert('Payment verification failed. Please contact support.');
          } finally {
            setIsLoading(false);
          }
        },
        prefill: {
          name: merchant.shopName,
          email: merchant.email,
          contact: merchant.phoneNumber,
        },
        theme: {
          color: '#3B82F6', // matching the app's primary color
        },
        modal: {
            ondismiss: function() {
                setIsLoading(false);
            }
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || error.message || 'An error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm text-center" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
          <CreditCard className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--color-primary)" }}>Complete Registration</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Your documents have been verified successfully! 
          To start selling on FlashFits, please pay the one-time registration fee.
        </p>

        <button 
          onClick={handlePayment}
          disabled={isLoading}
          className="flex items-center justify-center w-full py-3 px-4 mb-4 rounded-xl font-medium text-white transition-colors"
          style={{ backgroundColor: "var(--color-primary)", opacity: isLoading ? 0.7 : 1 }}
        >
          {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : "Pay Registration Fee"}
        </button>

        <button 
          onClick={logout}
          className="flex items-center justify-center w-full py-3 px-4 rounded-xl font-medium transition-colors"
          style={{ backgroundColor: "var(--color-border)", color: "var(--color-text)" }}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Log Out
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;
