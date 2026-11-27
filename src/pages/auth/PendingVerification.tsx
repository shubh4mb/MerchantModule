import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, RefreshCw, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getMerchantById } from '../../api/auth';

const PendingVerification: React.FC = () => {
  const { logout, merchant, login, token } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const isPaymentPending = merchant?.status === 'payment_pending_verification';

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const updated = await getMerchantById();
      if (updated) {
        login({
          id: updated._id,
          shopName: updated.shopName || "",
          email: updated.email || "",
          phoneNumber: updated.phoneNumber || "",
          isActive: updated.isActive,
          status: updated.status,
          zoneId: updated.zoneId,
          rejectionReason: updated.rejectionReason,
        } as any, token!);

        if (updated.status === 'active' || updated.isActive) {
          navigate('/merchant/inventory');
        } else if (updated.status === 'pending_payment') {
          navigate('/merchant/payment');
        } else if (updated.status === 'rejected') {
          navigate('/merchant/rejected');
        } else {
          alert('Status Info: Application is still under verification by the admin team.');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to refresh status');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm text-center" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="w-16 h-16 mx-auto mb-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
          <Clock className="w-8 h-8 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-primary)" }}>
          {isPaymentPending ? "Payment Under Review" : "Under Verification"}
        </h2>
        <p className="text-gray-600 mb-6 leading-relaxed text-sm">
          {isPaymentPending
            ? "Your registration fee payment is currently under review by our admin team. We are verifying the payment transaction. You will be notified once the activation is complete."
            : "Your merchant account is currently under review by our admin team. We are verifying your documents and details. You will be notified once the verification is complete."
          }
        </p>

        <button
          onClick={handleCheckStatus}
          disabled={checking}
          className="flex items-center justify-center w-full py-3 px-4 rounded-xl font-bold transition-all border border-gray-200 hover:bg-gray-50 mb-3 text-gray-700 gap-2 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking Status...' : 'Check Verification Status'}
        </button>

        {!isPaymentPending && (
          <Link 
            to="/merchant/register"
            className="flex items-center justify-center w-full py-3 px-4 rounded-xl font-bold transition-all bg-black text-white hover:bg-gray-800 mb-3 shadow-lg shadow-black/10 text-center text-sm"
          >
            View Submitted Details
          </Link>
        )}

        <button 
          onClick={logout}
          className="flex items-center justify-center w-full py-2.5 px-4 rounded-xl font-medium transition-colors text-xs text-gray-500 hover:text-gray-700"
        >
          <LogOut className="w-4 h-4 mr-1.5" />
          Log Out
        </button>
      </div>
    </div>
  );
};

export default PendingVerification;
