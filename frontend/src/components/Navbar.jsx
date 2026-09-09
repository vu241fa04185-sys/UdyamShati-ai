import { 
  Building2, 
  Globe2, 
  Sparkles, 
  MapPin, 
  Coins, 
  FileText, 
  ShieldCheck, 
  Sliders, 
  FileCheck2,
  CheckCircle2,
  Mic,
  LogOut
} from 'lucide-react';
import { translations } from '../locales/translations';

export default function Navbar({ activeTab, setActiveTab, lang, setLang, profile, lastSyncTime, onLogout }) {
  const t = translations[lang] || translations.en;

  const tabs = [
    { id: 'chat', label: t.tabChat, icon: Sparkles },
    { id: 'profile', label: t.tabProfile, icon: MapPin },
    { id: 'recommendations', label: t.tabRecommendations, icon: Building2 },
    { id: 'market', label: t.tabMarketMap, icon: MapPin },
    { id: 'finance', label: t.tabFinance, icon: Coins },
    { id: 'schemes', label: t.tabSchemes, icon: FileText },
    { id: 'risk', label: t.tabRisk, icon: ShieldCheck },
    { id: 'simulator', label: t.tabSimulator, icon: Sliders },
    { id: 'report', label: t.tabReport, icon: FileCheck2 },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      {/* Top Banner with Government / Ministry Identity */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center space-x-3.5">
            {/* National Emblem / Platform Emblem */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-emerald-500 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-emerald-950 rounded-[10px] flex items-center justify-center font-black text-amber-300 text-base">
                उS
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base md:text-lg font-black tracking-tight text-white">
                  {t.appTitle}
                </h1>
                <span className="hidden sm:inline-block bg-emerald-800/80 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-700/60 uppercase tracking-wider">
                  MoSJE Concessional Finance
                </span>
              </div>
              <span className="text-[11px] font-medium text-emerald-200/90 block">
                {t.tagline}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {/* Live Synchronized Profile Pill */}
            <div 
              onClick={() => setActiveTab('profile')}
              className="cursor-pointer group flex items-center bg-white/10 hover:bg-white/15 backdrop-blur px-3 py-1.5 rounded-full border border-white/15 text-emerald-100 transition"
              title="Click to edit profile parameters"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2" />
              <span className="font-bold text-white group-hover:text-amber-300 transition">
                {profile.name}
              </span>
              <span className="mx-1.5 opacity-40">•</span>
              <span className="font-semibold text-emerald-200">
                ₹{(profile.available_capital || 0).toLocaleString('en-IN')}
              </span>
              <span className="mx-1.5 opacity-40">•</span>
              <span>{profile.land_acres || 0} Ac</span>
              <span className="mx-1.5 opacity-40">•</span>
              <span className="bg-emerald-950/80 text-amber-300 px-1.5 py-0.5 rounded font-extrabold text-[10px] uppercase">
                {profile.social_category}
              </span>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-black/40 rounded-xl p-0.5 border border-white/15">
              <Globe2 className="w-3.5 h-3.5 ml-2 mr-1 text-emerald-300" />
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  lang === 'en' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('hi')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  lang === 'hi' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => setLang('te')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  lang === 'te' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                తెలుగు
              </button>
            </div>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Logout of UdyamSaarthi"
                className="flex items-center space-x-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/30 px-3 py-1.5 rounded-xl text-xs font-bold transition duration-200 hover:text-white"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.logoutBtn || 'Logout'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 py-2 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
