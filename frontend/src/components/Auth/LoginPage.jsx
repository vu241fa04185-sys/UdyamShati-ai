import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sprout, 
  AlertCircle, 
  UserCheck, 
  ShieldAlert, 
  Mail, 
  MailCheck, 
  KeyRound, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';
import RuralBrandHero from './RuralBrandHero';
import LanguageSelector from './LanguageSelector';
import RegisterForm from './RegisterForm';
import { authService } from '../../services/authService';
import { translations } from '../../locales/translations';

export default function LoginPage({ onLoginSuccess, lang, setLang }) {
  const t = translations[lang] || translations.en;

  const [view, setView] = useState('login'); // 'login' | 'register' | 'email_access'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleConfigError, setGoogleConfigError] = useState(false);

  // Email Access Verification state
  const [pendingEmail, setPendingEmail] = useState('');
  const [accessCode, setAccessCode] = useState(['', '', '', '', '', '']);
  const [previewCode, setPreviewCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verifySuccessMsg, setVerifySuccessMsg] = useState('');

  // Countdown timer for resending email access code
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Helper to detect if identifier is an email address
  const isEmailIdentifier = (val) => {
    if (!val || typeof val !== 'string') return false;
    const clean = val.trim();
    return clean.includes('@') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
  };

  // Handle Password Login Submission
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your mobile number or email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError('');
    setGoogleConfigError(false);

    // ============================================================
    // REQUIREMENT: IF LOGGING IN THROUGH EMAIL, DO NOT DIRECTLY
    // LOG IN! TAKE ACCESS FROM EMAIL VIA ACCESS CODE VERIFICATION.
    // ============================================================
    if (isEmailIdentifier(identifier)) {
      setIsSubmitting(true);
      const normalizedEmail = identifier.trim().toLowerCase();
      const res = await authService.sendEmailAccessCode(normalizedEmail, password);
      setIsSubmitting(false);

      if (res.status === 'SUCCESS') {
        setPendingEmail(normalizedEmail);
        setPreviewCode(res.accessCode || '');
        setAccessCode(['', '', '', '', '', '']);
        setResendTimer(30);
        setError('');
        setVerifySuccessMsg('');
        setView('email_access'); // Switch to email access verification screen
      } else {
        setError(res.message || 'Unable to authenticate email. Please check your credentials.');
      }
      return;
    }

    // For mobile numbers, direct credential authentication proceeds
    setIsSubmitting(true);
    const res = await authService.signInWithPassword(identifier, password);
    setIsSubmitting(false);

    if (res.status === 'SUCCESS') {
      onLoginSuccess(res.session);
    } else {
      setError(res.message || 'Login failed. Please check your credentials.');
    }
  };

  // Handle input for 6 individual access code digit boxes
  const handleDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const updated = [...accessCode];
      updated[index] = '';
      setAccessCode(updated);
      return;
    }

    // If user pasted a multi-digit string (e.g. 6 digits)
    if (cleanVal.length > 1) {
      const digits = cleanVal.slice(0, 6).split('');
      const updated = [...accessCode];
      digits.forEach((d, i) => {
        if (i < 6) updated[i] = d;
      });
      setAccessCode(updated);
      const nextFocus = Math.min(digits.length, 5);
      const el = document.getElementById(`access-code-digit-${nextFocus}`);
      if (el) el.focus();
      return;
    }

    const updated = [...accessCode];
    updated[index] = cleanVal[cleanVal.length - 1];
    setAccessCode(updated);

    // Auto-advance to next input
    if (index < 5) {
      const nextEl = document.getElementById(`access-code-digit-${index + 1}`);
      if (nextEl) nextEl.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !accessCode[index] && index > 0) {
      const prevEl = document.getElementById(`access-code-digit-${index - 1}`);
      if (prevEl) prevEl.focus();
    }
  };

  // One-click auto-fill access code from simulation card
  const handleAutoFillCode = () => {
    if (previewCode && previewCode.length === 6) {
      setAccessCode(previewCode.split(''));
      setError('');
    }
  };

  // Verify Email Access Code Submission
  const handleVerifyEmailAccess = async (e) => {
    e.preventDefault();
    const fullCode = accessCode.join('').trim();
    if (fullCode.length !== 6) {
      setError('Please enter the full 6-digit access code sent to your email.');
      return;
    }

    setIsVerifyingCode(true);
    setError('');

    const res = await authService.verifyEmailAccessCode(pendingEmail, fullCode);
    setIsVerifyingCode(false);

    if (res.status === 'SUCCESS') {
      setVerifySuccessMsg(t.emailAccessSuccess || 'Access authorized! Redirecting to your dashboard...');
      setTimeout(() => {
        onLoginSuccess(res.session);
      }, 500);
    } else {
      setError(res.message || t.emailAccessInvalidCode || 'Invalid access code. Please check your email or enter the code shown above.');
    }
  };

  // Resend Email Access Code
  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    setError('');
    setVerifySuccessMsg('');
    const res = await authService.sendEmailAccessCode(pendingEmail, password);
    if (res.status === 'SUCCESS') {
      setPreviewCode(res.accessCode || '');
      setAccessCode(['', '', '', '', '', '']);
      setResendTimer(30);
    } else {
      setError(res.message || 'Failed to resend access code. Please try again.');
    }
  };

  // Dedicated Google OAuth Handler via Google Identity Services
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');
    setGoogleConfigError(false);

    const res = await authService.signInWithGoogle();
    setIsGoogleLoading(false);

    if (res.status === 'UNCONFIGURED') {
      setGoogleConfigError(true);
      setError(res.message);
    } else if (res.status === 'SUCCESS') {
      onLoginSuccess(res.session);
    } else if (res.status === 'CANCELLED') {
      setError('Google sign-in was cancelled. Please try again.');
    } else {
      setError(res.message || "Google sign-in couldn't be completed. Please try again.");
    }
  };

  // Demo Login Handler (SIH Demonstration)
  const handleDemoLogin = async () => {
    const res = await authService.signInAsDemo();
    if (res.status === 'SUCCESS') {
      onLoginSuccess(res.session);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FCFBF7] flex flex-col lg:flex-row font-sans selection:bg-gold/30 relative">
      
      {/* LEFT SIDE — REALISTIC CINEMATIC RURAL HERO (~62% width on desktop) */}
      <div className="w-full lg:w-[62%] bg-forest">
        <RuralBrandHero lang={lang} />
      </div>

      {/* RIGHT SIDE — CLEAN WARM CREAM AUTHENTICATION PANEL (~38% width on desktop) */}
      <div className="w-full lg:w-[38%] bg-[#FCFBF7] p-6 sm:p-10 lg:p-12 flex flex-col justify-between relative z-10 border-l border-cream">
        
        {/* TOP RIGHT: LANGUAGE SELECTOR */}
        <div className="flex items-center justify-between lg:justify-end pb-4 border-b border-slate-200/60">
          <div className="lg:hidden flex items-center space-x-2">
            <Sprout className="w-5 h-5 text-forest" />
            <span className="font-black text-forest tracking-tight">UdyamSaarthi</span>
          </div>

          <LanguageSelector lang={lang} setLang={setLang} variant="dark" />
        </div>

        {/* CENTER AUTHENTICATION AREA */}
        <div className="my-auto py-4 max-w-md w-full mx-auto space-y-5">
          
          {/* VIEW 1: EMAIL ACCESS VERIFICATION VIEW */}
          {view === 'email_access' ? (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Back to Login Link */}
              <button
                type="button"
                onClick={() => { setView('login'); setError(''); setVerifySuccessMsg(''); }}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-forest hover:text-gold transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.emailAccessBackToLogin || 'Back to Login'}</span>
              </button>

              {/* Header */}
              <div className="text-center space-y-1">
                <div className="inline-flex w-12 h-12 rounded-2xl bg-forest items-center justify-center text-gold shadow-md mb-2 border border-gold/30 relative">
                  <MailCheck className="w-6 h-6 text-gold" />
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse" />
                </div>

                <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase tracking-widest mb-1">
                  {t.emailAccessPendingBadge || 'Email Access Required'}
                </div>

                <h2 className="text-2xl font-black tracking-tight text-forest leading-tight">
                  {t.emailAccessTitle || 'Email Access Verification'}
                </h2>

                <p className="text-xs text-muted-text max-w-sm mx-auto leading-relaxed pt-1">
                  {t.emailAccessSubtitle || 'For your account security, direct email login is blocked. Please enter the 6-digit access code sent to:'}
                </p>

                <p className="text-xs font-extrabold text-forest bg-forest/5 py-1 px-3 rounded-lg inline-block border border-forest/10 mt-1">
                  {pendingEmail}
                </p>
              </div>

              {/* Simulated Email Delivery Card for SIH Demonstration */}
              <div className="bg-gradient-to-br from-amber-50/90 via-white to-emerald-50/70 border border-gold/40 rounded-2xl p-3.5 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-lg bg-forest/10 flex items-center justify-center text-forest">
                      <Mail className="w-3.5 h-3.5 text-forest" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-forest tracking-tight">
                        {t.emailAccessPreviewTitle || 'Email Access Code Sent'}
                      </p>
                      <p className="text-[10px] text-muted-text">
                        From: access@udyam-saarthi.gov.in
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Inbox
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-text">
                      6-Digit Access Code:
                    </span>
                    <div className="text-lg font-black tracking-[0.25em] font-mono text-forest">
                      {previewCode || '------'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoFillCode}
                    className="px-3 py-1.5 rounded-lg bg-forest text-gold hover:bg-forest/90 text-xs font-extrabold border border-gold/40 shadow-xs transition active:scale-95 cursor-pointer flex items-center space-x-1"
                  >
                    <KeyRound className="w-3 h-3 text-gold" />
                    <span>{t.emailAccessAutoFill || 'Tap to Auto-fill'}</span>
                  </button>
                </div>
              </div>

              {/* Code Verification Form */}
              <form onSubmit={handleVerifyEmailAccess} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-dark-text uppercase tracking-wider mb-2.5 text-center">
                    {t.emailAccessCodeLabel || 'ENTER 6-DIGIT ACCESS CODE'}
                  </label>

                  {/* 6 Individual Code Digit Boxes */}
                  <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                    {accessCode.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`access-code-digit-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-mono font-black rounded-xl border-2 transition outline-none shadow-xs ${
                          digit 
                            ? 'border-forest bg-forest/5 text-forest' 
                            : 'border-slate-300 bg-white text-dark-text focus:border-forest focus:ring-2 focus:ring-forest/10'
                        }`}
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>
                </div>

                {/* Success Message */}
                {verifySuccessMsg && (
                  <div className="flex items-center space-x-2 text-xs font-semibold p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{verifySuccessMsg}</span>
                  </div>
                )}

                {/* Error Message */}
                {error && !verifySuccessMsg && (
                  <div className="flex items-start space-x-2 text-xs font-semibold p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={isVerifyingCode || Boolean(verifySuccessMsg)}
                  className="w-full py-3.5 rounded-xl bg-forest text-white text-base font-bold hover:bg-deep-green transition shadow-md flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99] disabled:opacity-70"
                >
                  {isVerifyingCode ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t.emailAccessVerifying || 'Verifying Access...'}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5 text-gold" />
                      <span>{t.emailAccessVerifyBtn || 'Verify & Access UdyamSaarthi'}</span>
                      <ArrowRight className="w-4 h-4 text-gold" />
                    </>
                  )}
                </button>

                {/* Resend Code & Back to Login Footer */}
                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendTimer > 0}
                    className={`font-extrabold flex items-center space-x-1.5 transition ${
                      resendTimer > 0 
                        ? 'text-muted-text cursor-not-allowed' 
                        : 'text-forest hover:text-gold cursor-pointer'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resendTimer > 0 ? '' : 'text-forest'}`} />
                    <span>
                      {resendTimer > 0 
                        ? `${t.emailAccessResendIn || 'Resend code in'} ${resendTimer}s` 
                        : (t.emailAccessResendBtn || 'Resend Access Code')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setView('login'); setError(''); setVerifySuccessMsg(''); }}
                    className="font-bold text-slate-500 hover:text-forest transition cursor-pointer"
                  >
                    {t.emailAccessBackToLogin || 'Back to Login'}
                  </button>
                </div>

              </form>
            </div>
          ) : view === 'register' ? (
            /* VIEW 2: REGISTER VIEW */
            <RegisterForm
              onRegisterSuccess={(session) => onLoginSuccess(session)}
              onSwitchToLogin={() => { setView('login'); setError(''); setGoogleConfigError(false); }}
              lang={lang}
            />
          ) : (
            /* VIEW 3: LOGIN VIEW */
            <div className="space-y-5 animate-fadeIn">
              
              {/* LOGIN BRAND MARK & WELCOME HEADER */}
              <div className="text-center space-y-1">
                <div className="inline-flex w-11 h-11 rounded-2xl bg-forest items-center justify-center text-gold shadow-md mb-2 border border-gold/30">
                  <Sprout className="w-6 h-6 text-gold" />
                </div>
                
                <p className="text-xs font-bold text-muted-text uppercase tracking-widest">
                  {t.welcomeTo || 'Welcome to'}
                </p>
                
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
                  <span className="text-forest">Udyam</span>
                  <span className="text-gold">Saarthi</span>
                </h2>

                <p className="text-xs font-semibold text-forest/80 pt-1">
                  {t.aiCompanionSubtitle || 'Your AI-Powered Business Companion'}
                </p>
              </div>

              {/* PASSWORD LOGIN FORM */}
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                
                {/* Mobile / Email Input */}
                <div>
                  <label className="block text-xs font-bold text-dark-text uppercase tracking-wider mb-1.5">
                    {t.mobileOrEmailLabel || 'MOBILE NUMBER / EMAIL'}
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => { setIdentifier(e.target.value); setError(''); setGoogleConfigError(false); }}
                    placeholder={t.mobileOrEmailPlaceholder || "Enter your mobile number or email"}
                    className="w-full px-4 py-3 text-sm font-semibold rounded-xl border border-slate-300 bg-white text-dark-text focus:border-forest focus:ring-2 focus:ring-forest/10 outline-none transition"
                    autoFocus
                  />
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-dark-text uppercase tracking-wider">
                      {t.passwordLabel || 'PASSWORD'}
                    </label>
                    <a 
                      href="#forgot" 
                      onClick={(e) => { e.preventDefault(); alert("For demo purposes, enter any password or click 'Continue as Demo'."); }} 
                      className="text-xs font-bold text-forest hover:text-gold transition"
                    >
                      {t.forgotPassword || 'Forgot Password?'}
                    </a>
                  </div>
                  
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); setGoogleConfigError(false); }}
                      placeholder={t.passwordPlaceholder || "Enter your password"}
                      className="w-full pl-4 pr-11 py-3 text-sm font-semibold rounded-xl border border-slate-300 bg-white text-dark-text focus:border-forest focus:ring-2 focus:ring-forest/10 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-forest transition"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Inline Error Message / Google Config Alert */}
                {error && (
                  <div className={`flex items-start space-x-2 text-xs font-semibold p-3 rounded-xl border ${
                    googleConfigError
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-red-50 border-red-200 text-red-600'
                  }`}>
                    {googleConfigError ? (
                      <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                    )}
                    <div>
                      <span>{error}</span>
                      {googleConfigError && (
                        <div className="mt-2 pt-2 border-t border-amber-200/80 flex items-center justify-between">
                          <span className="text-[11px] text-amber-800 font-medium">Or test using demo credentials:</span>
                          <button
                            type="button"
                            onClick={() => { setError(''); setGoogleConfigError(false); handleDemoLogin(); }}
                            className="text-[11px] font-bold text-forest hover:underline"
                          >
                            Use Demo Login
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Primary CTA Button: Login → */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-forest text-white text-base font-bold hover:bg-deep-green transition shadow-md flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>{t.loginBtn || 'Login'}</span>
                      <ArrowRight className="w-4 h-4 text-gold" />
                    </>
                  )}
                </button>

              </form>

              {/* DEMO LOGIN BUTTON (EXPLICIT SIH DEMO PROFILE) */}
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-forest border border-emerald-300 text-xs font-extrabold transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-forest" />
                <span>{t.continueAsDemo || 'Continue as Demo'}</span>
              </button>

              {/* SOCIAL LOGIN DIVIDER */}
              <div className="relative flex items-center justify-center my-3">
                <div className="w-full border-t border-slate-200" />
                <span className="absolute bg-[#FCFBF7] px-3 text-xs text-muted-text font-medium">
                  {t.orContinueWith || 'or'}
                </span>
              </div>

              {/* CONTINUE WITH GOOGLE BUTTON (REAL GOOGLE IDENTITY SERVICES HANDLER) */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className={`w-full py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition text-xs font-bold text-dark-text flex items-center justify-center space-x-3 shadow-xs ${
                  isGoogleLoading ? 'opacity-70 cursor-wait' : 'cursor-pointer'
                }`}
              >
                {isGoogleLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-forest border-t-transparent rounded-full animate-spin" />
                    <span>Signing in with Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>{t.continueWithGoogle || 'Continue with Google'}</span>
                  </>
                )}
              </button>

              {/* CREATE ACCOUNT LINK */}
              <div className="text-center text-xs text-muted-text pt-2">
                <span>{t.dontHaveAccount || "Don't have an account?"} </span>
                <button
                  type="button"
                  onClick={() => { setView('register'); setError(''); setGoogleConfigError(false); }}
                  className="font-extrabold text-forest hover:text-gold transition cursor-pointer"
                >
                  {t.createAccount || 'Create Account'}
                </button>
              </div>

            </div>
          )}

        </div>

        {/* BOTTOM DECORATIVE PRODUCT PRINCIPLE PANEL */}
        <div className="pt-3 border-t border-slate-200/60">
          <div className="bg-cream/90 border border-gold/30 rounded-2xl p-3 flex items-center space-x-3">
            <div className="w-7 h-7 rounded-full bg-forest/10 flex items-center justify-center text-forest shrink-0">
              <Sprout className="w-3.5 h-3.5 text-forest" />
            </div>
            <p className="text-xs font-bold text-forest leading-tight">
              {t.reassuranceLine1 || 'Simple. Local. Built for a stronger India.'}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
