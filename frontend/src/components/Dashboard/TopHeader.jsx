import React, { useState } from 'react';
import { 
  Search, 
  Globe, 
  Bell, 
  BellOff,
  Menu, 
  ChevronDown, 
  User, 
  LogOut,
  Sparkles,
  Settings
} from 'lucide-react';
import { translations } from '../../locales/translations';

export default function TopHeader({ 
  auth, 
  profile,
  notificationSettings,
  setActiveTab,
  onLogout, 
  language, 
  setLanguage, 
  onOpenSidebar,
  onSearch 
}) {
  const t = translations[language] || translations.en;
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract logged-in user name
  const userName = auth?.user?.name || (auth?.user?.isDemo ? 'Demo Entrepreneur' : 'Entrepreneur');
  
  // Helper for user initials
  const getInitials = (name) => {
    if (!name) return 'US';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'te', label: 'తెలుగు' }
  ];

  const currentLangLabel = languages.find(l => l.code === language)?.label || 'English';
  const isBarNotifActive = notificationSettings?.barNotifications !== false;

  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-emerald-900/10 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left Side: Mobile Menu Button + Search Bar */}
        <div className="flex items-center space-x-3 flex-1">
          <button 
            onClick={onOpenSidebar}
            className="lg:hidden p-2 text-stone-600 hover:text-[#0F3D2E] hover:bg-stone-200/50 rounded-xl transition"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder || "Search for schemes, business ideas, or ask anything..."}
              className="w-full bg-white text-stone-800 text-sm pl-10 pr-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-[#0F3D2E] focus:ring-2 focus:ring-[#0F3D2E]/10 placeholder:text-stone-400 shadow-xs transition"
            />
          </form>
        </div>

        {/* Right Side: Language Selector + Notifications + User Identity */}
        <div className="flex items-center space-x-3">
          
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium shadow-xs transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-800" />
              <span>{currentLangLabel}</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-36 bg-white border border-stone-200 rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowLangMenu(false);
                    }}
                    className={`
                      w-full text-left px-3 py-2 text-xs font-medium transition flex items-center justify-between cursor-pointer
                      ${language === lang.code ? 'bg-[#0F3D2E]/10 text-[#0F3D2E] font-semibold' : 'text-stone-600 hover:bg-stone-50'}
                    `}
                  >
                    <span>{lang.label}</span>
                    {language === lang.code && <span className="w-1.5 h-1.5 rounded-full bg-[#0F3D2E]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification Button & Flyout */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="p-2 text-stone-600 hover:text-[#0F3D2E] hover:bg-white border border-transparent hover:border-stone-200 rounded-xl relative transition cursor-pointer"
              title={isBarNotifActive ? "Notifications (Active)" : "Notifications (Muted in Settings)"}
            >
              {isBarNotifActive ? (
                <>
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-[#FAF8F5] animate-pulse" />
                </>
              ) : (
                <BellOff className="w-4 h-4 text-stone-400" />
              )}
            </button>

            {/* Notification Flyout Menu */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-stone-200 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100 px-1">
                  <div className="flex items-center space-x-1.5">
                    <Bell className="w-4 h-4 text-[#0F3D2E]" />
                    <span className="text-xs font-black text-stone-900">Notifications</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isBarNotifActive ? 'bg-emerald-100 text-[#0F3D2E]' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {isBarNotifActive ? 'Active' : 'Bar Alerts Muted'}
                  </span>
                </div>

                {isBarNotifActive ? (
                  <div className="py-2 space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 hover:bg-emerald-50 transition cursor-pointer">
                      <p className="font-bold text-[#0F3D2E] text-[11px] flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>MoSJE Scheme Concessions</span>
                      </p>
                      <p className="text-stone-600 text-[11px] mt-0.5">
                        New 10/90 capital subsidy schemes matched for your category.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/70 hover:bg-stone-100/70 transition cursor-pointer">
                      <p className="font-bold text-stone-800 text-[11px]">
                        Hyper-Local Catchment Synchronized
                      </p>
                      <p className="text-stone-500 text-[11px] mt-0.5">
                        Demand analysis for {profile?.district || 'your area'} is active.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center space-y-2">
                    <BellOff className="w-8 h-8 text-stone-300 mx-auto" />
                    <p className="text-xs text-stone-500 max-w-[200px] mx-auto">
                      Navigation bar alerts are currently turned off in Settings.
                    </p>
                    <button
                      onClick={() => {
                        setShowNotifMenu(false);
                        if (setActiveTab) setActiveTab('settings');
                      }}
                      className="text-xs font-bold text-[#0F3D2E] hover:underline cursor-pointer"
                    >
                      Open Settings →
                    </button>
                  </div>
                )}

                <div className="pt-2 border-t border-stone-100 flex justify-between items-center text-[10px] text-stone-400 px-1">
                  <span>UdyamSaarthi Alerts</span>
                  <button 
                    onClick={() => {
                      setShowNotifMenu(false);
                      if (setActiveTab) setActiveTab('settings');
                    }}
                    className="text-[#0F3D2E] font-bold hover:underline cursor-pointer"
                  >
                    Preferences
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Name */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-white border border-stone-200 hover:border-emerald-800/30 shadow-xs transition cursor-pointer"
            >
              {profile?.photo || auth?.user?.picture ? (
                <img 
                  src={profile?.photo || auth?.user?.picture} 
                  alt={userName} 
                  className="w-8 h-8 rounded-lg object-cover border border-emerald-900/10 shadow-xs" 
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#0F3D2E] text-amber-300 font-bold text-xs flex items-center justify-center shadow-xs">
                  {getInitials(userName)}
                </div>
              )}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-stone-800 truncate max-w-[120px]">
                  {userName}
                </span>
                <span className="text-[10px] text-emerald-800 font-semibold flex items-center space-x-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                  <span>{t.ruralEntrepreneurRole || 'Rural Entrepreneur'}</span>
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 hidden sm:block" />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-stone-100">
                  <p className="text-xs font-bold text-stone-900">{userName}</p>
                  <p className="text-[11px] text-stone-500 truncate">{auth?.user?.email || auth?.user?.mobile || 'Verified Entrepreneur'}</p>
                </div>

                <button 
                  onClick={() => {
                    setShowUserMenu(false);
                    if (setActiveTab) setActiveTab('profile');
                  }} 
                  className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                >
                  <User className="w-4 h-4 text-stone-400" />
                  <span>{t.myProfile || 'My Profile'}</span>
                </button>

                <button 
                  onClick={() => {
                    setShowUserMenu(false);
                    if (setActiveTab) setActiveTab('settings');
                  }} 
                  className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-stone-400" />
                  <span>{t.navSettings || 'Settings'}</span>
                </button>

                <div className="border-t border-stone-100 my-1" />

                <button 
                  onClick={() => {
                    setShowUserMenu(false);
                    if (onLogout) onLogout();
                  }} 
                  className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>{t.logout || 'Logout'}</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
