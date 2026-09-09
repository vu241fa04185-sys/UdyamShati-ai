import React, { useState, useEffect } from 'react';
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
import SettingsView from './components/SettingsView';
import LoginPage from './components/Auth/LoginPage';
import Sidebar from './components/Dashboard/Sidebar';
import TopHeader from './components/Dashboard/TopHeader';
import HomeDashboard from './components/Dashboard/HomeDashboard';
import { authService } from './services/authService';
import { translations } from './locales/translations';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('udyamsetu_lang') || 'en';
    } catch {
      return 'en';
    }
  });
  const [loading, setLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(() => {
    try {
      if (authService && typeof authService.getNotificationSettings === 'function') {
        return authService.getNotificationSettings();
      }
    } catch (e) {}
    return { barNotifications: true, emailNotifications: true };
  });

  const handleSetLang = (newLang) => {
    setLang(newLang);
    try {
      localStorage.setItem('udyamsetu_lang', newLang);
    } catch (e) {}
    setProfile((prev) => ({ ...prev, preferred_language: newLang }));
  };

  // Authentication state initialized from authService
  const [auth, setAuth] = useState(() => authService.getCurrentSession());

  // Blank Entrepreneur Profile initialized with null/empty until user provides
  const [profile, setProfile] = useState({
    name: null,
    phone: '',
    photo: '',
    social_category: null,
    gender: null,
    annual_family_income: null,
    address: '',
    state: null,
    district: null,
    mandal_or_block: '',
    village_name: '',
    pincode: '',
    post: '',
    police_station: '',
    latitude: null,
    longitude: null,
    available_capital: null,
    liquid_reserve: null,
    land_acres: null,
    has_shop_building: false,
    has_vehicle: false,
    has_machinery: false,
    has_electricity: true,
    has_water_source: true,
    has_internet: true,
    has_storage_facility: false,
    skills: [],
    experience_years: null,
    business_interest: null,
    target_monthly_income: null,
    risk_preference: 'MODERATE',
    preferred_language: 'en',
    analysis_radius_km: 10.0
  });

  const [recommendations, setRecommendations] = useState(null);

  // Unconditionally scroll to top whenever active tab changes, especially for HOME
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

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
    const targetProfile = customProfile || profile;
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
        setLang={handleSetLang}
      />
    );
  }

  const t = translations[lang] || translations.en;

  return (
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
          notificationSettings={notificationSettings}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          language={lang}
          setLanguage={handleSetLang}
          onOpenSidebar={() => setIsSidebarOpen(true)}
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
                Evaluating hyper-local market catchment & government schemes...
              </span>
            </div>
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeDashboard
                  auth={auth}
                  profile={profile}
                  onProfileUpdate={handleProfileUpdate}
                  setActiveTab={setActiveTab}
                  language={lang}
                />
              )}

              {activeTab === 'chat' && (
                <ChatAssistant
                  lang={lang}
                  profile={profile}
                  onProfileUpdate={handleProfileUpdate}
                  setActiveTab={setActiveTab}
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
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  auth={auth}
                  profile={profile}
                  notificationSettings={notificationSettings}
                  onUpdateNotificationSettings={setNotificationSettings}
                  language={lang}
                />
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white/80 border-t border-emerald-900/10 py-4 px-6 text-center text-xs text-stone-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-bold text-[#0F3D2E]">
              {t.appTitle || 'UdyamSaarthi AI'} • {t.tagline || 'Your Business Companion'}
            </span>
            <span>
              {t.empowerRuralIndia || 'Empowering Rural Micro-Entrepreneurs across India'}
            </span>
          </div>
        </footer>

      </div>
    </div>
  );
}
