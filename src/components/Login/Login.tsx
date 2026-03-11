import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as apiLogin } from '../../api/auth';
import { AuthContext } from '../../context/AuthContext';
import FlashFitsLogo from '../../assets/fevicon.png';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { merchant, token } = await apiLogin(email, password);
      if (!merchant || !token) throw new Error('Invalid credentials');

      login(merchant, token);

      if (merchant.isActive) {
        navigate('/merchant/orders');
      } else {
        localStorage.setItem("merchant_id", merchant.id);
        navigate('/merchant/register');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && email && password && !loading) {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-gradient p-4 overflow-hidden relative animate-float">
      {/* Grain Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><defs><pattern id=%22grain%22 width=%22100%22 height=%22100%22 patternUnits=%22userSpaceOnUse%22><circle cx=%2250%22 cy=%2250%22 r=%220.5%22 fill=%22rgba(255,255,255,0.03)%22/></pattern></defs><rect width=%22100%22 height=%22100%22 fill=%22url(%23grain)%22/></svg>')] opacity-30 pointer-events-none"></div>

      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md animate-form-in">
        {/* Logo */}
        <div className="text-center m-2 animate-logo-in">
          <img src={FlashFitsLogo} alt="FlashFits Logo" className="mx-auto w-48" />
        </div>

        {/* Login Card */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-glass p-8 border border-glass-border">
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white">Merchant Login</h2>
            </div>

            {error && (
              <p className="text-red-400 text-sm animate-fade-in text-center" role="alert">{error}</p>
            )}

            <div className="flex flex-col gap-2">
              <label className="block text-white/80 text-sm font-medium ml-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="you@business.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white text-base transition-all focus:bg-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="block text-white/80 text-sm font-medium ml-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="••••••••"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white text-base transition-all focus:bg-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20"
              />
            </div>

            <button
              onClick={(e) => handleSubmit(e as any)}
              disabled={loading}
              className="w-full mt-4 py-4 px-8 bg-primary-gradient text-white font-semibold rounded-xl shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Sign in'
              )}
            </button>

            <p className="text-center text-sm text-white/50 mt-4">
              New here? <Link to="/merchant/signup" className="text-white font-semibold underline hover:text-white/80 transition-colors">Create an account</Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-xs mt-8 animate-fade-in opacity-0 [animation-fill-mode:forwards] [animation-delay:1s]">
          © 2025 FlashFits. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;

