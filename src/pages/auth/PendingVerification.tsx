import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

const PendingVerification: React.FC = () => {
  const { logout, merchant } = useAuth();
  const isPaymentPending = merchant?.status === 'payment_pending_verification';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm text-center" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="w-16 h-16 mx-auto mb-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--color-primary)" }}>
          {isPaymentPending ? "Payment Verification Pending" : "Verification Pending"}
        </h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          {isPaymentPending
            ? "Your registration fee payment is currently under review by our admin team. We are verifying the payment transaction. You will be notified once the activation is complete."
            : "Your merchant account is currently under review by our admin team. We are verifying your documents and details. You will be notified once the verification is complete."
          }
        </p>
        {!isPaymentPending && (
          <Link 
            to="/merchant/register"
            className="flex items-center justify-center w-full py-3 px-4 rounded-xl font-bold transition-all bg-black text-white hover:bg-gray-800 mb-3 shadow-lg shadow-black/10 text-center"
          >
            View Submitted Details
          </Link>
        )}
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

export default PendingVerification;
