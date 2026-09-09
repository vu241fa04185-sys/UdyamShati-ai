import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Sprout, AlertCircle, UserCheck, ShieldAlert } from 'lucide-react';
import RuralBrandHero from './RuralBrandHero';
import LanguageSelector from './LanguageSelector';
import RegisterForm from './RegisterForm';
import { authService } from '../../services/authService';
import { translations } from '../../locales/translations';

export default function LoginPage({ onLoginSuccess, lang, setLang }) {
  const t = translations[lang] || translations.en;

  const [view, setView] = useState('login'); // 'login' | 'register'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleConfigError, setGoogleConfigError] = useState(false);

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

    setIsSubmitting(true);
    setError('');

    const res = await authService.signInWithPassword(identifier, password);
    setIsSubmitting(false);

    if (res.status === 'SUCCESS') {
      onLoginSuccess(res.session);
    } else {
      setError(res.message || 'Login failed. Please check your credentials.');
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
      // Show explicit configuration message - DO NOT silently authenticate or enter dashboard!
      setGoogleConfigError(true);
      setError(res.message);
    } else if (res.status === 'SUCCESS') {
      onLoginSuccess(res.session);
    } else if (res.status === 'CANCELLED') {
      setError('Google sign-in was cancelled. Please try again.');
    } else {
      setError(res.message || 'Google sign-in couldn\'t be completed. Please try again.');
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
          
          {view === 'register' ? (
            /* REGISTER VIEW */
            <RegisterForm
              onRegisterSuccess={(session) => onLoginSuccess(session)}
              onSwitchToLogin={() => { setView('login'); setError(''); setGoogleConfigError(false); }}
              lang={lang}
            />
          ) : (
            /* LOGIN VIEW (NO MOBILE OTP TAB STRIP) */
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
                    <span>Logging in...</span>
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

        {/* BOTTOM DECORATIVE PRODUCT PRINCIPLE PANEL (NO INSPIRATIONAL QUOTES) */}
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
