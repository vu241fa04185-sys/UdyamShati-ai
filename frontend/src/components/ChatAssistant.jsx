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
import { detectAccurateLocation } from '../utils/geolocation';
import { translations } from '../locales/translations';

export default function ChatAssistant({ lang, profile, onProfileUpdate, setActiveTab }) {
  const t = translations[lang] || translations.en;
  
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: lang === 'hi' 
        ? "नमस्ते! मैं आपका उद्यमसारथी एआई सलाहकार हूँ। आप बोलकर या लिखकर सवाल पूछ सकते हैं — जैसे 'मेरा करंट लोकेशन क्या है?', 'मेरे पास 3 लाख रुपये हैं', या 'डेयरी लोन की ईएमआई कितनी होगी?'।"
        : lang === 'te'
        ? "నమస్కారం! నేను మీ ఉద్యమ్ సారథి ఏఐ సలహాదారుని. మాట్లాడండి — మీ వివరాలు మరియు ప్రశ్నలకు తక్షణ సమాధానం లభిస్తుంది."
        : "Welcome to UdyamSarthi AI! Speak or type naturally — ask about your location, suggest a business for your capital, or calculate loan EMIs.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      entities: null,
      topRec: null,
      actionType: null
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true); // Default ON so AI talks with user
  const [lastExtractedNotice, setLastExtractedNotice] = useState(null);
  const [gpsDetecting, setGpsDetecting] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const accumulatedTranscriptRef = useRef('');
  const silenceTimeoutRef = useRef(null);
  const maxSessionTimeoutRef = useRef(null);
  const langRef = useRef(lang);
  const handleSendRef = useRef(null);

  useEffect(() => {
    langRef.current = lang;
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : (lang === 'te' ? 'te-IN' : 'en-IN');
    }
  }, [lang]);

  const submitSpokenAnswer = (transcriptToSubmit = null) => {
    const raw = (transcriptToSubmit || accumulatedTranscriptRef.current || inputText || '').trim();
    isListeningRef.current = false;
    setIsListening(false);

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (maxSessionTimeoutRef.current) {
      clearTimeout(maxSessionTimeoutRef.current);
      maxSessionTimeoutRef.current = null;
    }

    try {
      if (recognitionRef.current) recognitionRef.current.stop();
    } catch (e) {}

    if (raw) {
      setInputText(raw);
      accumulatedTranscriptRef.current = '';
      handleSendRef.current?.(raw);
    }
  };

  // Initialize Web Speech API Recognition with keep-alive
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = langRef.current === 'hi' ? 'hi-IN' : (langRef.current === 'te' ? 'te-IN' : 'en-IN');

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (final) {
          accumulatedTranscriptRef.current = (accumulatedTranscriptRef.current + ' ' + final).trim();
        }

        const combined = (accumulatedTranscriptRef.current + ' ' + interim).trim();
        if (combined) {
          setInputText(combined);
        }

        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        if (combined.length > 0) {
          silenceTimeoutRef.current = setTimeout(() => {
            if (isListeningRef.current) {
              submitSpokenAnswer();
            }
          }, 2000);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === 'no-speech') return; // Do not abort, keep listening
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          isListeningRef.current = false;
          setIsListening(false);
          alert("Microphone access is blocked. Please allow mic access in your browser address bar.");
          return;
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          try {
            recognition.lang = langRef.current === 'hi' ? 'hi-IN' : (langRef.current === 'te' ? 'te-IN' : 'en-IN');
            recognition.start();
          } catch (err) {
            setTimeout(() => {
              if (isListeningRef.current) {
                try { recognition.start(); } catch (e) {
                  isListeningRef.current = false;
                  setIsListening(false);
                }
              }
            }, 300);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      isListeningRef.current = false;
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (maxSessionTimeoutRef.current) clearTimeout(maxSessionTimeoutRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isListening]);

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      alert("Microphone speech recognition is not supported in this browser. Please type your message.");
      return;
    }

    if (isListening || isListeningRef.current) {
      submitSpokenAnswer();
      return;
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
      } catch (err) {
        if (err.name === 'NotAllowedError') {
          alert("Microphone access is blocked. Please allow mic access in your browser settings.");
          return;
        }
      }
    }

    try {
      accumulatedTranscriptRef.current = '';
      recognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : (lang === 'te' ? 'te-IN' : 'en-IN');
      isListeningRef.current = true;
      setIsListening(true);
      recognitionRef.current.start();

      if (maxSessionTimeoutRef.current) clearTimeout(maxSessionTimeoutRef.current);
      maxSessionTimeoutRef.current = setTimeout(() => {
        if (isListeningRef.current) submitSpokenAnswer();
      }, 15000);
    } catch (err) {
      if (err.name === 'InvalidStateError') {
        isListeningRef.current = true;
        setIsListening(true);
      } else {
        isListeningRef.current = false;
        setIsListening(false);
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

  // Detect Live GPS & Network location when requested by user or chat button
  const detectLiveGPSInChat = async () => {
    setGpsDetecting(true);

    const result = await detectAccurateLocation();

    if (result.success) {
      const newProfile = {
        ...profile,
        latitude: result.latitude,
        longitude: result.longitude,
        village_name: result.village_name,
        district: result.district,
        state: result.state,
        pincode: result.pincode || profile.pincode
      };

      if (onProfileUpdate) onProfileUpdate(newProfile);

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `📍 आपकी लाइव लोकेशन सफलतापूर्वक लॉक हो गई है!\n• स्थान: **${result.village_name}, ${result.district} (${result.state})**\n• GPS निर्देशांक: **${result.latitude.toFixed(4)}° N, ${result.longitude.toFixed(4)}° E**\n• स्रोत: **${result.source === 'gps_device' ? 'हार्डवेयर GPS सैटेलाइट' : 'लाइव नेटवर्क / WiFi ट्राइएंगुलेशन'}**\n\nअब 5-10 किमी का बाजार नक्शा और व्यावसायिक सिफारिशें आपकी इस वास्तविक लोकेशन पर अपडेट हो चुकी हैं।`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionType: 'LOCATION_LOCKED'
        }
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `⚠️ ${result.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }

    setGpsDetecting(false);
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

      const { 
        reply, 
        updated_profile, 
        top_recommendation, 
        nlu, 
        action_type, 
        comparison_table, 
        recommendation_score, 
        confidence_score, 
        financial_summary, 
        detected_language 
      } = response.data;

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
        actionType: action_type,
        comparisonTable: comparison_table,
        recommendationScore: recommendation_score,
        confidenceScore: confidence_score,
        financialSummary: financial_summary,
        detectedLanguage: detected_language
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (autoSpeak) {
        speakText(reply, detected_language);
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

  handleSendRef.current = handleSend;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <div>
          <h1 className="text-xl font-black text-stone-900">My Conversations</h1>
          <p className="text-xs text-stone-500 font-medium">Continue where you left off with Saarthi AI.</p>
        </div>
      </div>

      {/* Top Banner Status Info */}
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

      {/* Hero CTA Banner: Talk with AI to Fill Farmer Form */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 border border-emerald-600/50">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center font-bold text-amber-300 text-xl shrink-0 shadow-inner">
            🎙️
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-black/20 px-2 py-0.5 rounded-full">
                Interactive Voice Interview
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            </div>
            <h3 className="text-sm md:text-base font-black text-white mt-0.5">
              {lang === 'hi' 
                ? 'एआई से बोलकर किसान फ़ॉर्म भरें (Talk with AI to Fill Form)'
                : lang === 'te'
                ? 'ఏఐ తో మాట్లాడి ఫారమ్ పూరించండి (Talk with AI to Fill Form)'
                : 'Talk with AI to Fill Your Entrepreneur Form'}
            </h3>
            <p className="text-[11px] text-emerald-100">
              {lang === 'hi'
                ? 'एआई आपसे नाम, गाँव, पूँजी, जमीन और कौशल बोलकर एक-एक करके पूछेगा और फ़ॉर्म भर देगा।'
                : 'The AI interviewer asks all 7 details step-by-step with voice and fills your form.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('profile')}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs shadow-lg transition transform hover:scale-105 flex items-center space-x-2 shrink-0"
        >
          <span>{lang === 'hi' ? '🎙️ बोलकर फ़ॉर्म शुरू करें' : '🎙️ Start AI Voice Interview'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Suggestions Row */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-center space-x-2 overflow-x-auto text-xs">
        <span className="font-semibold text-slate-500 whitespace-nowrap flex items-center">
          <HelpCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
          Quick Queries:
        </span>
        <button
          onClick={() => handleSend("mujhe ai ke sath baat karke form bharna hai saari details pucho")}
          className="bg-amber-50 hover:bg-amber-100 text-amber-900 px-3 py-1.5 rounded-full whitespace-nowrap transition border border-amber-300 font-bold flex items-center space-x-1"
        >
          <span>🎙️ {lang === 'hi' ? 'बोलकर फ़ॉर्म भरें' : 'Fill Form with AI'}</span>
        </button>
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

              {/* Interactive Form Filling Trigger Card */}
              {msg.actionType === 'START_FORM_FILLING' && (
                <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-3.5 space-y-2.5 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">🎙️</span>
                    <div>
                      <h4 className="font-bold text-xs text-emerald-950">
                        {lang === 'hi' ? 'एआई वॉइस फ़ॉर्म इंटरव्यूअर तैयार है!' : 'AI Voice Form Interviewer is Ready!'}
                      </h4>
                      <p className="text-[11px] text-emerald-800">
                        {lang === 'hi'
                          ? 'सभी 7 विवरण बोलकर भरें — एआई आपसे एक-एक करके सवाल पूछेगा।'
                          : 'Speak to fill all 7 details — AI asks questions step-by-step.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition transform hover:-translate-y-0.5"
                  >
                    <span>🎙️ {lang === 'hi' ? 'बोलकर फ़ॉर्म स्टूडियो खोलें (Start Voice Interview)' : 'Open Voice Registration Studio'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
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

              {/* UdyamSarthi Business Comparison Table */}
              {msg.comparisonTable && msg.comparisonTable.length > 0 && (
                <div className="bg-white rounded-xl p-3.5 border border-emerald-300 shadow-sm space-y-2">
                  <div className="text-xs font-black text-emerald-950 flex items-center space-x-1.5">
                    <span>⚖️ Business Opportunity Comparison</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-stone-200 bg-stone-50 text-stone-700">
                          <th className="p-2 font-bold">Criteria</th>
                          <th className="p-2 font-bold text-emerald-800">Option 1</th>
                          <th className="p-2 font-bold text-blue-800">Option 2</th>
                        </tr>
                      </thead>
                      <tbody>
                        {msg.comparisonTable.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-stone-100 hover:bg-stone-50/50">
                            <td className="p-2 font-semibold text-stone-700">{row.factor}</td>
                            <td className="p-2 font-medium text-emerald-900">{row.option_1}</td>
                            <td className="p-2 font-medium text-blue-900">{row.option_2}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* UdyamSarthi Dual Scores Badge */}
              {msg.recommendationScore && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="px-2.5 py-1 rounded-lg font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center space-x-1">
                    <span>🌟 Suitability Score:</span>
                    <span className="text-emerald-950 font-black">{msg.recommendationScore}/100</span>
                  </span>
                  {msg.confidenceScore && (
                    <span className="px-2.5 py-1 rounded-lg font-bold bg-blue-100 text-blue-900 border border-blue-300 flex items-center space-x-1">
                      <span>🎯 Data Confidence:</span>
                      <span className="text-blue-950 font-black">{msg.confidenceScore}/100</span>
                    </span>
                  )}
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

      {/* Popular Business Ideas in Rural Areas (Relocated to My Conversations) */}
      <div className="mt-8 pt-6 border-t border-slate-200/80">
        <div className="mb-4">
          <h3 className="text-base font-extrabold text-stone-900">
            Popular Business Ideas in Rural Areas
          </h3>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Top-rated, low-risk micro-enterprises with government scheme support. Click any idea to analyze with Saarthi.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { title: 'Dairy & Milk Products', query: 'I want to analyze starting a Dairy & Milk Products business' },
            { title: 'Food Processing', query: 'Tell me about setting up a Food Processing & Flour Mill unit' },
            { title: 'Retail Stores', query: 'What is required to start a Rural Retail & Kirana store?' },
            { title: 'Agri Inputs & Services', query: 'How to start an Agri Inputs, Seeds & Fertilizer business?' },
            { title: 'Handicrafts', query: 'Explore Handicrafts & Artisan enterprise opportunities' },
            { title: 'Solar & Clean Energy', query: 'What is the cost and profit for a Solar Charging Kiosk?' },
            { title: 'Rural Tourism', query: 'Tell me about Rural Tourism and Homestay business' },
            { title: 'More Ideas...', query: 'Suggest top high-profit business ideas for rural areas' }
          ].map((idea, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(idea.query)}
              className="p-3.5 rounded-2xl bg-white hover:bg-[#0F3D2E] text-stone-800 hover:text-white border border-stone-200 hover:border-[#0F3D2E] transition-all duration-200 text-left flex flex-col justify-between h-24 group shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-[#C28A17] group-hover:text-amber-300 transition" />
              <span className="text-xs font-bold leading-tight group-hover:text-amber-100">{idea.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
