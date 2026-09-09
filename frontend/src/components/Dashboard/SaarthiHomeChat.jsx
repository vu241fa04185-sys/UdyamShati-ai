import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  Keyboard, 
  Lightbulb, 
  BarChart2, 
  Wallet, 
  Landmark, 
  Bot, 
  User, 
  Loader2, 
  Volume2, 
  VolumeX, 
  Square,
  Radio,
  Headphones,
  MapPin,
  ArrowRight
} from 'lucide-react';
import axios from 'axios';
import { translations } from '../../locales/translations';
import { cleanSpeechText, configureFemaleUtterance } from '../../utils/speechVoice';
import { processSaarthiMessage } from '../../services/saarthiAgentService';
import { useSaarthi } from '../../context/SaarthiContext';

export default function SaarthiHomeChat({ profile, onProfileUpdate, setActiveTab, language = 'en' }) {
  const t = translations[language] || translations.en;

  const { setMapSearchState } = useSaarthi();

  // Canonical UdyamSarthi Greeting per Specification Section 11 (Female Persona)
  const getInitialGreeting = (lang) => {
    if (lang === 'hi') {
      return "Namaste! 🙏\n\nMain UdyamSarthi hoon. Main aapko business start ya grow karne mein help karungi.\n\nSabse pehle, kya main aapka naam jaan sakti hoon?";
    }
    if (lang === 'te') {
      return "నమస్కారం! 🙏\n\nనేను ఉద్యమ్‌సారథిని. వ్యాపారం ప్రారంభించడానికి మరియు వృద్ధి చేయడానికి నేను మీకు సహాయం చేస్తాను.\n\nముందుగా, మీ పేరు తెలుసుకోవచ్చా?";
    }
    return "Namaste! 🙏\n\nI am UdyamSarthi, your AI business advisor. I will help you start or scale your enterprise.\n\nFirst, may I know your name to get started?";
  };

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: getInitialGreeting(language),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [handsFreeMode, setHandsFreeMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [speechError, setSpeechError] = useState(null);
  const [sessionState, setSessionState] = useState({
    name: null,
    district: null,
    state: null,
    business: null,
    businessIdea: null,
    businessType: null,
    subCategory: null,
    animalType: null,
    quantity: null,
    productType: null,
    budget: null,
    landAvailable: null,
    shedAvailable: null,
    feedFodder: null,
    rawMaterial: null,
    experience: null,
    goals: null,
    lang: language
  });
  const hasVoiceStartedRef = useRef(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis || null);

  // Synchronize greeting when language changes if brand new conversation
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].sender === 'ai') {
        return [{
          sender: 'ai',
          text: getInitialGreeting(language),
          timestamp: prev[0].timestamp
        }];
      }
      return prev;
    });
    setSessionState((prev) => ({ ...prev, lang: language }));
  }, [language]);

  // Text-to-Speech Engine with Natural Female Indian AI Voice
  const speakVoice = (text, lang = language) => {
    if (!synthRef.current || !autoSpeak) return;
    
    try {
      synthRef.current.cancel(); // Stop any pending speech

      const spoken = cleanSpeechText(text);
      if (!spoken) return;

      const utterance = new SpeechSynthesisUtterance(spoken);
      const langCode = lang === 'hi' ? 'hi-IN' : (lang === 'te' ? 'te-IN' : 'en-IN');
      utterance.lang = langCode;

      // Select natural female Indian voice (Swara, Heera, Shruti, Neerja, Google) & warm pitch
      configureFemaleUtterance(utterance, synthRef.current, langCode);

      utterance.onstart = () => {
        setIsSpeaking(true);
        // Pause listening while AI speaks to prevent echo feedback
        if (isListening && recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (e) {}
          setIsListening(false);
        }
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        // Hands-free continuous voice: automatically activate microphone for user's voice reply!
        if (handsFreeMode && recognitionRef.current) {
          setTimeout(() => {
            try {
              recognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : (lang === 'te' ? 'te-IN' : 'en-IN');
              recognitionRef.current.start();
              setIsListening(true);
              setSpeechError(null);
            } catch (err) {
              // Ignore if already started
            }
          }, 600);
        }
      };

      utterance.onerror = (e) => {
        setIsSpeaking(false);
      };

      synthRef.current.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis error:", err);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : (language === 'te' ? 'te-IN' : 'en-IN');

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = 0; i < event.results.length; i++) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += trans;
          } else {
            interim += trans;
          }
        }
        setLiveTranscript(interim || final);

        if (final.trim()) {
          setIsListening(false);
          setLiveTranscript('');
          handleSend(final.trim());
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition notice:", event.error);
        setIsListening(false);
        setLiveTranscript('');
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setSpeechError("Speech input not heard clearly. Please try speaking again.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, [language, handsFreeMode]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSpeechError("Microphone speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    // If initial start of conversation and user taps mic, speak greeting first if unread
    if (!hasVoiceStartedRef.current && messages.length === 1 && !isSpeaking) {
      hasVoiceStartedRef.current = true;
      handleStartVoiceConversation();
      return;
    }

    hasVoiceStartedRef.current = true;

    // If AI is speaking, tapping mic stops AI and starts user listening
    if (isSpeaking) {
      stopSpeaking();
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
      setLiveTranscript('');
    } else {
      setSpeechError(null);
      try {
        recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : (language === 'te' ? 'te-IN' : 'en-IN');
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Mic start error:", err);
        setIsListening(false);
      }
    }
  };

  const handleSend = async (textToSend = inputText) => {
    const text = textToSend.trim();
    if (!text || isLoading) return;

    // Stop speaking immediately upon user sending
    stopSpeaking();

    // Append user message
    const userMsg = {
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputText('');
    setLiveTranscript('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat', {
        message: text,
        profile: profile || {},
        lang: language || 'hi',
        session_state: sessionState,
        history: nextMessages.slice(-6).map(m => ({ sender: m.sender, text: m.text }))
      });

      const replyText = response.data?.reply || "I am analyzing your business profile...";
      const speakTextToUse = response.data?.speak_text || replyText;
      
      // Update session state memory from backend
      if (response.data?.session_state) {
        setSessionState(response.data.session_state);
      }

      const aiMsg = {
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendations: response.data?.top_recommendation,
        actionType: response.data?.action_type,
        actionPayload: response.data?.action_payload
      };

      setMessages((prev) => [...prev, aiMsg]);

      // If backend returned profile updates, synchronize globally
      if (response.data?.updated_profile && onProfileUpdate) {
        onProfileUpdate(response.data.updated_profile);
      }

      // Speak response out loud through voice
      if (autoSpeak) {
        speakVoice(speakTextToUse, response.data?.session_state?.lang || language);
      }
    } catch (err) {
      console.warn("Backend chat API unreachable, utilizing Saarthi local agent engine:", err);
      try {
        const localResult = processSaarthiMessage({
          message: text,
          history: nextMessages,
          dossier: {
            name: sessionState.name || profile?.name || '',
            businessIdea: sessionState.business || profile?.business_idea || '',
            capital: sessionState.budget || profile?.available_capital || null,
            district: sessionState.district || profile?.district || ''
          },
          profile: profile || {},
          language: language
        });
        const fallbackReply = localResult?.reply || "Main aapki sahayata karne ke liye taiyyar hoon. Kripya apna business idea ya prashna batayein.";
        const aiMsg = {
          sender: 'ai',
          text: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, aiMsg]);
        if (autoSpeak) speakVoice(fallbackReply, language);
      } catch (fallbackErr) {
        const fallbackReply = "Main aapke vyavasayik prashna ko samajh raha hoon. Kripya apna budget aur location batayein taaki main vishleshan kar sakoon.";
        const aiMsg = {
          sender: 'ai',
          text: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, aiMsg]);
        if (autoSpeak) speakVoice(fallbackReply, language);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Start voice interaction from greeting
  const handleStartVoiceConversation = () => {
    const greeting = messages[0]?.text || getInitialGreeting(language);
    speakVoice(greeting, language);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, liveTranscript]);

  const quickActions = [
    {
      id: 'recommendations',
      title: t.quickActionFindIdea || 'Find a business idea',
      icon: Lightbulb,
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    },
    {
      id: 'recommendations',
      title: t.quickActionAnalyze || 'Analyze my business idea',
      icon: BarChart2,
      color: 'bg-emerald-600/10 text-[#0F3D2E] border-emerald-600/20'
    },
    {
      id: 'finance',
      title: t.quickActionFinances || 'Plan my finances',
      icon: Wallet,
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    },
    {
      id: 'schemes',
      title: t.quickActionSchemes || 'Explore government schemes',
      icon: Landmark,
      color: 'bg-purple-500/10 text-purple-600 border-purple-500/20'
    }
  ];

  const suggestedPrompts = [
    language === 'hi' ? "Mujhe dairy business karna hai" : (language === 'te' ? "నాకు పాడి వ్యాపారం చేయాలి" : "I want to start a dairy business"),
    language === 'hi' ? "Mere paas 3 lakh hain" : (language === 'te' ? "నా దగ్గర 3 లక్షలు ఉన్నాయి" : "I have ₹3 lakh capital"),
    language === 'hi' ? "Dairy aur poultry mein kya better hai?" : (language === 'te' ? "పాల వ్యాపారం మరియు పౌల్ట్రీలో ఏది ఉత్తమం?" : "Dairy vs poultry comparison"),
    language === 'hi' ? "5 lakh loan ki EMI kitni hogi?" : (language === 'te' ? "5 లక్షల లోన్‌కు ఈఎమ్‌ఐ ఎంత?" : "What is EMI for ₹5 lakh loan?"),
    language === 'hi' ? "Kaunsi sarkari scheme milegi?" : (language === 'te' ? "ఏ ప్రభుత్వ పథకం వర్తిస్తుంది?" : "Which government scheme is suitable?")
  ];

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl border border-emerald-900/10 flex flex-col justify-between">
      
      {/* Top Header with Voice Agent Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-3">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-all duration-300 ${
            isSpeaking 
              ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white ring-4 ring-amber-300 scale-105' 
              : isListening
              ? 'bg-gradient-to-br from-rose-500 to-rose-700 text-white ring-4 ring-rose-300 animate-pulse'
              : 'bg-gradient-to-br from-[#0F3D2E] to-[#17523f] text-amber-300'
          }`}>
            {isSpeaking ? (
              <Volume2 className="w-6 h-6 animate-pulse" />
            ) : isListening ? (
              <Mic className="w-6 h-6 animate-bounce" />
            ) : (
              <Bot className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-extrabold text-stone-900">UdyamSarthi AI Voice Agent</h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isSpeaking 
                  ? 'bg-amber-100 text-amber-800 animate-pulse' 
                  : isListening 
                  ? 'bg-rose-100 text-rose-800 animate-pulse' 
                  : 'bg-emerald-100 text-[#0F3D2E]'
              }`}>
                {isSpeaking ? '🔊 Speaking to You' : isListening ? '🎙️ Listening...' : '🟢 Voice Ready'}
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              100% Conversational Voice Advisory • Hindi, Telugu & English
            </p>
          </div>
        </div>

        {/* Voice Control Action Buttons */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition flex items-center space-x-1"
              title="Stop speaking"
            >
              <Square className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
              <span>Stop Voice</span>
            </button>
          )}

          <button
            onClick={() => setHandsFreeMode(!handsFreeMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 ${
              handsFreeMode 
                ? 'bg-emerald-50 text-[#0F3D2E] border-emerald-300' 
                : 'bg-stone-50 text-stone-600 border-stone-200'
            }`}
            title="Auto-Listen hands-free voice loop"
          >
            <Radio className={`w-3.5 h-3.5 ${handsFreeMode ? 'text-emerald-600 animate-pulse' : 'text-stone-400'}`} />
            <span>{handsFreeMode ? 'Auto-Listen: ON' : 'Auto-Listen: OFF'}</span>
          </button>

          <button
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setAutoSpeak(!autoSpeak);
            }}
            className={`p-2 rounded-xl text-xs font-bold border transition ${
              autoSpeak 
                ? 'bg-[#0F3D2E] text-amber-300 border-[#0F3D2E]' 
                : 'bg-stone-100 text-stone-500 border-stone-200'
            }`}
            title={autoSpeak ? "Voice Mute" : "Voice Unmute"}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Quick Action Cards (4 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        {quickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              onClick={() => setActiveTab(action.id)}
              className={`
                p-3.5 rounded-2xl border ${action.color} text-left transition-all duration-200 hover:-translate-y-0.5 shadow-2xs hover:shadow-md flex flex-col justify-between h-22
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-bold leading-tight truncate">{action.title}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic AI Memory Pill Bar */}
      {(sessionState.name || sessionState.district || sessionState.business || sessionState.businessIdea || sessionState.budget || sessionState.animalType || sessionState.productType || sessionState.subCategory || sessionState.landAvailable !== null || sessionState.shedAvailable !== null) && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 mb-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl text-xs font-semibold text-[#0F3D2E] animate-in fade-in slide-in-from-top-1 duration-300 shadow-2xs">
          <span className="flex items-center space-x-1 text-[11px] font-black uppercase text-emerald-900 tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#C28A17] animate-pulse" />
            <span>AI Memory:</span>
          </span>
          {sessionState.name && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-emerald-300/80 text-stone-800 shadow-2xs">
              👤 <strong className="ml-1 text-[#0F3D2E]">{sessionState.name}</strong>
            </span>
          )}
          {sessionState.district && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-emerald-300/80 text-stone-800 shadow-2xs">
              📍 <strong className="ml-1 text-[#0F3D2E]">{sessionState.district}</strong>
            </span>
          )}
          {(sessionState.business || sessionState.businessIdea) && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-emerald-300/80 text-stone-800 shadow-2xs capitalize">
              💼 <strong className="ml-1 text-[#0F3D2E]">{sessionState.business || sessionState.businessIdea}</strong>
            </span>
          )}
          {sessionState.animalType && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-emerald-300/80 text-stone-800 shadow-2xs">
              {sessionState.animalType === 'Buffalo' ? '🐃' : sessionState.animalType === 'Cow' ? '🐄' : sessionState.animalType === 'Goat' ? '🐐' : '🐔'}
              <strong className="ml-1 text-[#0F3D2E]">
                {sessionState.quantity ? `${sessionState.quantity} ` : ''}{sessionState.animalType}
              </strong>
            </span>
          )}
          {sessionState.productType && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-emerald-300/80 text-stone-800 shadow-2xs">
              🍲 <strong className="ml-1 text-[#0F3D2E]">{sessionState.productType}</strong>
            </span>
          )}
          {sessionState.subCategory && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-emerald-300/80 text-stone-800 shadow-2xs">
              🏷️ <strong className="ml-1 text-[#0F3D2E]">{sessionState.subCategory}</strong>
            </span>
          )}
          {sessionState.budget && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-emerald-300/80 text-stone-800 shadow-2xs">
              💰 <strong className="ml-1 text-[#0F3D2E]">₹{Number(sessionState.budget).toLocaleString('en-IN')}</strong>
            </span>
          )}
          {sessionState.landAvailable !== null && sessionState.landAvailable !== undefined && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-emerald-300/80 text-stone-800 shadow-2xs">
              🏡 <strong className="ml-1 text-[#0F3D2E]">Land: {sessionState.landAvailable ? 'Available' : 'Needed'}</strong>
            </span>
          )}
          {sessionState.shedAvailable !== null && sessionState.shedAvailable !== undefined && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-emerald-300/80 text-stone-800 shadow-2xs">
              🛖 <strong className="ml-1 text-[#0F3D2E]">Shed: {sessionState.shedAvailable ? 'Available' : 'Needed'}</strong>
            </span>
          )}
          {sessionState.feedFodder && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-emerald-300/80 text-stone-800 shadow-2xs">
              🌾 <strong className="ml-1 text-[#0F3D2E]">Fodder: {sessionState.feedFodder}</strong>
            </span>
          )}
          {sessionState.rawMaterial && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-emerald-300/80 text-stone-800 shadow-2xs">
              📦 <strong className="ml-1 text-[#0F3D2E]">Raw: {sessionState.rawMaterial}</strong>
            </span>
          )}
        </div>
      )}

      {/* Conversation Messages Display */}
      <div className="bg-[#FAF8F5] rounded-2xl p-4 min-h-[220px] max-h-[300px] overflow-y-auto space-y-3 border border-stone-200/60 mb-4 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
          >
            <div className={`
              max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs
              ${msg.sender === 'user' 
                ? 'bg-[#0F3D2E] text-white rounded-tr-xs' 
                : 'bg-white text-stone-800 border border-stone-200/80 rounded-tl-xs'
              }
            `}>
              <div className="flex items-center space-x-1.5 mb-1 opacity-80 text-[10px] font-semibold">
                {msg.sender === 'user' ? (
                  <>
                    <span>You (Voice Input)</span>
                    <User className="w-3 h-3 text-amber-300" />
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-[#C28A17]" />
                    <span className="text-[#0F3D2E] font-bold">UdyamSarthi</span>
                    {autoSpeak && (
                      <button 
                        onClick={() => speakVoice(msg.text, language)}
                        className="ml-2 text-stone-400 hover:text-[#0F3D2E]"
                        title="Replay Voice"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    )}
                  </>
                )}
                <span className="ml-auto">{msg.timestamp}</span>
              </div>
              <p className="whitespace-pre-line font-medium text-xs sm:text-sm">{msg.text}</p>

              {msg.actionType === 'OPEN_MAP' && (
                <div className="mt-3 pt-2 border-t border-stone-100 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      if (msg.actionPayload) {
                        setMapSearchState({
                          query: msg.actionPayload.search_query || msg.actionPayload.category || '',
                          category: msg.actionPayload.category || 'ALL',
                          radius_km: msg.actionPayload.radius_km || 5.0
                        });
                      }
                      setActiveTab('market');
                    }}
                    className="bg-[#0F3D2E] hover:bg-[#165440] text-amber-300 font-bold py-2 px-3.5 rounded-xl text-xs flex items-center space-x-1.5 transition shadow-sm"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-300" />
                    <span>
                      {language === 'hi' 
                        ? `📍 मानचित्र पर खोजें (${msg.actionPayload?.search_query || 'बाज़ार'})`
                        : (language === 'te' 
                            ? `📍 మ్యాప్‌లో చూడండి (${msg.actionPayload?.search_query || 'వ్యాపారాలు'})`
                            : `📍 Open on Map (${msg.actionPayload?.search_query || 'Nearby Places'})`)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Realtime Live Speech Feedback while speaking */}
        {isListening && liveTranscript && (
          <div className="flex justify-end animate-in fade-in duration-150">
            <div className="bg-emerald-900/10 border border-emerald-600/30 text-emerald-950 rounded-2xl p-3 text-xs italic">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-0.5">Hearing your voice:</span>
              "{liveTranscript}..."
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-xs p-3.5 flex items-center space-x-2 text-xs text-stone-500 font-medium shadow-xs">
              <Loader2 className="w-4 h-4 text-[#0F3D2E] animate-spin" />
              <span>UdyamSarthi is evaluating local market & calculations...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Main Large Central Voice Interaction Microphone */}
      <div className="flex flex-col items-center justify-center my-3 text-center">
        
        {/* Layered Circular Microphone Button */}
        <div className="relative group">
          
          {/* Animated Glow Waves when Listening */}
          {isListening && (
            <>
              <div className="absolute -inset-4 rounded-full bg-rose-400/40 animate-ping" />
              <div className="absolute -inset-8 rounded-full bg-rose-600/20 animate-pulse" />
            </>
          )}

          {/* Animated Glow Waves when Speaking */}
          {isSpeaking && (
            <>
              <div className="absolute -inset-4 rounded-full bg-amber-400/30 animate-pulse" />
              <div className="absolute -inset-8 rounded-full bg-emerald-600/20 animate-ping" />
            </>
          )}

          <button
            onClick={toggleListening}
            className={`
              relative z-10 w-22 h-22 sm:w-26 sm:h-26 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform active:scale-95
              ${isListening 
                ? 'bg-rose-600 text-white ring-8 ring-rose-200 scale-110 animate-pulse' 
                : isSpeaking
                ? 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-white ring-8 ring-amber-200 scale-105'
                : 'bg-gradient-to-br from-[#0F3D2E] via-[#144d3b] to-[#1c664f] text-amber-300 hover:shadow-2xl hover:scale-105'
              }
            `}
            title="Tap to speak with UdyamSarthi"
          >
            {isListening ? (
              <MicOff className="w-10 h-10 animate-bounce" />
            ) : isSpeaking ? (
              <Volume2 className="w-10 h-10 animate-pulse text-white" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </button>
        </div>

        {/* Live Audio Equalizer Animation / Voice Status */}
        <div className="mt-3.5 space-y-1">
          <div className="flex items-center justify-center space-x-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${
              isListening ? 'bg-rose-500 animate-ping' : isSpeaking ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600'
            }`} />
            <p className="text-sm font-black text-stone-900">
              {isListening 
                ? "🎙️ Listening to You... Speak Now!" 
                : isSpeaking 
                ? "🔊 UdyamSarthi is Speaking... Tap to Interrupt" 
                : "Tap Microphone to Talk with UdyamSarthi"}
            </p>
          </div>

          <p className="text-xs text-stone-500 font-medium">
            Speak naturally in <span className="text-[#0F3D2E] font-bold">English</span>, <span className="text-[#0F3D2E] font-bold">हिंदी (Hinglish)</span> or <span className="text-[#0F3D2E] font-bold">తెలుగు</span>
          </p>

          {/* Prompt to start initial voice conversation */}
          {messages.length === 1 && !isSpeaking && !isListening && (
            <button
              onClick={handleStartVoiceConversation}
              className="mt-2 inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-emerald-50 text-[#0F3D2E] border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition shadow-2xs"
            >
              <Headphones className="w-3.5 h-3.5 text-emerald-700" />
              <span>🔊 Click to Hear UdyamSarthi Greeting</span>
            </button>
          )}

          {speechError && (
            <p className="text-xs text-rose-600 mt-1 font-semibold">{speechError}</p>
          )}
        </div>
      </div>

      {/* Alternative Text Input for noisy environments */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }} 
        className="relative mt-4"
      >
        <div className="flex items-center bg-[#FAF8F5] border border-stone-300 focus-within:border-[#0F3D2E] focus-within:ring-2 focus-within:ring-[#0F3D2E]/10 rounded-2xl px-3.5 py-2 shadow-xs transition">
          <Keyboard className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.chatPlaceholder || "Or type your message here if in a noisy area..."}
            className="w-full bg-transparent text-stone-800 text-xs sm:text-sm focus:outline-none placeholder:text-stone-400 font-medium"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="ml-2 p-2 rounded-xl bg-[#0F3D2E] text-amber-300 hover:bg-[#165440] disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Suggested Voice Prompts ("Try saying...") */}
      <div className="mt-4 pt-3.5 border-t border-stone-100">
        <p className="text-xs font-bold text-stone-500 mb-2 flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-[#C28A17]" />
          <span>{language === 'hi' ? 'बोल कर देखें (Voice Prompts):' : (language === 'te' ? 'మాట్లాడి చూడండి:' : 'Try Speaking:')}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestedPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="px-3 py-1.5 rounded-full bg-[#FAF8F5] hover:bg-[#0F3D2E] text-stone-700 hover:text-amber-300 text-xs font-medium border border-stone-200/80 hover:border-[#0F3D2E] transition duration-200 shadow-2xs"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
