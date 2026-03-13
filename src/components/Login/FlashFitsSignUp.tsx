import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Phone, ArrowRight, CheckCircle2, ShieldCheck, Zap, KeyRound } from 'lucide-react';
import { registerMerchant, sendEmailOtp, verifyEmailOtp } from '../../api/auth';
import FlashFitsLogo from '../../assets/fevicon.png';

const FlashFitsSignUp: React.FC = () => {
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [otpStep, setOtpStep] = useState<boolean>(false);
  const navigate = useNavigate();

  const isEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isPhone = (value: string): boolean => /^\+?[0-9]{10,15}$/.test(value);

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

    if (!password || password.length < 6) {
      setErrorMessage("Please enter a valid password (min 6 characters).");
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      if (isEmailInput) {
        await sendEmailOtp({ email: identifier, password });
        localStorage.setItem("user_email", identifier);
        setOtpStep(true);
      } else {
        setErrorMessage("Phone sign-up is pending API support. Please use email.");
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || "Failed to send OTP. Please try again.");
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
          localStorage.setItem("merchant_id", regRes.merchant.id);
          localStorage.setItem("token", res.token);
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
    if (e.key === 'Enter' && !isLoading) {
      otpStep ? handleVerifyOtp() : handleSubmit();
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0a] overflow-hidden font-inter selection:bg-white selection:text-black">
      {/* Left Side: Branding & Merchant Experience */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary-gradient border-r border-white/5">
        <div className="absolute inset-0">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/5 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] bg-white/5 rounded-full blur-[150px] animate-pulse delay-[2000ms]"></div>
          <div className="absolute inset-0 opacity-[0.15]" 
               style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`, backgroundSize: '40px 40px' }}>
          </div>
        </div>

        <div className="relative z-10 flex flex-col justify-between w-full h-full p-16">
          <div className="animate-logo-in">
             <img src={FlashFitsLogo} alt="FlashFits Logo" className="w-56 h-auto drop-shadow-2xl" />
          </div>

          <div className="max-w-lg space-y-8">
            <h1 className="text-6xl font-black text-white leading-[1.1] tracking-tight animate-title-in">
              Become a <span className="text-white/40">FlashFits</span> Partner.
            </h1>
            <p className="text-xl text-white/50 leading-relaxed max-w-md animate-step-in [animation-delay:0.6s]">
              Join the ecosystem that scales with you. Lightning-fast setup, zero hidden fees, and premium logistics.
            </p>

            <div className="grid grid-cols-1 gap-6 pt-10 animate-fade-in [animation-delay:0.8s]">
              {[
                { icon: <Zap className="w-5 h-5" />, text: "Instant Storefront Activation" },
                { icon: <ShieldCheck className="w-5 h-5" />, text: "Global Compliance & Security" },
                { icon: <CheckCircle2 className="w-5 h-5" />, text: "24/7 Merchant Support" }
              ].map((item, id) => (
                <div key={id} className="flex items-center gap-4 text-white/70 group cursor-default">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 transition-all duration-300 group-hover:bg-white/15 group-hover:border-white/20">
                    {item.icon}
                  </div>
                  <span className="font-medium tracking-wide text-lg">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-sm text-white/20 font-medium tracking-widest animate-fade-in [animation-delay:1s]">
            © 2025 FLASHFITS PORTAL • BUILD YOUR EMPIRE
          </div>
        </div>
      </div>

      {/* Right Side: Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><defs><pattern id=%22grain%22 width=%22100%22 height=%22100%22 patternUnits=%22userSpaceOnUse%22><circle cx=%2250%22 cy=%2250%22 r=%220.5%22 fill=%22rgba(255,255,255,0.05)%22/></pattern></defs><rect width=%22100%22 height=%22100%22 fill=%22url(%23grain)%22/></svg>')] opacity-30 pointer-events-none"></div>

        <div className="w-full max-w-md space-y-10 animate-form-in">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
            <img src={FlashFitsLogo} alt="FlashFits Logo" className="w-40 mx-auto" />
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl font-bold text-white tracking-tight">
              {otpStep ? "Verify Identity" : "Create Merchant Account"}
            </h2>
            <p className="text-white/40 font-medium">
              {otpStep ? `We've sent a code to ${identifier}` : "Start your journey today with premium commerce tools."}
            </p>
          </div>

          <div className="space-y-6">
            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-shake">
                {errorMessage}
              </div>
            )}

            {!otpStep ? (
              /* Step 1: Credentials */
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-white/60 ml-1 uppercase tracking-widest">Email or Phone</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors">
                      {isPhone(identifier) ? <Phone className="w-5 h-5 text-gray-400" /> : <Mail className="w-5 h-5 text-gray-400" />}
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="name@business.com"
                      required
                      className="w-full bg-[#151515] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white font-medium transition-all focus:bg-[#1a1a1a] focus:border-white/20 focus:outline-none focus:ring-4 focus:ring-white/[0.02] placeholder:text-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-white/60 ml-1 uppercase tracking-widest">Create Password</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#151515] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white font-medium transition-all focus:bg-[#1a1a1a] focus:border-white/20 focus:outline-none focus:ring-4 focus:ring-white/[0.02] placeholder:text-white/10"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full bg-white text-black py-4 px-6 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-3 border-black/20 border-t-black rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Continue Application</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Step 2: OTP Verification */
              <div className="space-y-8 animate-fade-in">
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className="w-full bg-[#151515] border border-white/5 rounded-2xl px-12 py-6 text-white text-3xl font-black tracking-[0.5em] text-center transition-all focus:bg-[#1a1a1a] focus:border-white/20 focus:outline-none focus:ring-4 focus:ring-white/[0.02] placeholder:text-lg placeholder:font-bold placeholder:tracking-normal placeholder:text-white/10"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => { setOtpStep(false); setOtp(''); setErrorMessage(''); }}
                    className="flex-1 py-4 px-6 rounded-2xl font-bold bg-white/5 text-white/60 border border-white/5 hover:bg-white/10 hover:text-white transition-all"
                  >
                    Change Details
                  </button>
                  <button
                    onClick={handleVerifyOtp}
                    disabled={isLoading || otp.length !== 6}
                    className="flex-[2] bg-white text-black py-4 px-6 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-3 border-black/20 border-t-black rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Verify & Sign Up</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full text-center text-sm font-bold text-white/30 hover:text-white transition-colors"
                >
                  Didn't receive a code? Resend OTP
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-white/40 font-medium">
            Already have an account? <Link to="/merchant/login" className="text-white hover:underline transition-all">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FlashFitsSignUp;
