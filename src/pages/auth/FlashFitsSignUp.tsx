import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerMerchant, sendEmailOtp, verifyEmailOtp } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import FlashFitsLogo from '../../assets/fevicon.png';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

const FlashFitsSignUp: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const isEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const isPhone = (value: string): boolean => {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(value);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!email || !phoneNumber) {
      setErrorMessage("Please enter both email and phone number.");
      return;
    }
    if (!isEmail(email)) {
      setErrorMessage("Enter a valid email address.");
      return;
    }
    if (!isPhone(phoneNumber)) {
      setErrorMessage("Enter a valid phone number.");
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    if (!password || password.length < 6) {
      setErrorMessage("Please enter a valid password (min 6 characters).");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const regRes = await registerMerchant({ 
        email, 
        phoneNumber, 
        password,
        identifier: email 
      });
      if (regRes?.token && regRes?.merchant?.id) {
        login(regRes.merchant, regRes.token, regRes.refreshToken);
        navigate("/merchant/register");
      } else {
        setErrorMessage("Registration succeeded, but could not log in automatically. Please log in.");
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Failed to register. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && email && !isLoading) {
      handleSubmit();
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

        {/* Signup Card */}
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
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            <div style={{ textAlign: "center", marginBottom: "var(--space-2)" }}>
              <h2
                style={{
                  fontSize: "var(--text-xl)",
                  fontWeight: 700,
                  color: "var(--color-text)",
                  letterSpacing: "-0.025em",
                }}
              >
                Create your account
              </h2>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-secondary)",
                  marginTop: "var(--space-1)",
                }}
              >
                Start selling on FlashFits
              </p>
            </div>

            <div>
              <label className="input-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="you@example.com"
                className="input"
              />
            </div>

            <div>
              <label className="input-label">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="+1234567890"
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
              <p className="input-hint">Minimum 6 characters</p>
            </div>

            <div>
              <label className="input-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="••••••••"
                  className="input"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="alert alert-danger">{errorMessage}</div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="btn btn-primary btn-lg"
              style={{ width: "100%" }}
            >
              {isLoading ? (
                <div className="spinner spinner-sm" style={{ borderTopColor: "white", borderColor: "rgba(255,255,255,0.3)" }} />
              ) : (
                'Continue'
              )}
            </button>

            <p
              style={{
                textAlign: "center",
                fontSize: "var(--text-sm)",
                color: "var(--color-text-secondary)",
              }}
            >
              Already have an account?{' '}
              <a
                href="/merchant/login"
                style={{
                  color: "var(--color-text)",
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                Sign in
              </a>
            </p>
          </div>
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

export default FlashFitsSignUp;
