import React, { useState } from 'react';
import {
  MapPin,
  TrendingUp,
  Landmark,
  Users,
  ArrowRight,
  Edit2
} from 'lucide-react';
import { translations } from '../../locales/translations';

export default function RightContextPanel({ profile, onProfileUpdate, setActiveTab, language = 'en' }) {
  const t = translations[language] || translations.en;
  const [isChangingLoc, setIsChangingLoc] = useState(false);
  const [inputDistrict, setInputDistrict] = useState(profile?.district || 'Guntur');
  const [inputState, setInputState] = useState(profile?.state || 'Andhra Pradesh');

  const locationText = profile?.district && profile?.state
    ? `${profile.district}, ${profile.state}`
    : 'Guntur, Andhra Pradesh';

  const districtOnly = profile?.district || 'Guntur';

  const handleSaveLocation = (e) => {
    e.preventDefault();
    if (onProfileUpdate) {
      onProfileUpdate({
        ...profile,
        district: inputDistrict,
        state: inputState
      });
    }
    setIsChangingLoc(false);
  };

  return (
    <div className="space-y-5">

      {/* 1. YOUR LOCATION CARD */}
      <div className="bg-white rounded-3xl p-5 shadow-lg border border-emerald-900/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/15 text-[#C28A17]">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-stone-900">{t.yourLocation || 'Your Location'}</h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-[#0F3D2E]">
            {t.activeContext || 'Active Context'}
          </span>
        </div>

        {!isChangingLoc ? (
          <div>
            <p className="text-base font-bold text-stone-800">
              {locationText}
            </p>
            {profile?.address && (
              <p className="text-[11px] font-medium text-stone-600 mt-0.5 truncate">
                {profile.address} {profile.pincode ? `• PIN ${profile.pincode}` : ''}
              </p>
            )}
            <p className="text-xs text-stone-500 mt-0.5">
              {t.marketFiltered || 'Market opportunities & schemes filtered for this area.'}
            </p>

            <div className="flex items-center space-x-2 mt-4">
              <button
                onClick={() => setActiveTab('market')}
                className="flex-1 py-2 px-3 rounded-xl bg-[#0F3D2E] text-white text-xs font-bold text-center hover:bg-[#165440] transition shadow-xs"
              >
                {t.useThisLocation || 'Use this location'}
              </button>
              <button
                onClick={() => setIsChangingLoc(true)}
                className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition flex items-center space-x-1"
              >
                <Edit2 className="w-3 h-3 text-stone-500" />
                <span>{t.changeLocBtn || 'Change'}</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveLocation} className="space-y-3 mt-2">
            <div>
              <label className="text-[11px] font-bold text-stone-600 block mb-1">
                {language === 'hi' ? 'जिला / शहर' : (language === 'te' ? 'జిల్లా / పట్టణం' : 'District / Town')}
              </label>
              <input
                type="text"
                value={inputDistrict}
                onChange={(e) => setInputDistrict(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-[#0F3D2E]"
                placeholder="e.g. Guntur or Nashik"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-stone-600 block mb-1">
                {language === 'hi' ? 'राज्य' : (language === 'te' ? 'రాష్ట్రం' : 'State')}
              </label>
              <input
                type="text"
                value={inputState}
                onChange={(e) => setInputState(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-[#0F3D2E]"
                placeholder="e.g. Andhra Pradesh"
              />
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-1.5 rounded-xl bg-[#0F3D2E] text-white text-xs font-bold"
              >
                {language === 'hi' ? 'स्थान अपडेट करें' : (language === 'te' ? 'స్థానం మార్చండి' : 'Update Location')}
              </button>
              <button
                type="button"
                onClick={() => setIsChangingLoc(false)}
                className="py-1.5 px-3 rounded-xl bg-stone-100 text-stone-600 text-xs font-bold"
              >
                {language === 'hi' ? 'रद्द करें' : (language === 'te' ? 'రద్దు' : 'Cancel')}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. HYPER-LOCAL INSIGHTS — GREEN OPPORTUNITY DASHBOARD CARD */}
      <div className="bg-gradient-to-br from-[#0F3D2E] to-[#144d3b] text-white rounded-3xl p-5 shadow-xl border border-emerald-800/40 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
              🌱 {t.tabMarketMap || 'HYPER-LOCAL INSIGHTS'}
            </span>
            <span className="text-[11px] bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full font-semibold">
              {districtOnly}
            </span>
          </div>

          <h3 className="text-base font-extrabold text-amber-100 mb-4">
            {t.greenOppTitle || 'Opportunity Dashboard'}
          </h3>

          <div className="space-y-3">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-emerald-100 font-medium">
                    {language === 'hi' ? 'बढ़ते अवसर' : (language === 'te' ? 'పెరుగుతున్న అవకాశాలు' : 'Growing Opportunities')}
                  </p>
                  <p className="text-lg font-black text-amber-300">24+</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-emerald-100 font-medium">
                    {t.navGovtSchemes || 'Active Schemes'}
                  </p>
                  <p className="text-lg font-black text-amber-300">12+</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-emerald-100 font-medium">
                    {language === 'hi' ? 'सफल उद्यमी' : (language === 'te' ? 'మద్దతు పొందిన పారిశ్రామికవేత్తలు' : 'Supported Entrepreneurs')}
                  </p>
                  <p className="text-lg font-black text-amber-300">1K+</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('market')}
          className="w-full mt-5 py-2.5 rounded-2xl bg-[#C28A17] hover:bg-[#b07d14] text-white text-xs font-bold text-center transition flex items-center justify-center space-x-2 shadow-md"
        >
          <span>{language === 'hi' ? 'बाजार अंतर्दृष्टि नक्शा देखें →' : (language === 'te' ? 'మార్కెట్ మ్యాప్ చూడండి →' : 'Explore Market Insights Map →')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
