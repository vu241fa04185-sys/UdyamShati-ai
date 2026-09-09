import React, { useState } from 'react';
import { 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  Bell, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  UserCheck 
} from 'lucide-react';
import { authService } from '../services/authService';
import { translations } from '../locales/translations';

export default function SettingsView({ 
  auth, 
  profile, 
  notificationSettings, 
  onUpdateNotificationSettings, 
  language = 'en' 
}) {
  const t = translations[language] || translations.en;

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState(null);

  // Notifications state
  const [barEnabled, setBarEnabled] = useState(notificationSettings?.barNotifications ?? true);
  const [emailEnabled, setEmailEnabled] = useState(notificationSettings?.emailNotifications ?? true);
  const [notifSavedMsg, setNotifSavedMsg] = useState(false);

  const initialEmail = auth?.user?.email || profile?.email || 'kisan@sih.gov.in';
  const [notificationEmail] = useState(initialEmail);

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: '', color: 'bg-stone-200' };
    if (pass.length < 6) return { score: 1, text: 'Too short (min 6)', color: 'bg-rose-500' };
    let score = 2;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    
    if (score <= 2) return { score: 2, text: 'Moderate', color: 'bg-amber-500' };
    if (score <= 3) return { score: 3, text: 'Good', color: 'bg-emerald-500' };
    return { score: 4, text: 'Strong', color: 'bg-teal-600' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!oldPassword.trim()) {
      setPasswordStatus({
        type: 'error',
        message: t.oldPasswordRequired || 'Please enter your current password.'
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({
        type: 'error',
        message: t.passwordLengthError || 'New password must be at least 6 characters long.'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: 'error',
        message: t.passwordMismatch || 'New passwords do not match. Please verify.'
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await authService.changePassword(oldPassword, newPassword);
      if (res.status === 'SUCCESS') {
        setPasswordStatus({
          type: 'success',
          message: t.passwordChangedSuccess || 'Password changed successfully! Your credentials are now updated.'
        });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordStatus({
          type: 'error',
          message: res.message || 'Failed to change password. Please check your current password.'
        });
      }
    } catch (err) {
      setPasswordStatus({
        type: 'error',
        message: 'An unexpected error occurred while updating your password.'
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleToggleBar = (val) => {
    setBarEnabled(val);
    const updated = {
      barNotifications: val,
      emailNotifications: emailEnabled
    };
    authService.saveNotificationSettings(updated);
    if (onUpdateNotificationSettings) {
      onUpdateNotificationSettings(updated);
    }
    setNotifSavedMsg(true);
    setTimeout(() => setNotifSavedMsg(false), 2500);
  };

  const handleToggleEmail = (val) => {
    setEmailEnabled(val);
    const updated = {
      barNotifications: barEnabled,
      emailNotifications: val
    };
    authService.saveNotificationSettings(updated);
    if (onUpdateNotificationSettings) {
      onUpdateNotificationSettings(updated);
    }
    setNotifSavedMsg(true);
    setTimeout(() => setNotifSavedMsg(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-emerald-900/10 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-[#0F3D2E]/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0F3D2E]/10 text-[#0F3D2E] text-xs font-bold mb-2">
              <Sliders className="w-3.5 h-3.5 text-[#C28A17]" />
              <span>{t.navSettings || 'Settings & Account Control'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              {language === 'hi' ? 'सुरक्षा व सूचना सेटिंग्स' : (language === 'te' ? 'భద్రత & నోటిఫికేషన్ సెట్టింగ్‌లు' : 'Security & Notification Preferences')}
            </h1>
            <p className="text-stone-500 text-sm mt-1 max-w-2xl">
              {language === 'hi' 
                ? 'अपना पासवर्ड सुरक्षित रूप से बदलें और नेविगेशन बार तथा ईमेल सूचनाएं नियंत्रित करें।'
                : (language === 'te' 
                  ? 'మీ పాస్‌వర్డ్‌ని సురక్షితంగా మార్చండి మరియు బార్ & ఇమెయిల్ నోటిఫికేషన్‌లను నిర్వహించండి.' 
                  : 'Manage your authentication password, top bar alert indicators, and automated email notifications.')}
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-stone-50 px-4 py-2.5 rounded-2xl border border-stone-200 shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#0F3D2E]" />
            <div className="text-xs">
              <span className="font-bold text-stone-900 block">
                {auth?.user?.name || 'Verified Entrepreneur'}
              </span>
              <span className="text-stone-500 text-[11px]">
                {auth?.user?.mobile ? `+91 ${auth.user.mobile}` : 'Active Session'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT COLUMN: CHANGE PASSWORD (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-emerald-900/10 shadow-lg space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-stone-100">
            <div className="p-3 rounded-2xl bg-[#0F3D2E]/10 text-[#0F3D2E]">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900">
                {t.changePassword || 'Change Password'}
              </h2>
              <p className="text-xs text-stone-500">
                {language === 'hi' 
                  ? 'वर्तमान पासवर्ड दर्ज करके नया पासवर्ड सुरक्षित रूप से सेट करें'
                  : 'Enter your current password followed by your desired new password'}
              </p>
            </div>
          </div>

          {/* Password Status Alerts */}
          {passwordStatus && (
            <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-start space-x-3 ${
              passwordStatus.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              {passwordStatus.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-bold block">
                  {passwordStatus.type === 'success' ? 'Operation Completed' : 'Validation Notice'}
                </span>
                <span>{passwordStatus.message}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-5">
            {/* 1. Old Password */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">
                {t.oldPassword || 'Current / Old Password'} *
              </label>
              <div className="relative">
                <input 
                  type={showOldPass ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password (e.g. kisan123)"
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-900 font-medium focus:bg-white focus:outline-none focus:border-[#0F3D2E] focus:ring-2 focus:ring-[#0F3D2E]/10 pr-11 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                  tabIndex="-1"
                >
                  {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 2. New Password */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">
                {t.newPassword || 'New Password'} *
              </label>
              <div className="relative">
                <input 
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-900 font-medium focus:bg-white focus:outline-none focus:border-[#0F3D2E] focus:ring-2 focus:ring-[#0F3D2E]/10 pr-11 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                  tabIndex="-1"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
                <div className="mt-2.5 flex items-center space-x-2">
                  <div className="flex-1 bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${strength.color} transition-all duration-300`} 
                      style={{ width: `${(strength.score / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-stone-500">
                    {strength.text}
                  </span>
                </div>
              )}
            </div>

            {/* 3. Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">
                {t.confirmPassword || 'Confirm New Password'} *
              </label>
              <div className="relative">
                <input 
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-900 font-medium focus:bg-white focus:outline-none focus:border-[#0F3D2E] focus:ring-2 focus:ring-[#0F3D2E]/10 pr-11 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                  tabIndex="-1"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#0F3D2E] hover:bg-[#15543f] text-white font-extrabold text-sm shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
              >
                {passwordLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-amber-300" />
                    <span>{t.updatePasswordBtn || 'Update Password'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: NOTIFICATIONS TOGGLES (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Notification Preferences Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-900/10 shadow-lg space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-[#C28A17]/15 text-[#C28A17]">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-stone-900">
                    {language === 'hi' ? 'सूचना प्राथमिकताएं' : 'Notifications Control'}
                  </h2>
                  <p className="text-[11px] text-stone-500">
                    Bar alerts & email dispatch
                  </p>
                </div>
              </div>

              {notifSavedMsg && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full animate-pulse">
                  ✓ Saved
                </span>
              )}
            </div>

            {/* Toggle 1: Bar Notifications (Top Navigation Bar Alert Dot) */}
            <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-stone-900">
                      {t.barNotifications || 'In-App / Bar Notifications'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      barEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                    }`}>
                      {barEnabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    {t.barNotificationsDesc || 'Show notification badge dot, alert banners, and updates in the top navigation bar.'}
                  </p>
                </div>

                {/* Interactive Toggle Switch */}
                <button
                  type="button"
                  onClick={() => handleToggleBar(!barEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    barEnabled ? 'bg-[#0F3D2E]' : 'bg-stone-300'
                  }`}
                  role="switch"
                  aria-checked={barEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      barEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="text-[11px] text-stone-600 flex items-center space-x-1.5 pt-1 border-t border-stone-200/60">
                <span className={`w-2 h-2 rounded-full ${barEnabled ? 'bg-amber-500' : 'bg-stone-400'}`} />
                <span>
                  {barEnabled 
                    ? 'Active: Bell icon badge & dots will alert you of opportunities' 
                    : 'Muted: Bell icon indicator will be hidden'}
                </span>
              </div>
            </div>

            {/* Toggle 2: Notification Through Email */}
            <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-stone-900">
                      {t.emailNotifications || 'Notification through Email'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      emailEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                    }`}>
                      {emailEnabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    {t.emailNotificationsDesc || 'Receive government scheme notices, subsidy approvals, and advisory dossiers via email.'}
                  </p>
                </div>

                {/* Interactive Toggle Switch */}
                <button
                  type="button"
                  onClick={() => handleToggleEmail(!emailEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    emailEnabled ? 'bg-[#0F3D2E]' : 'bg-stone-300'
                  }`}
                  role="switch"
                  aria-checked={emailEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      emailEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Target Email address line */}
              <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-stone-600 truncate">
                  <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="font-semibold text-stone-800 truncate">
                    {notificationEmail}
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold shrink-0">
                  Verified
                </span>
              </div>
            </div>

          </div>

          {/* Account Overview Summary Card */}
          <div className="bg-gradient-to-br from-[#0F3D2E] to-[#174837] text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">
                  {auth?.user?.name || 'Entrepreneur'}
                </h3>
                <span className="text-[11px] text-emerald-200 font-semibold">
                  Rural Entrepreneur Account
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-emerald-100 border-t border-white/10 pt-3">
              <div className="flex justify-between py-0.5">
                <span className="text-emerald-300/80">Primary Mobile:</span>
                <span className="font-bold text-white">{profile?.phone || auth?.user?.mobile || '9876543210'}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-emerald-300/80">Registered State:</span>
                <span className="font-bold text-white">{profile?.state || 'Andhra Pradesh'}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-emerald-300/80">Security Protocol:</span>
                <span className="font-bold text-amber-300">End-to-End Encrypted</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
