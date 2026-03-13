import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
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
    if (!email || !password || loading) return;
    
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
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0a] overflow-hidden font-inter selection:bg-white selection:text-black">
      {/* Left Side: Branding & Experience */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary-gradient border-r border-white/5">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/5 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] bg-white/5 rounded-full blur-[150px] animate-pulse delay-[2000ms]"></div>
          {/* Animated Mesh Grid */}
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
              The Future of <span className="text-white/40">Merchant</span> Commerce.
            </h1>
            <p className="text-xl text-white/50 leading-relaxed max-w-md animate-step-in [animation-delay:0.6s]">
              Empowering merchants with lightning-fast tools, seamless inventory management, and premium analytics.
            </p>

            <div className="grid grid-cols-1 gap-6 pt-10 animate-fade-in [animation-delay:0.8s]">
              {[
                { icon: <Zap className="w-5 h-5" />, text: "Real-time Order Updates" },
                { icon: <ShieldCheck className="w-5 h-5" />, text: "Secure Payout Protection" },
                { icon: <CheckCircle2 className="w-5 h-5" />, text: "Advanced Inventory Suite" }
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
            © 2025 FLASHFITS PORTAL • ALL SYSTEMS OPERATIONAL
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><defs><pattern id=%22grain%22 width=%22100%22 height=%22100%22 patternUnits=%22userSpaceOnUse%22><circle cx=%2250%22 cy=%2250%22 r=%220.5%22 fill=%22rgba(255,255,255,0.05)%22/></pattern></defs><rect width=%22100%22 height=%22100%22 fill=%22url(%23grain)%22/></svg>')] opacity-30 pointer-events-none"></div>

        <div className="w-full max-w-md space-y-10 animate-form-in">
          {/* Mobile Logo Only */}
          <div className="lg:hidden text-center mb-10">
            <img src={FlashFitsLogo} alt="FlashFits Logo" className="w-40 mx-auto" />
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl font-bold text-white tracking-tight">Welcome back</h2>
            <p className="text-white/40 font-medium">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-white/60 ml-1 uppercase tracking-widest">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="name@business.com"
                  required
                  className="w-full bg-[#151515] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white font-medium transition-all focus:bg-[#1a1a1a] focus:border-white/20 focus:outline-none focus:ring-4 focus:ring-white/[0.02] placeholder:text-white/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-white/60 uppercase tracking-widest">Password</label>
                <Link to="/merchant/forgot-password" title="Feature coming soon" className="text-xs font-bold text-white/40 hover:text-white transition-colors">Forgot password?</Link>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors">
                  <Lock className="w-5 h-5  text-gray-400" />
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
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black py-4 px-6 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-black/20 border-t-black rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign in to Dashboard</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-white/40 font-medium">
            Don't have an account? <Link to="/merchant/signup" className="text-white hover:underline transition-all">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

