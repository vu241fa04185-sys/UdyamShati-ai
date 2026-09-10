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
  const userName = auth?.name || auth?.user?.name || profile?.name || 'Entrepreneur';

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Hero Banner */}
      <HeroBanner 
        userName={userName} 
        onStartAnalysis={() => setActiveTab('recommendations')} 
        language={language}
        lang={language} 
      />

      {/* 2. Main Content Grid (Central Voice AI Chat + Right Context Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left / Center: Central Voice-First AI Saarthi Area (Primary, 68-72% width) */}
        <div className="lg:col-span-8">
          <SaarthiHomeChat
            profile={profile}
            onProfileUpdate={onProfileUpdate}
            setActiveTab={setActiveTab}
            language={language}
          />
        </div>

        {/* Right Column: Location + Green Opportunity Dashboard (Secondary, 28-32% width) */}
        <div className="lg:col-span-4">
          <RightContextPanel
            profile={profile}
            onProfileUpdate={onProfileUpdate}
            setActiveTab={setActiveTab}
            language={language}
            lang={language}
          />
        </div>

      </div>

      {/* 3. Lower Home Content: Why UdyamSaarthi + Helpline */}
      <LowerDashboard language={language} lang={language} />
    </div>
  );
}
