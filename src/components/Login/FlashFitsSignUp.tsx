import React, { useState } from 'react';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import './FlashFitsSignUp.css';
import { registerEmail, sendEmailOtp, verifyEmailOtp } from '../../api/auth'; // ✅ API imports

const FlashFitsSignUp: React.FC = () => {
  const [identifier, setIdentifier] = useState<string>(''); // email OR phone
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [otp, setOtp] = useState<string>(''); // ✅ OTP input
  const [otpStep, setOtpStep] = useState<boolean>(false); // ✅ toggle between identifier & otp
  const navigate = useNavigate();

  // ✅ Validation helpers
  const isEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const isPhone = (value: string): boolean => {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(value);
  };

  // 📧📱 Step 1 → Send OTP (for email) OR Register phone
  const handleSubmit = async (): Promise<void> => {
    if (!identifier) {
      setErrorMessage("Please enter your email or phone number.");
      return;
    }

    const isEmailInput = isEmail(identifier);
    const isPhoneInput = isPhone(identifier);

    if (!isEmailInput && !isPhoneInput) {
      setErrorMessage("Enter a valid email or phone number.");
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // let res;
      if (isEmailInput) {
        console.log('user_email');
        // ✅ send OTP first
        await sendEmailOtp({ email: identifier });
        localStorage.setItem("user_email", identifier);
        setOtpStep(true); // move to OTP screen
      } 
    } catch (error: any) {
      console.error("Registration failed:", error);
      if (error.response?.status === 400) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 📧 Step 2 → Verify OTP for email
const handleVerifyOtp = async (): Promise<void> => {
  if (!otp) {
    setErrorMessage("Please enter OTP.");
    return;
  }
  setIsLoading(true);
  setErrorMessage('');
  try {
    const email = localStorage.getItem("user_email"); // ✅ correct email
    const res = await verifyEmailOtp({ email, otp });

    if (res?.merchant?._id) {
      localStorage.setItem("merchant_id", res.merchant._id);
      localStorage.setItem("token", res.token); // ✅ Save JWT token
      navigate("/merchant/register");
    }
  } catch (error: any) {
    console.error("OTP verification failed:", error);
    setErrorMessage("Invalid or expired OTP. Try again.");
  } finally {
    setIsLoading(false);
  }
};

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && identifier && !isLoading) {
      otpStep ? handleVerifyOtp() : handleSubmit();
    }
  };

  // 🟢 Handle Google Success
  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      const decoded: any = jwtDecode(credentialResponse.credential);
      console.log('Google User Info:', decoded);

      setGoogleUser(decoded);

      try {
        const res = await registerEmail({ email: decoded.email });
        localStorage.setItem('merchant_id', res.merchant._id);
        localStorage.setItem('user_email', decoded.email);
        localStorage.setItem('user_name', decoded.name);
        navigate("/merchant/register");
      } catch (error) {
        console.error('Google signup failed:', error);
      }
    }
  };

  return (
    <div className="signup-container">
      {/* Left Hero Section */}
      <div className="hero-section">
        <div className="background-pattern">
          <div className="pattern-circle circle-1"></div>
          <div className="pattern-circle circle-2"></div>
          <div className="pattern-circle circle-3"></div>
        </div>

        <div className="hero-content">
          <div className="hero-logo">
            <div className="logo-container">
              <div className="logo-icon">
                <span className="logo-text">F</span>
              </div>
              <span className="brand-name">FlashFits</span>
            </div>
          </div>

          <div className="hero-heading">
            <h1 className="main-title">
              Join <span className="highlight-text">50,000+</span> Fashion Lovers
              <br />
              who Trust FlashFits for their
              <br />
              <span className="highlight-text">Style Journey</span>
            </h1>
          </div>

          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon">
                <svg className="checkmark" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="feature-text">Lightning-Fast Delivery</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg className="checkmark" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="feature-text">Curated Fashion Collections</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg className="checkmark" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="feature-text">AI-Powered Style Recommendations</span>
            </div>
          </div>

          <div className="fashion-elements">
            <div className="fashion-grid">
              <div className="fashion-card card-1"></div>
              <div className="fashion-card card-2"></div>
              <div className="fashion-card card-3"></div>
              <div className="fashion-card card-4"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="form-section">
        <div className="form-container">
          <div className="form-header">
            <h2 className="form-title">Welcome to FlashFits</h2>
            <h3 className="form-subtitle">Get started with your</h3>
            <h3 className="form-subtitle">email or phone number</h3>
          </div>

          {/* Email/Phone Sign Up */}
          <div className="signup-form">
            {!otpStep ? (
              <>
                <div className="input-container">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your email or phone number"
                    className="email-input"
                    disabled={isLoading}
                  />
                  {errorMessage && <p className="error-text">{errorMessage}</p>}
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !identifier}
                  className={`continue-button ${(isLoading || !identifier) ? 'disabled' : ''}`}
                >
                  {isLoading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <span>Getting Started...</span>
                    </div>
                  ) : (
                    'Continue'
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="input-container">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter OTP"
                    className="email-input"
                    disabled={isLoading}
                  />
                  {errorMessage && <p className="error-text">{errorMessage}</p>}
                </div>
                <button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || !otp}
                  className={`continue-button ${(isLoading || !otp) ? 'disabled' : ''}`}
                >
                  {isLoading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    'Verify OTP'
                  )}
                </button>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="divider">
            <div className="divider-line"></div>
            <span className="divider-text">or</span>
            <div className="divider-line"></div>
          </div>

          {/* ✅ Google Sign In */}
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              console.log('Google Login Failed');
            }}
          />

          {/* Show user info if logged in */}
          {googleUser && (
            <div className="google-user-info">
              <p>Welcome {googleUser.name}</p>
              <button
                onClick={() => {
                  googleLogout();
                  setGoogleUser(null);
                  localStorage.removeItem('user_email');
                  localStorage.removeItem('user_name');
                  localStorage.removeItem('merchant_id');
                }}
              >
                Logout
              </button>
            </div>
          )}

          <p className="terms-text">
            By continuing, you agree to our{' '}
            <a href="#" className="terms-link">privacy policy</a>{' '}
            and{' '}
            <a href="#" className="terms-link">terms of service</a>
          </p>

          <p className="signin-text">
            Already have an account?{' '}
            <a href="#" className="signin-link">Sign In</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FlashFitsSignUp;
