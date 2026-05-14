import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, XCircle } from 'lucide-react';

const RejectedPage: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm text-center" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="w-16 h-16 mx-auto mb-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--color-primary)" }}>Verification Rejected</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Unfortunately, your merchant registration was not approved at this time. 
          Please contact our support team if you believe this was a mistake.
        </p>
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
