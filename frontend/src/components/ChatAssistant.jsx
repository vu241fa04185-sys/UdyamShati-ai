import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Coins, 
  MapPin,
  Tractor,
  Layers,
  HelpCircle,
  Zap,
  Navigation,
  Crosshair
} from 'lucide-react';
import axios from 'axios';
import { translations } from '../locales/translations';

export default function ChatAssistant({ lang, profile, onProfileUpdate, setActiveTab }) {
  const t = translations[lang] || translations.en;
  
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: lang === 'hi' 
        ? "नमस्ते! मैं आपका उद्यमसेतु एआई सलाहकार हूँ। आप बोलकर या लिखकर सवाल पूछ सकते हैं — जैसे 'मेरा करंट लोकेशन क्या है?', 'मेरे पास 3 लाख रुपये हैं', या 'डेयरी लोन की ईएमआई कितनी होगी?'।"
        : lang === 'te'
        ? "నమస్కారం! నేను మీ ఉద్యమ్ సేతు ఏఐ సలహాదారుని. మాట్లాడండి — మీ వివరాలు మరియు ప్రశ్నలకు తక్షణ సమాధానం లభిస్తుంది."
        : "Welcome to UdyamSetu AI! Speak or type naturally — ask about your location, suggest a business for your capital, or calculate loan EMIs.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      entities: null,
      topRec: null,
      actionType: null
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false); // Default off so it doesn't disturb unless wanted
  const [lastExtractedNotice, setLastExtractedNotice] = useState(null);
  const [gpsDetecting, setGpsDetecting] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Web Speech API Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang === 'hi' ? 'hi-IN' : (lang === 'te' ? 'te-IN' : 'en-IN');

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        // Automatically send and evaluate voice transcript!
        handleSend(transcript);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [lang, profile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Microphone speech recognition is not supported in this browser. Please type your message.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : (lang === 'te' ? 'te-IN' : 'en-IN');
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Error starting speech recognition:", err);
      }
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*/g, '').replace(/•/g, ''));
      utterance.lang = lang === 'hi' ? 'hi-IN' : (lang === 'te' ? 'te-IN' : 'en-IN');
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Detect Live GPS when requested by user or chat button
  const detectLiveGPSInChat = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your device/browser.");
      return;
    }

    setGpsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLon = pos.coords.longitude;
        let village = "My Current Location";
        let district = profile.district || "District";
        let state = profile.state || "State";

        try {
          const geoRes = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLon}&zoom=14&addressdetails=1`
          );
          if (geoRes.data?.address) {
            const addr = geoRes.data.address;
            village = addr.village || addr.suburb || addr.town || addr.city || "Local Village";
            district = addr.state_district || addr.county || addr.district || district;
            state = addr.state || state;
          }
        } catch (e) {}

        const newProfile = {
          ...profile,
          latitude: userLat,
          longitude: userLon,
          village_name: village,
          district: district,
          state: state
        };

        if (onProfileUpdate) onProfileUpdate(newProfile);
        setGpsDetecting(false);

        // Add confirmation message to chat
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: `📍 लाइव GPS लोकेशन सफलतापूर्वक लॉक हो गई है!\n• स्थान: **${village}, ${district} (${state})**\n• GPS निर्देशांक: **${userLat.toFixed(4)}° N, ${userLon.toFixed(4)}° E**\n\nअब 5-10 किमी का बाजार नक्शा और व्यावसायिक सिफारिशें आपकी इस वास्तविक लोकेशन पर अपडेट हो चुकी हैं।`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionType: 'LOCATION_LOCKED'
          }
        ]);
      },
      (err) => {
        console.warn("GPS error:", err);
        setGpsDetecting(false);
        alert("GPS access was denied. Please allow location permissions in your browser bar.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSend = async (customText = null) => {
    const queryText = customText || inputText;
    if (!queryText || !queryText.trim()) return;

    const userMsg = {
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat', {
        message: queryText,
        profile: profile
      });

      const { reply, updated_profile, top_recommendation, nlu, action_type } = response.data;

      // Update global profile state if updated by AI
      if (updated_profile && onProfileUpdate) {
        onProfileUpdate(updated_profile);
      }

      // Display toast if entities were auto-captured
      if (nlu?.entities && (nlu.entities.capital || nlu.entities.land_acres || (nlu.entities.skills && nlu.entities.skills.length > 0))) {
        setLastExtractedNotice(nlu.entities);
        setTimeout(() => setLastExtractedNotice(null), 6000);
      }

      const aiMsg = {
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        entities: nlu?.entities,
        topRec: top_recommendation,
        actionType: action_type
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (autoSpeak) {
        speakText(reply);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: "Decision engine is updating. Please ensure backend services are active.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Live Synced Profile Status Bar */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center font-bold text-emerald-300">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                Live Synced Entrepreneur Data
              </span>
              <span className="bg-emerald-600/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                Auto-Updating from Voice
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs mt-1 text-emerald-100 font-medium">
              <span><strong>Capital:</strong> ₹{(profile.available_capital || 0).toLocaleString('en-IN')}</span>
              <span>•</span>
              <span><strong>Land:</strong> {profile.land_acres || 0} Acres</span>
              <span>•</span>
              <span className="capitalize"><strong>Skills:</strong> {(profile.skills || ['farming']).slice(0, 2).join(', ')}</span>
              <span>•</span>
              <span><strong>Location:</strong> {profile.village_name || 'Nashik'} ({profile.latitude?.toFixed(2)}°N, {profile.longitude?.toFixed(2)}°E)</span>
            </div>
          </div>
        </div>

        {/* Live Location & Voice Audio Toggles */}
        <div className="flex items-center space-x-2">
          <button
            onClick={detectLiveGPSInChat}
            disabled={gpsDetecting}
            className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
            title="Detect device GPS location"
          >
            <Navigation className={`w-3.5 h-3.5 ${gpsDetecting ? 'animate-spin' : ''}`} />
            <span>{gpsDetecting ? 'Locating...' : '📍 Detect Live GPS'}</span>
          </button>

          <button
            onClick={() => setAutoSpeak(!autoSpeak)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              autoSpeak ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white/10 text-emerald-200 hover:bg-white/20'
            }`}
            title="Toggle automatic audio response"
          >
            {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{autoSpeak ? 'Voice: ON' : 'Voice: OFF'}</span>
          </button>
        </div>
      </div>

      {/* Floating Auto-Extracted Toast Alert */}
      {lastExtractedNotice && (
        <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-950 p-3.5 rounded-2xl shadow-lg flex items-center justify-between animate-bounce">
          <div className="flex items-center space-x-2.5 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="font-extrabold block text-emerald-900">
                Data Automatically Ingested Into Profile!
              </span>
              <span className="text-slate-700">
                {lastExtractedNotice.capital && `Capital: ₹${lastExtractedNotice.capital.toLocaleString('en-IN')} | `}
                {lastExtractedNotice.land_acres && `Land: ${lastExtractedNotice.land_acres} Acres | `}
                {lastExtractedNotice.skills && `Skills: ${lastExtractedNotice.skills.join(', ')}`}
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('recommendations')}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1"
          >
            <span>View Plan</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Quick Suggestions Row */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-center space-x-2 overflow-x-auto text-xs">
        <span className="font-semibold text-slate-500 whitespace-nowrap flex items-center">
          <HelpCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
          Quick Queries:
        </span>
        <button
          onClick={() => handleSend("kya aap mera location bata sakte hain current location")}
          className="bg-blue-50 hover:bg-blue-100 text-blue-900 px-3 py-1.5 rounded-full whitespace-nowrap transition border border-blue-200 font-bold"
        >
          📍 मेरा करंट लोकेशन क्या है?
        </button>
        <button
          onClick={() => handleSend(t.quickPrompt1)}
          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full whitespace-nowrap transition border border-emerald-200 font-medium"
        >
          {t.quickPrompt1}
        </button>
        <button
          onClick={() => handleSend(t.quickPrompt2)}
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-full whitespace-nowrap transition font-medium"
        >
          {t.quickPrompt2}
        </button>
      </div>

      {/* Chat Messages Window */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 min-h-[440px] max-h-[540px] overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm space-y-2.5 ${
                msg.sender === 'user'
                  ? 'bg-emerald-800 text-white rounded-br-none'
                  : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none'
              }`}
            >
              <div className="flex items-center justify-between text-xs opacity-75 mb-1">
                <span className="font-semibold flex items-center space-x-1">
                  {msg.sender === 'ai' && <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-600" />}
                  {msg.sender === 'user' ? 'Rural Entrepreneur' : 'UdyamSetu AI Advisor'}
                </span>
                <span>{msg.timestamp}</span>
              </div>

              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>

              {/* Specific Interactive Action: SHOW_LOCATION_ACTIONS */}
              {msg.actionType === 'SHOW_LOCATION_ACTIONS' && (
                <div className="bg-white p-3.5 rounded-xl border border-emerald-300 space-y-2.5 shadow-sm text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-emerald-600" />
                      Current Location Settings
                    </span>
                    <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded">
                      GPS Synced
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Your 10 km hyper-local market analysis, competitor counts, and mandi linkages are computed relative to this spot.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={detectLiveGPSInChat}
                      disabled={gpsDetecting}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1.5 shadow-sm transition"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{gpsDetecting ? 'Detecting Live GPS...' : '📍 Use Device Live GPS Now'}</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('market')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1 transition"
                    >
                      <span>Open Interactive Map</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Extracted NLU Entities Visualizer */}
              {msg.entities && (msg.entities.capital || msg.entities.land_acres || (msg.entities.skills && msg.entities.skills.length > 0)) && (
                <div className="bg-white/90 backdrop-blur rounded-xl p-3 border border-emerald-300 text-xs space-y-1.5 text-slate-800 shadow-sm">
                  <div className="font-bold text-emerald-900 flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                    Auto-Extracted Parameters (Saved to Profile):
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.entities.capital && (
                      <span className="bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-lg font-bold">
                        💰 Capital: ₹{msg.entities.capital.toLocaleString('en-IN')}
                      </span>
                    )}
                    {msg.entities.land_acres && (
                      <span className="bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-lg font-bold">
                        🌾 Land: {msg.entities.land_acres} Acres
                      </span>
                    )}
                    {msg.entities.skills && msg.entities.skills.map((s, i) => (
                      <span key={i} className="bg-teal-100 text-teal-900 px-2.5 py-1 rounded-lg font-bold capitalize">
                        🛠️ {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Recommendation Summary Card inline if applicable */}
              {msg.topRec && msg.actionType !== 'SHOW_LOCATION_ACTIONS' && (
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 rounded-xl p-3.5 text-slate-800 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-800">
                        Top Hyper-Local Recommendation
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-900">
                        {lang === 'hi' ? msg.topRec.name_hi : (lang === 'te' ? msg.topRec.name_te : msg.topRec.name_en)}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block font-semibold">Suitability</span>
                      <span className="text-lg font-black text-emerald-700 leading-tight">
                        {msg.topRec.overall_suitability_score}/100
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-200 font-medium">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Own 10% Margin:</span>
                      <span className="font-bold text-slate-900">
                        ₹{(msg.topRec.financials?.own_contribution_required || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Monthly Operating Profit:</span>
                      <span className="font-bold text-emerald-700">
                        ₹{(msg.topRec.financials?.projected_monthly_operating_profit || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('recommendations')}
                    className="w-full flex items-center justify-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white py-2 rounded-xl text-xs font-bold transition mt-1 shadow-sm"
                  >
                    <span>Inspect Full Financial & Market Blueprint</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* TTS Listen Button */}
              {msg.sender === 'ai' && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => speakText(msg.text)}
                    className="flex items-center space-x-1 text-slate-500 hover:text-emerald-700 text-xs font-semibold transition"
                    title={t.playAudio}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{t.playAudio}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl p-3.5 border border-slate-200 flex items-center space-x-3 text-xs text-slate-600">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Analyzing hyper-local GIS catchment area, competitor density & concessional loans...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Audio Waveform Animation Banner when listening */}
      {isListening && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-center justify-between text-xs text-rose-800 animate-pulse">
          <div className="flex items-center space-x-2.5 font-bold">
            <div className="flex items-center space-x-1">
              <span className="w-1.5 h-5 bg-rose-600 rounded-full animate-bounce" />
              <span className="w-1.5 h-7 bg-rose-600 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1.5 h-4 bg-rose-600 rounded-full animate-bounce [animation-delay:0.3s]" />
              <span className="w-1.5 h-6 bg-rose-600 rounded-full animate-bounce [animation-delay:0.45s]" />
            </div>
            <span>{t.voiceListening}</span>
          </div>
          <button
            onClick={toggleListening}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-xl font-bold text-xs"
          >
            {t.voiceStop}
          </button>
        </div>
      )}

      {/* Input Bar with Voice Toggle */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-sm flex items-center space-x-2">
        <button
          onClick={toggleListening}
          className={`p-3.5 rounded-xl transition flex items-center space-x-1.5 ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
          }`}
          title={isListening ? t.voiceStop : t.voiceStart}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-700" />}
          <span className="hidden sm:inline text-xs font-bold">
            {isListening ? 'Stop' : 'Tap & Speak'}
          </span>
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isListening ? t.voiceListening : "Type or speak (e.g., 'Mera current location kya hai?' or 'Mere paas ₹3 lakh hain')..."}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 focus:outline-none placeholder:text-slate-400"
        />

        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim() || isLoading}
          className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white px-5 py-3 rounded-xl font-bold text-xs transition flex items-center space-x-1"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
