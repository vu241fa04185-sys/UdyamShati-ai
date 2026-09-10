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
  Crosshair,
  User,
  Bot
} from 'lucide-react';
import axios from 'axios';
import { detectAccurateLocation } from '../utils/geolocation';
import { cleanSpeechText, configureFemaleUtterance } from '../utils/speechVoice';
import { useSaarthi } from '../context/SaarthiContext';
import { extractBusinessIntent } from '../utils/businessPlanEngine';
import { translations } from '../locales/translations';
import { getTranslatedQuestion } from '../utils/interviewQuestions';

export default function ChatAssistant({ lang = 'en', profile, onProfileUpdate, setActiveTab }) {
  const t = translations[lang] || translations.en;
  
  const { 
    personalPlans, 
    createPlanFromIntent, 
    updatePlan, 
    setActivePlanId, 
    pendingBusinessIdea, 
    setPendingBusinessIdea 
  } = useSaarthi();

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      questionId: 'ask_name',
      text: lang === 'hi' 
        ? "Namaste! Main UdyamSarthi hoon. Main aapko aapke liye suitable business choose aur plan karne mein help karungi.\n\nSabse pehle, aapka naam kya hai?"
        : lang === 'te'
        ? "నమస్కారం! నేను ఉద్యమ్‌సారథిని. మీకు తగిన వ్యాపారాన్ని ఎంచుకోవడంలో మరియు ప్రణాళిక రూపొందించడంలో నేను సహాయం చేస్తాను.\n\nముందుగా, మీ పేరు ఏమిటి?"
        : "Namaste! I am UdyamSarthi. I will help you choose and plan a suitable business for you.\n\nFirst, what is your name?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      entities: null,
      topRec: null,
      quickReplies: []
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [gpsDetecting, setGpsDetecting] = useState(false);
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
    lang: lang
  });

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const accumulatedTranscriptRef = useRef('');
  const silenceTimeoutRef = useRef(null);
  const maxSessionTimeoutRef = useRef(null);
  const langRef = useRef(lang);
  const handleSendRef = useRef(null);
  const isProcessingAnswerRef = useRef(false);
  const activeUtteranceRef = useRef(null);

  // Sync language changes dynamically during conversation
  useEffect(() => {
    langRef.current = lang;
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : (lang === 'te' ? 'te-IN' : 'en-IN');
    }

    setMessages((prev) => {
      if (!prev || prev.length === 0) return prev;
      const lastIdx = prev.length - 1;
      const lastMsg = prev[lastIdx];

      if (lastMsg && lastMsg.sender === 'ai') {
        const qId = lastMsg.questionId || (prev.length === 1 ? 'ask_name' : null);
        if (qId) {
          const translated = getTranslatedQuestion(qId, lang, sessionState);
          if (translated) {
            const updated = [...prev];
            updated[lastIdx] = {
              ...lastMsg,
              text: translated.message,
              quickReplies: translated.quickReplies,
              questionId: qId,
              language: lang
            };
            return updated;
          }
        }
      }
      return prev;
    });

    setSessionState((prev) => ({ ...prev, lang }));
  }, [lang]);

  // Trigger full dynamic business analysis and creation
  const handleConfirmAndAnalyze = (intentData) => {
    setIsLoading(true);
    const targetIntent = intentData || pendingBusinessIdea || extractBusinessIntent(inputText, profile);
    const newPlan = createPlanFromIntent(targetIntent);

    const successMsg = {
      sender: 'ai',
      text: lang === 'hi'
        ? `🎉 आपकी **${newPlan.businessName}** व्यावसायिक योजना तैयार है! उपयुक्तता स्कोर: ${newPlan.suitabilityScore}/100। नीचे बटन पर क्लिक करके अपना संपूर्ण विश्लेषण देखें।`
        : (lang === 'te'
          ? `🎉 మీ **${newPlan.businessName}** వ్యాపార ప్రణాళిక సిద్ధంగా ఉంది! అనుకూలత స్కోరు: ${newPlan.suitabilityScore}/100. నివేదిక చూడటానికి కింద బటన్ నొక్కండి.`
          : `🎉 Your **${newPlan.businessName}** Business Plan is Ready! Suitability Score: ${newPlan.suitabilityScore}/100. Click below to inspect your full analysis.`),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionType: 'SHOW_PERSONAL_RECOMMENDATION',
      planId: newPlan.id
    };

    setMessages(prev => [...prev, successMsg]);
    setIsLoading(false);

    if (autoSpeak) {
      speakText(successMsg.text);
    }
  };

  const handleConfirmUpdatePlan = (existingPlanId, intentData) => {
    setIsLoading(true);
    updatePlan(existingPlanId, {
      capital: intentData.capital,
      businessIdea: intentData.businessIdea
    });
    setActivePlanId(existingPlanId);

    const updatedMsg = {
      sender: 'ai',
      text: `Your ${intentData.businessIdea} plan has been updated and recalculated!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionType: 'SHOW_PERSONAL_RECOMMENDATION',
      planId: existingPlanId
    };

    setMessages(prev => [...prev, updatedMsg]);
    setIsLoading(false);

    if (autoSpeak) {
      speakText(updatedMsg.text);
    }
  };

  const submitSpokenAnswer = () => {
    isListeningRef.current = false;
    setIsListening(false);
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (maxSessionTimeoutRef.current) clearTimeout(maxSessionTimeoutRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    const finalTranscript = accumulatedTranscriptRef.current.trim() || inputText.trim();
    if (finalTranscript) {
      accumulatedTranscriptRef.current = '';
      setInputText('');
      handleUserAnswer(finalTranscript);
    }
  };

  // Initialize Web Speech API Recognition
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
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        accumulatedTranscriptRef.current = transcript;
        setInputText(transcript);

        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = setTimeout(() => {
          if (isListeningRef.current) {
            submitSpokenAnswer();
          }
        }, 1500);
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
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        const clean = cleanSpeechText(text);
        if (!clean) return;
        const utterance = new SpeechSynthesisUtterance(clean);
        activeUtteranceRef.current = utterance;
        const langCode = lang === 'hi' ? 'hi-IN' : (lang === 'te' ? 'te-IN' : 'en-IN');
        utterance.lang = langCode;
        configureFemaleUtterance(utterance, window.speechSynthesis, langCode);
        utterance.onend = () => {
          activeUtteranceRef.current = null;
        };
        utterance.onerror = () => {
          activeUtteranceRef.current = null;
        };
        window.speechSynthesis.speak(utterance);
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (err) {
        console.warn("TTS speak error:", err);
      }
    }
  };

  // Unified Answer Handler: Buttons and microphone execute the exact same logic
  const handleUserAnswer = async (answer) => {
    if (!answer) return;
    if (isProcessingAnswerRef.current || isLoading) {
      console.log("Answer guard active - ignoring duplicate answer submission:", answer);
      return;
    }
    isProcessingAnswerRef.current = true;

    let textToSend = '';
    if (typeof answer === 'object' && answer !== null) {
      textToSend = answer.value || answer.label || '';
    } else {
      textToSend = String(answer);
    }
    textToSend = textToSend.trim();

    if (!textToSend) {
      isProcessingAnswerRef.current = false;
      return;
    }

    if (isListeningRef.current || isListening) {
      isListeningRef.current = false;
      setIsListening(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      activeUtteranceRef.current = null;
    }

    try {
      await handleSend(textToSend);
    } finally {
      isProcessingAnswerRef.current = false;
    }
  };

  const handleSend = async (textToSend = null) => {
    const rawVal = typeof textToSend === 'object' && textToSend !== null ? (textToSend.value || textToSend.label) : textToSend;
    const rawLabel = typeof textToSend === 'object' && textToSend !== null ? textToSend.label : textToSend;
    const query = rawVal || inputText;
    const displayQuery = rawLabel || inputText;
    if (!query || !String(query).trim()) return;

    const userMsg = {
      sender: 'user',
      text: displayQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat', {
        message: query,
        profile: profile,
        lang: lang,
        session_state: { ...sessionState, lang },
        history: [...messages, userMsg].slice(-6).map(m => ({ sender: m.sender, text: m.text }))
      });

      const responseText = response.data?.reply || response.data?.response || response.data?.message || "I have received your request and updated your business context.";
      const { updated_profile, top_recommendation, session_state: updatedSessionState, questionId, question_id, language: respLang } = response.data;

      if (updatedSessionState) {
        setSessionState(updatedSessionState);
      }

      const aiMsg = {
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        entities: response.data?.entities,
        topRec: top_recommendation || response.data?.top_recommendation,
        actionType: response.data?.action_type,
        quickReplies: response.data?.quickReplies || [],
        questionId: questionId || question_id,
        language: respLang || lang
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (autoSpeak) {
        speakText(responseText);
      }

      if (updated_profile && onProfileUpdate) {
        onProfileUpdate(updated_profile);
      }

    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: lang === 'hi'
            ? "क्षमा करें, सर्वर से संपर्क स्थापित करने में समस्या हुई।"
            : (lang === 'te'
              ? "క్షమించండి, సర్వర్ కనెక్షన్ సమస్య ఏర్పడింది."
              : "Apologies, I encountered a temporary network issue."),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  handleSendRef.current = handleSend;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-md border border-stone-200/80 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900">
            {t.myConversationsTitle || "My Conversations"}
          </h1>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            {t.myConversationsSubtitle || "Continue where you left off."}
          </p>
        </div>

        <button
          onClick={() => setAutoSpeak(!autoSpeak)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            autoSpeak ? 'bg-[#0F3D2E] text-amber-300' : 'bg-stone-100 text-stone-600'
          }`}
        >
          {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span>{autoSpeak ? 'Voice: ON' : 'Voice: OFF'}</span>
        </button>
      </div>

      {/* Messages Window */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-stone-200 min-h-[350px] max-h-[500px] overflow-y-auto space-y-4 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`
              max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs
              ${msg.sender === 'user'
                ? 'bg-[#0F3D2E] text-white rounded-tr-xs'
                : 'bg-stone-50 text-stone-800 border border-stone-200/80 rounded-tl-xs'
              }
            `}>
              <div className="flex items-center space-x-2 mb-1.5 opacity-80 text-[11px] font-semibold">
                {msg.sender === 'user' ? (
                  <>
                    <span>You</span>
                    <User className="w-3.5 h-3.5 text-amber-300" />
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#C28A17]" />
                    <span className="text-[#0F3D2E] font-bold">UdyamSaarthi</span>
                  </>
                )}
                <span className="ml-auto">{msg.timestamp}</span>
              </div>

              <p className="whitespace-pre-line font-medium">{msg.text}</p>

              {msg.quickReplies && msg.quickReplies.length > 0 && idx === messages.length - 1 && (
                <div className="mt-3 pt-2 border-t border-stone-200/60 flex flex-wrap gap-1.5">
                  {msg.quickReplies.map((opt, oIdx) => {
                    const label = typeof opt === 'object' ? opt.label : opt;
                    const val = typeof opt === 'object' ? (opt.value || opt.label) : opt;
                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleUserAnswer(opt)}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-[#0F3D2E] text-[#0F3D2E] hover:text-white border border-emerald-300 font-semibold text-xs transition shadow-2xs cursor-pointer active:scale-95"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {msg.sender === 'ai' && (
                <div className="mt-2 pt-1 border-t border-stone-200/60 flex items-center justify-end">
                  <button
                    onClick={() => speakText(msg.text)}
                    className="flex items-center space-x-1 text-stone-500 hover:text-[#0F3D2E] text-xs font-semibold cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{t.playAudio || "Listen to Audio Advisory"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-stone-100 rounded-2xl p-3.5 border border-stone-200 flex items-center space-x-3 text-xs text-stone-600 font-medium">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0F3D2E] animate-pulse" />
              <span>Analyzing business context & generating response...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="bg-white rounded-2xl p-3 border border-stone-300 shadow-md flex items-center space-x-2">
        <button
          onClick={toggleListening}
          className={`p-3 rounded-xl transition flex items-center space-x-1.5 ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
          }`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-[#0F3D2E]" />}
          <span className="hidden sm:inline text-xs font-bold">
            {isListening ? t.stopListening || 'Stop' : t.tapAndSpeak || 'Tap & Speak'}
          </span>
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleUserAnswer(inputText)}
          placeholder={isListening ? t.listeningState : (t.typeMessagePlaceholder || "Type or speak your message...")}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-stone-900 focus:outline-none placeholder:text-stone-400 font-medium"
        />

        <button
          onClick={() => handleUserAnswer(inputText)}
          disabled={!inputText.trim() || isLoading}
          className="bg-[#0F3D2E] hover:bg-[#165440] disabled:opacity-40 text-amber-300 px-5 py-3 rounded-xl font-bold text-xs transition flex items-center space-x-1"
        >
          <span>{t.send || "Send"}</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Popular Business Ideas in Rural Areas */}
      <div className="mt-8 pt-6 border-t border-stone-200/80">
        <div className="mb-4">
          <h3 className="text-base font-extrabold text-stone-900">
            {t.popularIdeasTitle || "Popular Business Ideas in Rural Areas"}
          </h3>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            {t.popularIdeasSubtitle || "Top-rated, low-risk micro-enterprises with government scheme support."}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { title: t.ideaDairy || 'Dairy & Milk Products', query: 'I want to analyze starting a Dairy & Milk Products business' },
            { title: t.ideaFoodProcessing || 'Food Processing', query: 'Tell me about setting up a Food Processing & Flour Mill unit' },
            { title: t.ideaRetail || 'Retail Stores', query: 'What is required to start a Rural Retail & Kirana store?' },
            { title: t.ideaAgriInputs || 'Agri Inputs & Services', query: 'How to start an Agri Inputs, Seeds & Fertilizer business?' },
            { title: t.ideaHandicrafts || 'Handicrafts', query: 'Explore Handicrafts & Artisan enterprise opportunities' },
            { title: t.ideaSolar || 'Solar & Clean Energy', query: 'What is the cost and profit for a Solar Charging Kiosk?' },
            { title: t.ideaTourism || 'Rural Tourism', query: 'Tell me about Rural Tourism and Homestay business' },
            { title: t.ideaMore || 'More Ideas...', query: 'Suggest top high-profit business ideas for rural areas' }
          ].map((idea, idx) => (
            <button
              key={idx}
              onClick={() => handleUserAnswer(idea.query)}
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
