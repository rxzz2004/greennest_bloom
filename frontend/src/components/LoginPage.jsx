import React, { useState } from 'react';
import { 
  Flower2, 
  Sparkles, 
  Building2, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  HelpCircle,
  KeyRound,
  RefreshCw,
  Send
} from 'lucide-react';
import { api } from '../api';
import { soundEffects } from '../utils/audio';

export default function LoginPage({ 
  onLoginSuccess, 
  onBackToStore,
  initialMode = 'login',
  initialUserType = 'individual',
  currentUser,
  isModal = false
}) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [userType, setUserType] = useState(initialUserType); // 'individual' or 'corporate'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form fields (pre-filled with currentUser if upgrading/registering as business)
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [companyName, setCompanyName] = useState(currentUser?.company_name || '');
  const [gstin, setGstin] = useState(currentUser?.gstin || '');
  const [address, setAddress] = useState(currentUser?.address || '');

  // OTP Verification state (used strictly for Password Reset)
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Send password reset code
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    setErrorMsg('');
    setOtpSending(true);
    try {
      const res = await api.forgotPassword(email.trim().toLowerCase());
      if (res.error) {
        setErrorMsg(res.error);
        soundEffects.playClick();
      } else {
        setOtpSent(true);
        soundEffects.playSuccessChime();
        setSuccessMsg(res.message || `Password reset code sent to ${email}`);
      }
    } catch (err) {
      setErrorMsg('Unable to dispatch reset email. Please verify backend connection.');
    } finally {
      setOtpSending(false);
    }
  };

  // Submit new password with reset code
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code sent to your email.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.resetPassword(email.trim().toLowerCase(), otp.trim(), newPassword);
      if (res.error) {
        setErrorMsg(res.error);
        soundEffects.playClick();
      } else {
        soundEffects.playSuccessChime();
        setSuccessMsg(res.message || 'Password reset successfully! You can now sign in.');
        setMode('login');
        setPassword(newPassword);
        setOtp('');
        setOtpSent(false);
      }
    } catch (err) {
      setErrorMsg('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign In submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      let submitEmail = (email || '').trim().toLowerCase();
      if (submitEmail === 'admin@greennestbloom' || submitEmail === 'admin') {
        submitEmail = 'admin@greennestbloom.com';
      }

      const res = await api.login({ email: submitEmail, password });
      if (res.error) {
        setErrorMsg(res.error);
        soundEffects.playClick();
      } else {
        soundEffects.playSuccessChime();
        setSuccessMsg(`Welcome back, ${res.user?.full_name}!`);
        setTimeout(() => {
          onLoginSuccess(res.user, res.token);
        }, 600);
      }
    } catch (err) {
      setErrorMsg('Unable to connect to login service. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration submission (direct, instant, no OTP blocking)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password || !fullName) {
      setErrorMsg('Please enter your full name, email address, and password.');
      soundEffects.playClick();
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      soundEffects.playClick();
      return;
    }

    if (userType === 'corporate' && !gstin) {
      setErrorMsg('GSTIN is required for verified corporate business accounts.');
      soundEffects.playClick();
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        phone: phone.trim(),
        user_type: userType,
        company_name: userType === 'corporate' ? companyName.trim() : undefined,
        gstin: userType === 'corporate' ? gstin.trim().toUpperCase() : undefined,
        address: address.trim()
      };

      const res = await api.register(payload);
      if (res.error) {
        setErrorMsg(res.error);
        soundEffects.playClick();
      } else {
        soundEffects.playSuccessChime();
        setSuccessMsg(
          res.upgraded 
            ? `Your business account has been verified! Welcome, ${res.user?.company_name || res.user?.full_name}!`
            : `Account created successfully! Signing you in as ${res.user?.full_name}...`
        );
        setTimeout(() => {
          onLoginSuccess(res.user, res.token);
        }, 700);
      }
    } catch (err) {
      setErrorMsg('Failed to complete registration. Please check all fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role={isModal ? 'dialog' : undefined}
      aria-modal={isModal ? 'true' : undefined}
      className={isModal
        ? 'fixed inset-0 z-50 min-h-screen bg-stone-950/60 backdrop-blur-sm flex flex-col justify-center overflow-y-auto py-6 px-4'
        : 'min-h-screen bg-[#fbf9f5] flex flex-col justify-between relative overflow-hidden py-10 px-4 sm:px-6 lg:px-8'}
    >
      
      {/* Subtle Botanical Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/50 rounded-full filter blur-3xl -z-10 pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-100/40 rounded-full filter blur-3xl -z-10 pointer-events-none transform -translate-x-1/3 translate-y-1/3"></div>

      {/* Top Header / Back Link */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between mb-6">
        <button
          onClick={() => {
            soundEffects.playClick();
            onBackToStore();
          }}
          className="flex items-center space-x-2 text-stone-600 hover:text-emerald-900 transition-colors text-xs font-semibold py-2 px-3 rounded-full hover:bg-white/80"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Botanical Store</span>
        </button>

        <div className="flex items-center space-x-1 text-xs text-stone-400 font-serif">
          <span>Green Nest Bloom</span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="max-w-md w-full mx-auto bg-white rounded-3xl shadow-xl shadow-stone-200/60 border border-stone-200/80 p-8 space-y-6">
        
        {/* Brand Header with Authentic Pink Lily */}
        <div className="text-center space-y-2">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500/20 via-emerald-800 to-teal-900 p-0.5 mx-auto shadow-xl shadow-pink-900/20 flex items-center justify-center">
            <img
              src="/pink_lily_bloom.jpg"
              alt="Green Nest Bloom Pink Lily"
              className="w-full h-full object-cover rounded-[14px] border border-pink-200/50"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            </div>
          </div>
          <h2 className="font-serif text-2xl font-bold text-emerald-950 tracking-tight">
            {mode === 'forgot_password'
              ? 'Reset Your Account Password'
              : mode === 'login' 
              ? 'Sign in to Your Account' 
              : userType === 'corporate' && currentUser
              ? 'Register Your Business Account'
              : userType === 'corporate'
              ? 'Corporate Wholesale Registration'
              : 'Create Your Botanical Account'}
          </h2>
          <p className="text-xs text-stone-500">
            {mode === 'forgot_password'
              ? 'Enter your registered email address to receive a secure 6-digit password reset code.'
              : mode === 'login' 
              ? 'Access bespoke fresh lily bouquets, corporate staging, and express delivery.' 
              : userType === 'corporate'
              ? 'Join Green Nest Bloom as a verified corporate partner for wholesale rates, event staging & GST tax invoicing.'
              : 'Join Green Nest Bloom for personalized floral curation & corporate orders.'}
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-bold text-stone-600">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setMode('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'login' 
                ? 'bg-white text-emerald-950 shadow-xs' 
                : 'hover:text-stone-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setMode('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'register' 
                ? 'bg-white text-emerald-950 shadow-xs' 
                : 'hover:text-stone-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-900 flex items-start space-x-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <span className="font-semibold block">{errorMsg}</span>
              {errorMsg.toLowerCase().includes('already registered') && mode === 'register' && (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className="inline-flex items-center space-x-1 font-bold text-rose-700 hover:text-rose-900 underline text-xs cursor-pointer pt-0.5"
                >
                  <span>Switch directly to Sign In with this email</span>
                  <ArrowRight className="w-3 h-3 inline" />
                </button>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORM: SIGN IN */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-stone-700">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setMode('forgot_password');
                    setErrorMsg('');
                    setSuccessMsg('');
                    setOtpSent(false);
                    setOtp('');
                  }}
                  className="text-[11px] text-emerald-700 hover:underline font-semibold cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center space-x-2 mt-2 disabled:opacity-60"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* FORM: FORGOT PASSWORD */}
        {mode === 'forgot_password' && (
          <div className="space-y-4 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
              <span className="font-bold text-stone-700">Account Recovery</span>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-[11px] text-emerald-800 hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back to Sign In</span>
              </button>
            </div>

            {!otpSent ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Enter Your Registered Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={otpSending || !email}
                  className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
                >
                  {otpSending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Reset Code to Your Email...</span>
                    </>
                  ) : (
                    <>
                      <span>Send 6-Digit Reset Code to Email</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-stone-700">
                    <label className="font-bold flex items-center space-x-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Enter 6-Digit Reset Code</span>
                    </label>
                    <span className="text-[10px] text-stone-500">Sent to {email}</span>
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit code"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-900 font-mono tracking-widest text-center text-sm font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Enter New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !otp || otp.length !== 6 || !newPassword || newPassword.length < 6}
                  className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
                >
                  <span>{loading ? 'Updating Password...' : 'Reset Password & Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* FORM: CREATE ACCOUNT (REGISTER) */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
            
            {/* Account Type Segmented Toggle */}
            <div>
              <label className="block font-bold text-stone-700 mb-1.5">Select Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setUserType('individual');
                  }}
                  className={`p-2.5 rounded-xl border flex items-center space-x-2 transition-all text-left ${
                    userType === 'individual'
                      ? 'border-emerald-700 bg-emerald-50/80 text-emerald-950 font-bold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="block text-xs leading-tight">Individual</span>
                    <span className="text-[10px] text-stone-500 font-normal">Personal Shopping</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setUserType('corporate');
                  }}
                  className={`p-2.5 rounded-xl border flex items-center space-x-2 transition-all text-left ${
                    userType === 'corporate'
                      ? 'border-indigo-700 bg-indigo-50/80 text-indigo-950 font-bold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="block text-xs leading-tight">Corporate</span>
                    <span className="text-[10px] text-stone-500 font-normal">Wholesale & Events</span>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Venisha Dsouza"
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800"
                />
              </div>
            </div>

            {/* Corporate Specific Fields */}
            {userType === 'corporate' && (
              <div className="space-y-3 p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                <div className="flex items-center space-x-1.5 text-indigo-900 font-bold text-[11px]">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Corporate Wholesale Verification</span>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Company / Organization Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. The Leela Palace Hospitality"
                    required={userType === 'corporate'}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">15-Digit GSTIN Number</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="29AABCL5544K1ZZ"
                    required={userType === 'corporate'}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono bg-white uppercase"
                  />
                  <span className="text-[10px] text-stone-500 block mt-0.5">Mandatory for GST tax invoices and wholesale volume discounts.</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    required
                    className="w-full pl-8 pr-7 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Delivery Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="Street address, city, pincode..."
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center space-x-2 mt-2 disabled:opacity-60"
            >
              <span>{loading ? 'Creating Account...' : userType === 'corporate' && currentUser ? 'Verify & Register as Business Partner' : 'Register & Start Shopping'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>

      {/* Footer Info */}
      <div className="max-w-md w-full mx-auto text-center mt-6 text-[11px] text-stone-400">
        Green Nest Bloom Floriculture Pvt. Ltd. • Protected by secure authentication
      </div>

    </div>
  );
}
