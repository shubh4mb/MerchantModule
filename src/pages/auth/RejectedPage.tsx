import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const RejectedPage: React.FC = () => {
  const { merchant, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm text-center" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="w-16 h-16 mx-auto mb-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--color-primary)" }}>Verification Rejected</h2>
        {merchant?.rejectionReason ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8 text-left text-sm text-red-800 space-y-2">
            <span className="font-bold block text-base border-b border-red-200 pb-2">❌ Issues to Fix:</span>
            <p className="whitespace-pre-line leading-relaxed font-semibold">{merchant.rejectionReason}</p>
          </div>
        ) : (
          <p className="text-gray-600 mb-8 leading-relaxed">
            Unfortunately, your merchant registration was not approved at this time. 
            Please contact our support team if you believe this was a mistake.
          </p>
        )}
        <Link 
          to="/merchant/register"
          className="flex items-center justify-center w-full py-3 px-4 rounded-xl font-bold transition-all bg-black text-white hover:bg-gray-800 mb-3 shadow-lg shadow-black/10 text-center"
        >
          Edit & Resubmit Details
        </Link>
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

export default RejectedPage;
