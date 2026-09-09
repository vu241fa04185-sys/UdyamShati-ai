import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Sprout, AlertCircle, CheckCircle2 } from 'lucide-react';
import { translations } from '../../locales/translations';

export default function RegisterForm({ onRegisterSuccess, onSwitchToLogin, lang }) {
  const t = translations[lang] || translations.en;

  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required.';
    }

    const cleanMobile = formData.mobile.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      newErrors.mobile = 'Enter a valid 10-digit Indian mobile number.';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onRegisterSuccess({
        name: formData.fullName.trim(),
        mobile: formData.mobile.replace(/\D/g, ''),
        email: formData.email.trim(),
        loginTime: Date.now(),
        isAuthenticated: true,
        isDemo: false,
      });
    }, 400);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* HEADER */}
      <div className="text-center space-y-1">
        <div className="inline-flex w-10 h-10 rounded-2xl bg-forest items-center justify-center text-gold shadow-md mb-2 border border-gold/30">
          <Sprout className="w-5 h-5 text-gold" />
        </div>
        
        <p className="text-xs font-bold text-muted-text uppercase tracking-widest">
          {t.welcomeTitle || 'Welcome to UdyamSaarthi'}
        </p>
        
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-forest">
          {t.registerTitle || 'Create Your Account'}
        </h2>

        <p className="text-xs font-semibold text-forest/80 pt-1">
          {t.registerSubtitle || 'Start your journey from idea to enterprise.'}
        </p>
      </div>

      {/* REGISTRATION FORM */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        
        {/* FULL NAME */}
        <div>
          <label className="block text-xs font-bold text-dark-text uppercase tracking-wider mb-1">
            {t.fullNameLabel || 'Full Name'}
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder={t.fullNamePlaceholder || "Enter your full name"}
            className={`w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border ${
              errors.fullName ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
            } text-dark-text focus:border-forest focus:ring-2 focus:ring-forest/10 outline-none transition`}
            autoFocus
          />
          {errors.fullName && (
            <p className="text-[11px] font-bold text-red-600 mt-1 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.fullName}</span>
            </p>
          )}
        </div>

        {/* MOBILE NUMBER */}
        <div>
          <label className="block text-xs font-bold text-dark-text uppercase tracking-wider mb-1">
            {t.mobileLabel || 'Mobile Number'}
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-xs font-bold text-slate-500 border-r border-slate-300 pr-2">
              +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={formData.mobile}
              onChange={(e) => handleChange('mobile', e.target.value.replace(/\D/g, ''))}
              placeholder={t.mobilePlaceholder || "Enter your 10-digit mobile number"}
              className={`w-full pl-14 pr-3.5 py-2.5 text-sm font-semibold rounded-xl border ${
                errors.mobile ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
              } text-dark-text focus:border-forest focus:ring-2 focus:ring-forest/10 outline-none transition`}
            />
          </div>
          {errors.mobile && (
            <p className="text-[11px] font-bold text-red-600 mt-1 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.mobile}</span>
            </p>
          )}
        </div>

        {/* EMAIL ADDRESS (OPTIONAL) */}
        <div>
          <label className="block text-xs font-bold text-dark-text uppercase tracking-wider mb-1">
            {t.emailLabel || 'Email Address (Optional)'}
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder={t.emailPlaceholder || "Enter your email address"}
            className={`w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border ${
              errors.email ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
            } text-dark-text focus:border-forest focus:ring-2 focus:ring-forest/10 outline-none transition`}
          />
          {errors.email && (
            <p className="text-[11px] font-bold text-red-600 mt-1 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        {/* PASSWORD */}
        <div>
          <label className="block text-xs font-bold text-dark-text uppercase tracking-wider mb-1">
            {t.createPasswordLabel || 'Create Password'}
          </label>
          <div className="relative flex items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder={t.passwordPlaceholder || "Create a password"}
              className={`w-full pl-3.5 pr-10 py-2.5 text-sm font-semibold rounded-xl border ${
                errors.password ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
              } text-dark-text focus:border-forest focus:ring-2 focus:ring-forest/10 outline-none transition`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-slate-400 hover:text-forest transition"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] font-bold text-red-600 mt-1 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.password}</span>
            </p>
          )}
        </div>

        {/* CONFIRM PASSWORD */}
        <div>
          <label className="block text-xs font-bold text-dark-text uppercase tracking-wider mb-1">
            {t.confirmPasswordLabel || 'Confirm Password'}
          </label>
          <div className="relative flex items-center">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder={t.confirmPasswordPlaceholder || "Confirm your password"}
              className={`w-full pl-3.5 pr-10 py-2.5 text-sm font-semibold rounded-xl border ${
                errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
              } text-dark-text focus:border-forest focus:ring-2 focus:ring-forest/10 outline-none transition`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 text-slate-400 hover:text-forest transition"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-[11px] font-bold text-red-600 mt-1 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.confirmPassword}</span>
            </p>
          )}
        </div>

        {/* PRIMARY BUTTON */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 mt-2 rounded-xl bg-forest text-white text-sm font-bold hover:bg-deep-green transition shadow-md flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
        >
          {isSubmitting ? (
            <span>Creating Account...</span>
          ) : (
            <>
              <span>{t.registerBtn || 'Create Account'}</span>
              <ArrowRight className="w-4 h-4 text-gold" />
            </>
          )}
        </button>

      </form>

      {/* ALREADY HAVE ACCOUNT LINK */}
      <div className="text-center text-xs text-muted-text pt-1 border-t border-slate-200/60">
        <span>{t.alreadyHaveAccount || 'Already have an account?'} </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-extrabold text-forest hover:text-gold transition cursor-pointer"
        >
          {t.loginBtn || 'Login'}
        </button>
      </div>
    </div>
  );
}
