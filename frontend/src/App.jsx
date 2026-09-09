import React, { useState, useEffect, Component } from 'react';
import axios from 'axios';
import ChatAssistant from './components/ChatAssistant';
import ProfileWizard from './components/ProfileWizard';
import RecommendationsView from './components/RecommendationsView';
import MarketMapView from './components/MarketMapView';
import FinanceDashboard from './components/FinanceDashboard';
import SchemeMatcher from './components/SchemeMatcher';
import RiskStressView from './components/RiskStressView';
import SimulatorView from './components/SimulatorView';
import ReportView from './components/ReportView';
import LoginPage from './components/Auth/LoginPage';
import Sidebar from './components/Dashboard/Sidebar';
import TopHeader from './components/Dashboard/TopHeader';
import HomeDashboard from './components/Dashboard/HomeDashboard';
import { authService } from './services/authService';
import { translations } from './locales/translations';
import { SaarthiProvider } from './context/SaarthiContext';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FCFBF7] flex items-center justify-center p-6 text-left">
          <div className="bg-white rounded-3xl p-8 max-w-2xl border border-red-200 shadow-xl space-y-4 w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 font-bold flex items-center justify-center text-lg">
                ⚠️
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900">Application Render Error</h2>
                <p className="text-xs text-stone-500">React caught an uncaught runtime exception</p>
              </div>
            </div>
            <div className="bg-red-950 text-red-200 p-4 rounded-xl font-mono text-xs overflow-auto max-h-60 space-y-2">
              <p className="font-bold text-red-400">{this.state.error?.toString()}</p>
              <pre className="text-[11px] whitespace-pre-wrap text-stone-400">{this.state.error?.stack}</pre>
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="bg-[#0F3D2E] text-amber-300 font-bold px-5 py-2.5 rounded-xl text-xs shadow-md hover:brightness-110"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Authentication state initialized from authService
  const [auth, setAuth] = useState(() => authService.getCurrentSession());

  // Language Preference state: mode 'auto' or 'manual'
  const [langPref, setLangPref] = useState(() => {
    try {
      const saved = localStorage.getItem('udyam_lang_pref');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Error reading language preference:", e);
    }
    return { mode: 'auto', language: 'en' };
  });

  const lang = langPref.language;
  const t = translations[lang] || translations.en;

  // Handle explicit manual language change by user
  const handleSetLanguage = (newLang) => {
    const updated = { mode: 'manual', language: newLang };
    setLangPref(updated);
    try {
      localStorage.setItem('udyam_lang_pref', JSON.stringify(updated));
    } catch (e) {
      console.warn("Error saving language preference:", e);
    }
  };

  // Default Entrepreneur Profile
  const [profile, setProfile] = useState({
    name: 'Ramesh Kisan',
    phone: '9876543210',
    social_category: 'OBC',
    gender: 'MALE',
    annual_family_income: 180000,
    state: 'Andhra Pradesh',
    district: 'Guntur',
    mandal_or_block: 'Chebrole',
    village_name: 'Vadlamudi',
    pincode: '522213',
    latitude: 16.2333,
    longitude: 80.5500,
    available_capital: 300000,
    liquid_reserve: 20000,
    land_acres: 2.0,
    has_shop_building: false,
    has_vehicle: true,
    has_machinery: false,
    has_electricity: true,
    has_water_source: true,
    has_internet: true,
    has_storage_facility: false,
    skills: ['farming', 'agriculture'],
    experience_years: 5,
    business_interest: null,
    target_monthly_income: 25000,
    risk_preference: 'MODERATE',
    preferred_language: 'en',
    analysis_radius_km: 10.0
  });

  const [recommendations, setRecommendations] = useState(null);

  // Unconditionally scroll to top whenever active tab changes, especially for HOME
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

  // Synchronize location-based automatic language when mode === 'auto'
  useEffect(() => {
    if (langPref.mode === 'auto') {
      const stateName = profile?.state?.trim().toLowerCase() || '';
      let autoLang = 'en';

      if (stateName.includes('andhra') || stateName.includes('telangana')) {
        autoLang = 'te';
      } else if (stateName) {
        autoLang = 'hi';
      }

      if (autoLang !== langPref.language) {
        setLangPref({ mode: 'auto', language: autoLang });
      }
    }
  }, [profile?.state, langPref.mode]);

  // Synchronize authenticated user identity into profile state
  useEffect(() => {
    if (auth && auth.isAuthenticated) {
      const userName = auth.name || (auth.user && auth.user.name);
      const userPhone = auth.phone || (auth.user && auth.user.phone);
      if (userName || userPhone) {
        setProfile((prev) => ({
          ...prev,
          name: userName || prev.name,
          phone: userPhone || prev.phone,
        }));
      }
    }
  }, [auth]);

  // Handle Login Success
  const handleLoginSuccess = (session) => {
    authService.saveSession(session);
    setAuth(session);
    setActiveTab('home');
    const userName = session.name || (session.user && session.user.name);
    const userPhone = session.phone || (session.user && session.user.phone);
    if (userName || userPhone) {
      setProfile((prev) => ({
        ...prev,
        name: userName || prev.name,
        phone: userPhone || prev.phone,
      }));
    }
  };

  // Handle Logout
  const handleLogout = () => {
    authService.signOut();
    setAuth(null);
  };

  // Run decision advisory pipeline
  const runDecisionAdvisory = async (customProfile = null) => {
    setLoading(true);
    const targetProfile = { ...(customProfile || profile), preferred_language: lang };
    try {
      const res = await axios.post('/api/recommendations', targetProfile);
      setRecommendations(res.data);
      setLastSyncTime(Date.now());
    } catch (err) {
      console.warn("Recommendation API notice:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial advisory run on startup when authenticated
  useEffect(() => {
    if (auth && auth.isAuthenticated) {
      runDecisionAdvisory(profile);
    }
  }, [auth]);

  // When speech or wizard updates the profile, instantly save & re-evaluate
  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile);
    runDecisionAdvisory(updatedProfile);
  };

  // Render Login Page if user is not authenticated
  if (!auth || !auth.isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        lang={lang}
        setLang={handleSetLanguage}
      />
    );
  }

  return (
    <ErrorBoundary>
      <SaarthiProvider
        auth={auth}
        profile={profile}
        onProfileUpdate={handleProfileUpdate}
        language={lang}
      >
      <div className="min-h-screen bg-[#FCFBF7] text-stone-800 flex font-sans antialiased">
        {/* 1. Left Fixed Sidebar */}
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          lang={lang}
        />

        {/* 2. Main Content Workspace (Offset by Sidebar on Desktop) */}
        <div className="flex-1 lg:ml-64 flex flex-col min-w-0 min-h-screen">
          
          {/* Top Header Bar */}
          <TopHeader
            auth={auth}
            profile={profile}
            onLogout={handleLogout}
            language={lang}
            setLanguage={handleSetLanguage}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            setActiveTab={setActiveTab}
            onSearch={(query) => {
              setActiveTab('home');
            }}
          />

          {/* Main Page Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {loading && !recommendations && activeTab !== 'home' ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <div className="w-10 h-10 border-4 border-[#0F3D2E] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-semibold text-stone-600">
                  {t.evaluatingLoading || "Evaluating hyper-local market catchment & government schemes..."}
                </span>
              </div>
            ) : (
              <>
                {(activeTab === 'home' || activeTab === 'chat') && (
                  <HomeDashboard
                    auth={auth}
                    profile={profile}
                    onProfileUpdate={handleProfileUpdate}
                    setActiveTab={setActiveTab}
                    language={lang}
                  />
                )}

                {activeTab === 'profile' && (
                  <ProfileWizard
                    profile={profile}
                    setProfile={setProfile}
                    onRunAdvisory={() => {
                      runDecisionAdvisory(profile);
                      setActiveTab('recommendations');
                    }}
                    lang={lang}
                  />
                )}

                {activeTab === 'recommendations' && (
                  <RecommendationsView
                    recommendations={recommendations}
                    lang={lang}
                    setActiveTab={setActiveTab}
                  />
                )}

                {activeTab === 'market' && (
                  <MarketMapView
                    profile={profile}
                    setProfile={setProfile}
                    recommendations={recommendations}
                    lang={lang}
                    onLocationUpdate={handleProfileUpdate}
                  />
                )}

                {activeTab === 'finance' && (
                  <FinanceDashboard
                    recommendations={recommendations}
                    profile={profile}
                    lang={lang}
                  />
                )}

                {activeTab === 'schemes' && (
                  <SchemeMatcher
                    profile={profile}
                    recommendations={recommendations}
                    lang={lang}
                  />
                )}

                {activeTab === 'risk' && (
                  <RiskStressView
                    recommendations={recommendations}
                    lang={lang}
                  />
                )}

                {activeTab === 'simulator' && (
                  <SimulatorView
                    profile={profile}
                    recommendations={recommendations}
                    lang={lang}
                  />
                )}

                {activeTab === 'report' && (
                  <ReportView
                    profile={profile}
                    recommendations={recommendations}
                    lang={lang}
                    setActiveTab={setActiveTab}
                  />
                )}
              </>
            )}
          </main>

          {/* Footer */}
          <footer className="bg-white/80 border-t border-emerald-900/10 py-4 px-6 text-center text-xs text-stone-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="font-bold text-[#0F3D2E]">
                {t.footerTitle || "UdyamSaarthi AI • Your Business Companion"}
              </span>
              <span>
                {t.footerSubtitle || "Empowering Rural Micro-Entrepreneurs across India"}
              </span>
            </div>
          </footer>

        </div>
      </div>
    </SaarthiProvider>
  </ErrorBoundary>
  );
}
