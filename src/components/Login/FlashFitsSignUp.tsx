import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import './FlashFitsSignUp.css';
import { registerMerchant, sendEmailOtp, verifyEmailOtp } from '../../api/auth'; // ✅ API imports
import FlashFitsLogo from '../../assets/fevicon.png';

const FlashFitsSignUp: React.FC = () => {
  const [identifier, setIdentifier] = useState<string>(''); // email OR phone
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [password, setPassword] = useState<string>(''); // ✅ Password input
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

    if (!password || password.length < 6) {
      setErrorMessage("Please enter a valid password (min 6 characters).");
      setIsLoading(false);
      return;
    }

    try {
      if (isEmailInput) {
        console.log('user_email', identifier);
        // ✅ send OTP and password together initially
        await sendEmailOtp({ email: identifier, password });
        localStorage.setItem("user_email", identifier);
        setOtpStep(true); // move to OTP screen
      } else {
        // Phone OTP implementation placeholder
        setErrorMessage("Phone sign-up is pending API support. Please use email.");
      }
    } catch (error: any) {
      console.error("OTP send failed:", error);
      if (error.response?.status === 400) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Failed to send OTP. Please try again.");
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

      if (res?.token) {
        // ✅ Now Register the Merchant with the gathered credentials
        const regRes = await registerMerchant({ identifier: email, password });

        if (regRes?.merchant?.id) {
          localStorage.setItem("merchant_id", regRes.merchant.id);
          localStorage.setItem("token", res.token); // ✅ Save JWT token
          navigate("/merchant/register");
        }
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

        {/* Signup Card */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-glass p-8 border border-glass-border">
          {!otpStep ? (
            /* Step 1: Identifier */
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="block text-white/80 text-sm font-medium ml-1">
                  Email or Phone Number
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="you@example.com or +1234567890"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white text-base transition-all focus:bg-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="block text-white/80 text-sm font-medium ml-1">
                  Create a Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white text-base transition-all focus:bg-white/10 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-white/20"
                />
              </div>

              {errorMessage && (
                <p className="text-red-400 text-sm animate-fade-in text-center">{errorMessage}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full mt-4 py-4 px-8 bg-primary-gradient text-white font-semibold rounded-xl shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          ) : (
            /* Step 2: OTP */
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white">Verify Your Email</h3>
                <p className="text-white/50 text-sm mt-1">
                  We sent a 6-digit code to <span className="text-white">{identifier}</span>
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="block text-white/80 text-sm font-medium ml-1">Enter OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyPress={handleKeyPress}
                  placeholder="••••••"
                  maxLength={6}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white text-2xl tracking-widest text-center transition-all focus:bg-white/10 focus:border-white/30 focus:outline-none placeholder:text-white/10"
                />
              </div>

              {errorMessage && (
                <p className="text-red-400 text-sm text-center animate-fade-in">{errorMessage}</p>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setOtpStep(false);
                    setOtp('');
                    setErrorMessage('');
                  }}
                  className="flex-1 py-3.5 px-6 rounded-xl font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.length !== 6}
                  className="flex-1 py-3.5 px-6 bg-primary-gradient text-white font-semibold rounded-xl shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Verify'
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-white/40">
                Didn't receive it?{' '}
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="text-white underline hover:text-white/80 transition-colors"
                >
                  Resend OTP
                </button>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-xs mt-8 animate-fade-in opacity-0 [animation-fill-mode:forwards] [animation-delay:1s]">
          © 2025 FlashFits. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default FlashFitsSignUp;
