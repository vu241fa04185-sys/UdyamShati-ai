import React from 'react';
import HeroBanner from './HeroBanner';
import SaarthiHomeChat from './SaarthiHomeChat';
import RightContextPanel from './RightContextPanel';
import LowerDashboard from './LowerDashboard';

export default function HomeDashboard({ 
  auth, 
  profile, 
  onProfileUpdate, 
  setActiveTab, 
  language 
}) {
  const userName = auth?.user?.name || (auth?.user?.isDemo ? 'Demo Entrepreneur' : 'Entrepreneur');

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Hero Banner */}
      <HeroBanner 
        userName={userName} 
        onStartAnalysis={() => setActiveTab('recommendations')} 
      />

      {/* 2. Main Content Grid (Central Voice AI Chat + Right Context Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left / Center: Central Voice-First AI Saarthi Area */}
        <div className="lg:col-span-2">
          <SaarthiHomeChat
            profile={profile}
            onProfileUpdate={onProfileUpdate}
            setActiveTab={setActiveTab}
            language={language}
          />
        </div>

        {/* Right Column: Location + Green Opportunity Dashboard */}
        <div className="lg:col-span-1">
          <RightContextPanel
            profile={profile}
            onProfileUpdate={onProfileUpdate}
            setActiveTab={setActiveTab}
          />
        </div>

      </div>

      {/* 3. Lower Home Content: Why UdyamSaarthi + Helpline */}
      <LowerDashboard />
    </div>
  );
}
