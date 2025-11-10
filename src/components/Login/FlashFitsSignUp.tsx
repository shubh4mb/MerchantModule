import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
// import './FlashFitsSignUp.css';
import { registerEmail, sendEmailOtp, verifyEmailOtp } from '../../api/auth'; // ✅ API imports
import FlashFitsLogo  from '../../assets/fevicon.png';

const FlashFitsSignUp: React.FC = () => {
  const [identifier, setIdentifier] = useState<string>(''); // email OR phone
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [_googleUser, setGoogleUser] = useState<any>(null);
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
        console.log('user_email', identifier);
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
      if (!email) {
        setErrorMessage("Email not found. Please restart sign up.");
        setOtpStep(false);
        setOtp('');
        return;
      }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-900 to-white-400 p-4 overflow-hidden relative">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gray-700 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gray-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gray-800 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center !m-2 animate-fade-in">
          <img src={FlashFitsLogo} alt="FlashFits Logo" />
          </div>

        {/* Signup Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-gray-700 rounded-2xl shadow-2xl !p-8 animate-slide-up">
          {!otpStep ? (
            /* Step 1: Identifier */
            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium !mb-2 animate-fade-in">
                  Email or Phone Number
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="you@example.com or +1234567890"
                  className="w-full !px-4 !py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300"
                />
              </div>

              {errorMessage && (
                <p className="text-red-400 text-sm animate-fade-in">{errorMessage}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full !mt-4 !p-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white font-semibold rounded-lg shadow-lg hover:from-gray-600 hover:to-gray-800 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  'Continue'
                )}
              </button>

              <div className="relative !my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="!px-4 bg-gray-900/50 text-gray-400">or</span>
                </div>
              </div>

              {/* Google Login */}
              <div className="flex justify-center">
                <div className="w-full max-w-xs">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setErrorMessage('Google sign-in failed.')}
                    useOneTap
                    theme="filled_black"
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: OTP */
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white">Verify Your Email</h3>
                <p className="text-gray-400 text-sm !mt-1">
                  We sent a 6-digit code to <span className="text-gray-200">{identifier}</span>
                </p>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium !mb-2">Enter OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyPress={handleKeyPress}
                  placeholder="••••••"
                  maxLength={6}
                  className="w-full !px-4 !py-3 text-center text-2xl tracking-widest bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300"
                />
              </div>

              {errorMessage && (
                <p className="text-red-400 text-sm text-center animate-fade-in">{errorMessage}</p>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setOtpStep(false);
                    setOtp('');
                    setErrorMessage('');
                  }}
                  className="flex-1 !py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-all duration-300"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.length !== 6}
                  className="flex-1 !py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white font-semibold rounded-lg shadow-lg hover:from-gray-600 hover:to-gray-800 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    'Verify'
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-gray-500">
                Didn't receive it?{' '}
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="text-gray-300 underline hover:text-white transition"
                >
                  Resend OTP
                </button>
              </p>
            </div>
          )}
        </div>


        {/* Footer */}
        <p className="text-center text-gray-500 text-xs !mt-8 animate-fade-in animation-delay-1000">
          © 2025 FlashFits. All rights reserved.
        </p>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        .animate-slide-up {
          animation: slide-up 0.7s ease-out forwards;
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 4s ease infinite;
        }
        .animation-delay-500 {
          animation-delay: 0.5s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default FlashFitsSignUp;
