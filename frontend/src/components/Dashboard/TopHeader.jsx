import React, { useState } from 'react';
import { 
  Search, 
  Globe, 
  Bell, 
  Menu, 
  ChevronDown, 
  User, 
  LogOut,
  Sparkles
} from 'lucide-react';

export default function TopHeader({ 
  auth, 
  userName: customUserName,
  onLogout, 
  language, 
  setLanguage, 
  onOpenSidebar, 
  onSearch 
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract logged-in user name or custom profile name
  const userName = customUserName || auth?.user?.name || (auth?.user?.isDemo ? 'Demo Entrepreneur' : 'Entrepreneur');
  
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
              placeholder="Search for schemes, business ideas, or ask anything..."
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
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium shadow-xs transition"
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
                      w-full text-left px-3 py-2 text-xs font-medium transition flex items-center justify-between
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

          {/* Notification Button */}
          <button 
            className="p-2 text-stone-600 hover:text-[#0F3D2E] hover:bg-white border border-transparent hover:border-stone-200 rounded-xl relative transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-[#FAF8F5]" />
          </button>

          {/* User Profile Avatar & Name */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-white border border-stone-200 hover:border-emerald-800/30 shadow-xs transition"
            >
              <div className="w-8 h-8 rounded-lg bg-[#0F3D2E] text-amber-300 font-bold text-xs flex items-center justify-center shadow-xs">
                {getInitials(userName)}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-stone-800 truncate max-w-[120px]">
                  {userName}
                </span>
                <span className="text-[10px] text-emerald-800 font-semibold flex items-center space-x-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                  <span>Rural Entrepreneur</span>
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
                  onClick={() => setShowUserMenu(false)} 
                  className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-stone-700 hover:bg-stone-50 transition"
                >
                  <User className="w-4 h-4 text-stone-400" />
                  <span>My Profile</span>
                </button>

                <div className="border-t border-stone-100 my-1" />

                <button 
                  onClick={() => {
                    setShowUserMenu(false);
                    if (onLogout) onLogout();
                  }} 
                  className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium transition"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
