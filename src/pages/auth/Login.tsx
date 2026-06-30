import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as apiLogin } from '../../api/auth';
import { AuthContext } from '../../context/AuthContext';
import FlashFitsLogo from '../../assets/fevicon.png';
import { Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { merchant, token, refreshToken } = await apiLogin(email, password);
      if (!merchant || !token) throw new Error('Invalid credentials');

      login(merchant, token, refreshToken);

      if (merchant.isActive) {
        navigate('/merchant/inventory');
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
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: "var(--color-bg)",
        padding: "var(--space-4)",
      }}
    >
      <div className="w-full" style={{ maxWidth: "400px" }}>
        {/* Logo */}
        <div className="text-center animate-slideUp" style={{ marginBottom: "var(--space-8)" }}>
          <img
            src={FlashFitsLogo}
            alt="FlashFits Logo"
            style={{ margin: "0 auto", maxHeight: "48px" }}
          />
        </div>

        {/* Login Card */}
        <div
          className="animate-slideUp"
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-md)",
            padding: "var(--space-8)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "var(--space-8)" }}>
            <h2
              style={{
                fontSize: "var(--text-xl)",
                fontWeight: 700,
                color: "var(--color-text)",
                letterSpacing: "-0.025em",
              }}
            >
              Welcome back
            </h2>
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-text-secondary)",
                marginTop: "var(--space-1)",
              }}
            >
              Sign in to your merchant account
            </p>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: "var(--space-4)" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="you@business.com"
                required
                className="input"
              />
            </div>

             <div>
               <label className="input-label">Password</label>
               <div style={{ position: 'relative' }}>
                 <input
                   type={showPassword ? "text" : "password"}
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   onKeyPress={handleKeyPress}
                   placeholder="••••••••"
                   required
                   className="input"
                   style={{ paddingRight: '40px' }}
                 />
                 <button
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   style={{
                     position: 'absolute',
                     right: '12px',
                     top: '50%',
                     transform: 'translateY(-50%)',
                     background: 'none',
                     border: 'none',
                     cursor: 'pointer',
                     padding: 0,
                     color: 'var(--color-text-secondary)',
                     display: 'flex',
                     alignItems: 'center',
                   }}
                 >
                   {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                 </button>
               </div>
             </div>

            <button
              onClick={(e) => handleSubmit(e as any)}
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", marginTop: "var(--space-2)" }}
            >
              {loading ? (
                <div className="spinner spinner-sm" style={{ borderTopColor: "white", borderColor: "rgba(255,255,255,0.3)" }} />
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <p
            style={{
              textAlign: "center",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-secondary)",
              marginTop: "var(--space-6)",
            }}
          >
            New here?{' '}
            <Link
              to="/merchant/signup"
              style={{
                color: "var(--color-text)",
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              Create an account
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            fontSize: "var(--text-xs)",
            color: "var(--color-text-tertiary)",
            marginTop: "var(--space-8)",
          }}
        >
          © 2025 FlashFits. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
