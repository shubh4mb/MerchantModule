import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as apiLogin } from '../../api/auth';
import { AuthContext } from '../../context/AuthContext';
import './Login.css';

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
      console.log(merchant, token, 'merchant, token');
      if (!merchant || !token) throw new Error('Invalid credentials');

      // Update context and localStorage
      login(merchant, token);

      // Route based on activation status
      if (merchant.isActive) {
        navigate('/merchant/inventory');
      } else {
        // Assume they still need to complete the 3-stage setup
        localStorage.setItem("merchant_id", merchant.id);
        navigate('/merchant/register');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit} aria-label="Merchant login form">
        <h2 className="login-title">Merchant Sign in</h2>

        {error && <div className="login-error" role="alert">{error}</div>}

        <label className="login-label">
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            className="login-input"
            placeholder="you@business.com"
            autoComplete="email"
          />
        </label>

        <label className="login-label">
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            minLength={6}
            className="login-input"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </label>

        <button className="login-button" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="login-footer">
          New here? <Link to="/merchant/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
