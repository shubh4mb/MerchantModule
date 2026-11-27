import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, XCircle, RefreshCw, Edit3 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getMerchantById } from '../../api/auth';

const RejectedPage: React.FC = () => {
  const { merchant, logout, login, token } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

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
        } else if (updated.status === 'pending_verification' || updated.status === 'payment_pending_verification') {
          navigate('/merchant/pending-verification');
        } else if (updated.status === 'rejected') {
          alert('Status: Application is still marked as rejected. Please edit and resubmit your details.');
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
        <div className="w-16 h-16 mx-auto mb-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--color-primary)" }}>Action Required</h2>
        <p className="text-xs text-gray-500 mb-6 font-medium">Registration / Verification Review</p>
        
        {merchant?.rejectionReason ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6 text-left text-sm text-red-800 space-y-2">
            <span className="font-bold block text-sm border-b border-red-200 pb-2 text-red-900">❌ Flagged by Admin:</span>
            <p className="whitespace-pre-line leading-relaxed font-semibold">{merchant.rejectionReason}</p>
          </div>
        ) : (
          <p className="text-gray-600 mb-6 leading-relaxed text-sm">
            Some details or documents submitted during your registration need correction. Please review and resubmit.
          </p>
        )}

        <Link 
          to="/merchant/register"
          className="flex items-center justify-center w-full py-3.5 px-4 rounded-xl font-bold transition-all bg-black text-white hover:bg-gray-800 mb-3 shadow-lg shadow-black/10 text-center gap-2"
        >
          <Edit3 className="w-4 h-4" />
          Review & Resubmit Details
        </Link>

        <button
          onClick={handleCheckStatus}
          disabled={checking}
          className="flex items-center justify-center w-full py-3 px-4 rounded-xl font-bold transition-all border border-gray-200 hover:bg-gray-50 mb-3 text-gray-700 gap-2 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking Status...' : 'Check Verification Status'}
        </button>

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

export default RejectedPage;
