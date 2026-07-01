import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerMerchant, sendEmailOtp, verifyEmailOtp } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import FlashFitsLogo from '../../assets/fevicon.webp';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { FloatingAssets } from '../../components/auth/FloatingAssets';

const FlashFitsSignUp: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>('');
  const [otpStep, setOtpStep] = useState<boolean>(false);
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
      await sendEmailOtp({ email, phoneNumber, password });
      localStorage.setItem("user_email", email);
      setOtpStep(true);
    } catch (error: any) {
      if (error.response?.status === 400) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Failed to send OTP. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (): Promise<void> => {
    if (!otp) {
      setErrorMessage("Please enter OTP.");
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      const email = localStorage.getItem("user_email");
      if (!email) {
        setErrorMessage("Email not found. Please restart sign up.");
        setOtpStep(false);
        setOtp('');
        return;
      }
      const res = await verifyEmailOtp({ email, otp });

      if (res?.token) {
        const regRes = await registerMerchant({ identifier: email, password });
        if (regRes?.merchant?.id) {
          login(regRes.merchant, res.token, res.refreshToken);
          navigate("/merchant/register");
        }
      }
    } catch (error: any) {
      setErrorMessage("Invalid or expired OTP. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && email && !isLoading) {
      otpStep ? handleVerifyOtp() : handleSubmit();
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: "var(--color-bg)",
        padding: "var(--space-4)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Floating Assets */}
      <FloatingAssets />

      <div className="w-full" style={{ maxWidth: "400px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div className="text-center animate-slideUp" style={{ marginBottom: "var(--space-8)" }}>
          <img
            src={FlashFitsLogo}
            alt="FlashFits Logo"
            style={{ margin: "0 auto", maxHeight: "48px" }}
            fetchPriority="high"
          />
        </div>

        {/* Signup Card */}
        <div
          className="animate-slideUp"
          style={{
            background: "rgba(255, 255, 255, 0.72)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-md)",
            padding: "var(--space-8)",
          }}
        >
          {!otpStep ? (
            /* Step 1: Credentials */
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
          ) : (
            /* Step 2: OTP Verification */
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
              <div style={{ textAlign: "center" }}>
                <h2
                  style={{
                    fontSize: "var(--text-xl)",
                    fontWeight: 700,
                    color: "var(--color-text)",
                    letterSpacing: "-0.025em",
                  }}
                >
                  Verify your email
                </h2>
                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-secondary)",
                    marginTop: "var(--space-1)",
                  }}
                >
                  We sent a 6-digit code to <strong style={{ color: "var(--color-text)" }}>{email}</strong>
                </p>
              </div>

              <div>
                <label className="input-label">Enter OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyPress={handleKeyPress}
                  placeholder="••••••"
                  maxLength={6}
                  className="input"
                  style={{
                    textAlign: "center",
                    fontSize: "var(--text-xl)",
                    letterSpacing: "0.5em",
                    fontWeight: 600,
                  }}
                />
              </div>

              {errorMessage && (
                <div className="alert alert-danger">{errorMessage}</div>
              )}

              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <button
                  onClick={() => {
                    setOtpStep(false);
                    setOtp('');
                    setErrorMessage('');
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.length !== 6}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {isLoading ? (
                    <div className="spinner spinner-sm" style={{ borderTopColor: "white", borderColor: "rgba(255,255,255,0.3)" }} />
                  ) : (
                    'Verify'
                  )}
                </button>
              </div>

              <p style={{ textAlign: "center", fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                Didn't receive it?{' '}
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-text)",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontFamily: "var(--font-family)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 500,
                  }}
                >
                  Resend OTP
                </button>
              </p>
            </div>
          )}
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
