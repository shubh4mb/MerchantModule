import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../../api/auth';
import FlashFitsLogo from '../../assets/fevicon.webp';
import { Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle2, Mail, ShieldCheck } from 'lucide-react';
import { FloatingAssets } from '../../components/auth/FloatingAssets';

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setStep(2);
      setResendTimer(60);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || err.response?.data?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp.trim()) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      });
      setStep(3);
    } catch (err: any) {
      setError(err.message || err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: 'var(--color-bg)',
        padding: 'var(--space-4)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <FloatingAssets />

      <div className="w-full" style={{ maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div className="text-center animate-slideUp" style={{ marginBottom: 'var(--space-8)' }}>
          <img
            src={FlashFitsLogo}
            alt="FlashFits Logo"
            style={{ margin: '0 auto', maxHeight: '48px' }}
            fetchPriority="high"
          />
        </div>

        {/* Card */}
        <div
          className="animate-slideUp"
          style={{
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
            padding: 'var(--space-8)',
          }}
        >
          {/* Step 1: Enter Email */}
          {step === 1 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-4)',
                    color: 'var(--color-primary, #6366F1)',
                  }}
                >
                  <KeyRound size={24} />
                </div>
                <h2
                  style={{
                    fontSize: 'var(--text-xl)',
                    fontWeight: 700,
                    color: 'var(--color-text)',
                    letterSpacing: '-0.025em',
                  }}
                >
                  Forgot password?
                </h2>
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-secondary)',
                    marginTop: 'var(--space-1)',
                  }}
                >
                  No worries, enter your merchant email and we’ll send you a reset code.
                </p>
              </div>

              {error && (
                <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                <div>
                  <label className="input-label">Merchant Email</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="merchant@flashfits.com"
                      required
                      className="input"
                      style={{ paddingLeft: '38px' }}
                    />
                    <Mail
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--color-text-secondary)',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: 'var(--space-2)' }}
                >
                  {loading ? (
                    <div className="spinner spinner-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                  ) : (
                    'Send Reset Code'
                  )}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
                <Link
                  to="/merchant/login"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-secondary)',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  <ArrowLeft size={16} /> Back to Sign In
                </Link>
              </div>
            </div>
          )}

          {/* Step 2: Enter OTP & New Password */}
          {step === 2 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-4)',
                    color: '#10B981',
                  }}
                >
                  <ShieldCheck size={24} />
                </div>
                <h2
                  style={{
                    fontSize: 'var(--text-xl)',
                    fontWeight: 700,
                    color: 'var(--color-text)',
                    letterSpacing: '-0.025em',
                  }}
                >
                  Set new password
                </h2>
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-secondary)',
                    marginTop: 'var(--space-1)',
                  }}
                >
                  We sent a 6-digit OTP code to <br />
                  <strong style={{ color: 'var(--color-text)' }}>{email}</strong>{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary, #6366F1)',
                      fontSize: 'var(--text-xs)',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                      marginLeft: '4px',
                    }}
                  >
                    Change
                  </button>
                </p>
              </div>

              {error && (
                <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label className="input-label">6-Digit Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    required
                    className="input"
                    style={{
                      textAlign: 'center',
                      fontSize: 'var(--text-lg)',
                      letterSpacing: '6px',
                      fontWeight: 700,
                    }}
                  />
                </div>

                <div>
                  <label className="input-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
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

                <div>
                  <label className="input-label">Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      required
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Didn't receive code?</span>
                  <button
                    type="button"
                    disabled={!canResend || loading}
                    onClick={() => handleSendOtp()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: canResend ? 'var(--color-primary, #6366F1)' : 'var(--color-text-tertiary)',
                      cursor: canResend ? 'pointer' : 'not-allowed',
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: 'var(--space-2)' }}
                >
                  {loading ? (
                    <div className="spinner spinner-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                  ) : (
                    'Update Password'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Step 3: Success State */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                  color: '#10B981',
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <h2
                style={{
                  fontSize: 'var(--text-xl)',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  letterSpacing: '-0.025em',
                }}
              >
                Password Updated!
              </h2>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  marginTop: 'var(--space-2)',
                  marginBottom: 'var(--space-6)',
                  lineHeight: '1.5',
                }}
              >
                Your merchant account password has been reset successfully. You can now sign in with your new credentials.
              </p>

              <button
                type="button"
                onClick={() => navigate('/merchant/login')}
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
              >
                Sign In Now
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: 'center',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-tertiary)',
            marginTop: 'var(--space-8)',
          }}
        >
          © 2025 FlashFits. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
