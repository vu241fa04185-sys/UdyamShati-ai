import React from 'react';
import { 
  Home, 
  MessageSquare, 
  BarChart3, 
  MapPin, 
  Wallet, 
  Landmark, 
  ShieldAlert, 
  Sliders, 
  FileText, 
  User, 
  Settings, 
  HelpCircle,
  X
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }) {
  const mainNavItems = [
    { id: 'home', label: 'HOME', icon: Home },
    { id: 'chat', label: 'My Conversations', icon: MessageSquare },
    { id: 'recommendations', label: 'Business Analysis', icon: BarChart3 },
    { id: 'market', label: 'Local Market Insights', icon: MapPin },
    { id: 'finance', label: 'Financial Planner', icon: Wallet },
    { id: 'schemes', label: 'Government Schemes', icon: Landmark },
    { id: 'risk', label: 'Risk & Stress', icon: ShieldAlert },
    { id: 'simulator', label: 'Simulator', icon: Sliders },
    { id: 'report', label: 'My Business Plans', icon: FileText }
  ];

  const secondaryNavItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help & Support', icon: HelpCircle }
  ];

  const handleSelect = (id) => {
    setActiveTab(id);
    if (setIsOpen) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50
        w-64 bg-[#FAF8F5] border-r border-emerald-900/10 flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Header / Logo Section */}
        <div className="p-5 border-b border-emerald-900/10 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-bold tracking-tight text-[#0F3D2E]">
                Udyam<span className="text-[#C28A17]">Saarthi</span>
              </span>
              <span className="bg-[#C28A17]/15 text-[#C28A17] text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                AI
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium tracking-wide mt-0.5">
              — Your Business Companion —
            </p>
          </div>
          {setIsOpen && (
            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 text-stone-500 hover:text-stone-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">
              Main Menu
            </p>
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
                      ${isActive 
                        ? 'bg-[#0F3D2E] text-white shadow-md shadow-[#0F3D2E]/20' 
                        : 'text-stone-700 hover:bg-emerald-950/5 hover:text-[#0F3D2E]'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-emerald-800/70'}`} />
                    <span className="truncate">{item.label}</span>
                    {item.id === 'home' && isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-2 border-t border-emerald-900/10">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">
              Account & Support
            </p>
            <nav className="space-y-1">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2 rounded-xl font-medium text-sm transition-all duration-200
                      ${isActive 
                        ? 'bg-[#0F3D2E] text-white' 
                        : 'text-stone-600 hover:bg-emerald-950/5 hover:text-[#0F3D2E]'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-stone-400" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Clean Footer Branding Line */}
        <div className="p-4 border-t border-emerald-900/10 text-center">
          <p className="text-[11px] font-bold text-stone-400 tracking-wider uppercase">
            UdyamSaarthi AI v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
