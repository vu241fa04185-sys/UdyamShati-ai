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
  ArrowRight,
  FileText,
  Check
} from 'lucide-react';
import axios from 'axios';
import { translations } from '../../locales/translations';
import { cleanSpeechText, configureFemaleUtterance } from '../../utils/speechVoice';
import { processSaarthiMessage } from '../../services/saarthiAgentService';
import { useSaarthi } from '../../context/SaarthiContext';

export default function SaarthiHomeChat({ profile, onProfileUpdate, setActiveTab, language = 'en' }) {
  const t = translations[language] || translations.en;

  const { 
    personalPlans, 
    createPlanFromIntent, 
    updatePlan, 
    setActivePlanId, 
    pendingBusinessIdea, 
    setPendingBusinessIdea,
    setMapSearchState 
  } = useSaarthi();

  const userName = profile?.name && profile?.name !== 'Ramesh Kisan' ? profile.name : 'Entrepreneur';

  // Canonical UdyamSarthi Greeting per Specification (Female Persona)
  const getInitialGreeting = (lang, name = userName) => {
    if (lang === 'hi') {
      return `Namaste ${name}! 🙏\n\nMain UdyamSarthi hoon, aapki AI business advisor. Main aapko business start ya grow karne mein help karungi.\n\nKya aapke paas koi business idea hai, ya main aapko best opportunities suggest karoon?`;
    }
    if (lang === 'te') {
      return `నమస్కారం ${name}! 🙏\n\nనేను ఉద్యమ్‌సారథిని, మీ వ్యాపార తోడు. వ్యాపారం ప్రారంభించడానికి మరియు వృద్ధి చేయడానికి నేను మీకు సహాయం చేస్తాను.\n\nమీ మనస్సులో ఏదైనా వ్యాపార ఆలోచన ఉందా, లేదా నేను కొన్ని అవకాశాలను సూచించమంటారా?`;
    }
    return `Hello ${name}! 🙏\n\nI am UdyamSarthi, your AI business advisor. I will help you start or scale your enterprise.\n\nDo you already have a business idea in mind, or would you like me to suggest some opportunities for you?`;
  };

  // Live Dossier State for Business Plan creation (Clean for fresh conversation)
  const [dossier, setDossier] = useState({
    name: userName,
    businessIdea: '',
    categoryCode: 'GENERAL_ENTERPRISE',
    location: null,
    capital: null,
    land: null,
    landOwnership: null,
    infrastructure: {},
    experience: null,
    scale: 'Small',
    completeness: 15
  });

  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Conversation & Agent States
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: getInitialGreeting(language, userName),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionType: 'INITIAL_GREETING_CHOICE'
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
    name: userName,
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

  const [lastQuestionType, setLastQuestionType] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis || null);
  const isListeningRef = useRef(false);
  const accumulatedTranscriptRef = useRef('');
  const silenceTimeoutRef = useRef(null);
  const languageRef = useRef(language);
  const hasVoiceStartedRef = useRef(false);

  // Synchronize language ref
  useEffect(() => {
    languageRef.current = language;
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : (language === 'te' ? 'te-IN' : 'en-IN');
    }
  }, [language]);

  // Synchronize dossier & session user name if profile updates
  useEffect(() => {
    if (profile?.name && profile.name !== 'Ramesh Kisan' && profile.name !== dossier.name) {
      setDossier(prev => ({ ...prev, name: profile.name }));
      setSessionState(prev => ({ ...prev, name: profile.name }));
    }
  }, [profile?.name]);

  // Reset Conversation mechanism for a fresh chat session
  const handleResetConversation = () => {
    const currentName = profile?.name && profile.name !== 'Ramesh Kisan' ? profile.name : 'Entrepreneur';
    setDossier({
      name: currentName,
      businessIdea: '',
      categoryCode: 'GENERAL_ENTERPRISE',
      location: null,
      capital: null,
      land: null,
      landOwnership: null,
      infrastructure: {},
      experience: null,
      scale: 'Small',
      completeness: 15
    });
    setSessionState({
      name: currentName,
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
    setMessages([
      {
        sender: 'ai',
        text: getInitialGreeting(language, currentName),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType: 'INITIAL_GREETING_CHOICE'
      }
    ]);
    setLastQuestionType(null);
  };

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
        if (isListeningRef.current && recognitionRef.current) {
          isListeningRef.current = false;
          setIsListening(false);
          try { recognitionRef.current.stop(); } catch (e) {}
        }
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        // Hands-free continuous voice: automatically activate microphone for user's voice reply
        if (handsFreeMode && recognitionRef.current) {
          setTimeout(() => {
            startListeningVoice();
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

  const startListeningVoice = () => {
    if (!recognitionRef.current) {
      setSpeechError("Microphone speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
    }

    setSpeechError(null);
    setLiveTranscript('');
    accumulatedTranscriptRef.current = '';
    isListeningRef.current = true;
    setIsListening(true);

    try {
      recognitionRef.current.lang = languageRef.current === 'hi' ? 'hi-IN' : (languageRef.current === 'te' ? 'te-IN' : 'en-IN');
      recognitionRef.current.start();
    } catch (err) {
      console.warn("Speech start notice:", err);
      setIsListening(true);
    }
  };

  const stopListeningVoice = (shouldSubmit = false) => {
    isListeningRef.current = false;
    setIsListening(false);

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    try {
      if (recognitionRef.current) recognitionRef.current.stop();
    } catch (e) {}

    const fullSpoken = (accumulatedTranscriptRef.current + ' ' + liveTranscript).trim();
    accumulatedTranscriptRef.current = '';
    setLiveTranscript('');

    if (shouldSubmit && fullSpoken) {
      handleSend(fullSpoken, true);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListeningVoice(true);
    } else {
      startListeningVoice();
    }
  };

  // Initialize Speech Recognition with continuous listening and keep-alive
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;       // Continuous: DO NOT cut off on natural pauses!
      recognition.interimResults = true;   // Live transcript stream
      recognition.maxAlternatives = 1;
      recognition.lang = languageRef.current === 'hi' ? 'hi-IN' : (languageRef.current === 'te' ? 'te-IN' : 'en-IN');

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        setSpeechError(null);
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
          setLiveTranscript(combined);
          setInputText(combined);

          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }

          // Auto-send after 2 seconds of silence once speech is detected
          silenceTimeoutRef.current = setTimeout(() => {
            if (isListeningRef.current) {
              stopListeningVoice(true);
            }
          }, 2000);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition notice:", event.error);
        if (event.error === 'no-speech') {
          return;
        }

        if (event.error === 'aborted') {
          return;
        }

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          isListeningRef.current = false;
          setIsListening(false);
          setSpeechError("Microphone access is blocked. Please allow microphone permission in your browser address bar.");
          return;
        }

        if (event.error === 'network') {
          isListeningRef.current = false;
          setIsListening(false);
          setSpeechError("Speech network service unavailable. (Note: If using Brave Browser, enable Google Services in brave://settings/system, switch to Chrome/Edge, or type below).");
          return;
        }

        setSpeechError("Speech input not heard clearly. Please try speaking again or type your message.");
      };

      recognition.onend = () => {
        // Keep-alive loop: If user is actively listening, restart recognition automatically!
        if (isListeningRef.current) {
          try {
            recognition.lang = languageRef.current === 'hi' ? 'hi-IN' : (languageRef.current === 'te' ? 'te-IN' : 'en-IN');
            recognition.start();
          } catch (err) {
            setTimeout(() => {
              if (isListeningRef.current) {
                try {
                  recognition.start();
                } catch (e) {
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
      if (synthRef.current) synthRef.current.cancel();
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
  }, []);

  const handleConfirmAndAnalyze = (customIntent = null) => {
    const targetIntent = customIntent || pendingBusinessIdea || {
      businessIdea: dossier.businessIdea || 'Rural Enterprise',
      categoryCode: dossier.categoryCode || 'GENERAL_ENTERPRISE',
      location: dossier.location ? { village: dossier.location, district: dossier.location, state: 'Andhra Pradesh' } : { village: 'Vadlamudi', district: 'Guntur', state: 'Andhra Pradesh' },
      capital: dossier.capital || 300000,
      land: dossier.land || '2 Acres',
      experience: dossier.experience || 'Experienced',
      scale: dossier.scale || 'Small'
    };

    if (createPlanFromIntent) {
      const newPlan = createPlanFromIntent(targetIntent);
      if (newPlan?.id && setActivePlanId) {
        setActivePlanId(newPlan.id);
      }
    }
    setActiveTab('recommendations');
  };

  const handleConfirmUpdatePlan = (existingPlanId, customIntent) => {
    if (existingPlanId && updatePlan) {
      updatePlan(existingPlanId, customIntent);
      if (setActivePlanId) setActivePlanId(existingPlanId);
    }
    setActiveTab('recommendations');
  };

  const handleSend = async (textToSend = inputText, isVoiceInput = false) => {
    const text = (typeof textToSend === 'string' ? textToSend : inputText).trim();
    if (!text || isLoading) return;

    // Stop speaking and listening immediately upon user sending
    stopSpeaking();
    stopListeningVoice(false);

    const userMsg = {
      sender: 'user',
      text: text,
      isVoice: isVoiceInput,
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
        
        // Sync dossier from session_state where applicable
        setDossier(prev => ({
          ...prev,
          name: response.data.session_state.name || prev.name,
          businessIdea: response.data.session_state.business || response.data.session_state.businessIdea || prev.businessIdea,
          location: response.data.session_state.district || prev.location,
          capital: response.data.session_state.budget || prev.capital,
          experience: response.data.session_state.experience || prev.experience
        }));
      }

      if (response.data?.action_type) {
        setLastQuestionType(response.data.action_type);
      }

      const aiMsg = {
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendations: response.data?.top_recommendation,
        actionType: response.data?.action_type,
        actionPayload: response.data?.action_payload,
        financialSummary: response.data?.financial_summary || (response.data?.action_type === 'SHOW_FINANCE' ? response.data?.action_payload : null),
        comparisonTable: response.data?.comparison_table || (response.data?.action_type === 'SHOW_COMPARISON' ? response.data?.action_payload?.comparison_table : null),
        sources: response.data?.sources,
        recommendationScore: response.data?.recommendation_score,
        confidenceScore: response.data?.confidence_score
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Handle map opening recommendation directly
      if (response.data?.action_type === 'OPEN_MAP' && response.data?.action_payload) {
        setMapSearchState({
          query: response.data.action_payload.search_query || response.data.action_payload.category || '',
          category: response.data.action_payload.category || 'ALL',
          radius_km: response.data.action_payload.radius_km || 5.0
        });
      }

      if (response.data?.updated_profile && onProfileUpdate) {
        onProfileUpdate(response.data.updated_profile);
      }

      if (autoSpeak) {
        speakVoice(speakTextToUse, response.data?.session_state?.lang || language);
      }
    } catch (err) {
      console.warn("Backend chat API unreachable, utilizing Saarthi local agent engine:", err);
      try {
        const agentResult = processSaarthiMessage({
          message: text,
          history: nextMessages,
          dossier: dossier,
          profile: profile || {},
          language: language,
          lastQuestionType: lastQuestionType
        });

        const fallbackReply = agentResult?.reply || "Main aapki sahayata karne ke liye taiyyar hoon. Kripya apna business idea ya prashna batayein.";

        if (agentResult?.updatedDossier) {
          setDossier(agentResult.updatedDossier);
          setSessionState(prev => ({
            ...prev,
            name: agentResult.updatedDossier.name || prev.name,
            business: agentResult.updatedDossier.businessIdea || prev.business,
            district: agentResult.updatedDossier.location || prev.district,
            budget: agentResult.updatedDossier.capital || prev.budget,
            experience: agentResult.updatedDossier.experience || prev.experience
          }));
        }

        if (agentResult?.actionType) {
          setLastQuestionType(agentResult.actionType);
        }

        const aiMsg = {
          sender: 'ai',
          text: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionType: agentResult?.actionType,
          intentData: agentResult?.intentPayload
        };

        setMessages((prev) => [...prev, aiMsg]);

        if (agentResult?.actionType === 'CONFIRM_BUSINESS_PLAN' || (agentResult?.readyForAnalysis && agentResult?.actionType === 'CONFIRM_BUSINESS_PLAN')) {
          if (agentResult.intentPayload && setPendingBusinessIdea) {
            setPendingBusinessIdea(agentResult.intentPayload);
          }
        }

        if (autoSpeak) speakVoice(fallbackReply, language);
      } catch (fallbackErr) {
        console.error("Local agent fallback error:", fallbackErr);
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
    const greeting = messages[0]?.text || getInitialGreeting(language, userName);
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
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      prompt: language === 'hi' 
        ? "Mere budget aur location ke anusaar achha business idea batao" 
        : (language === 'te' 
            ? "నా బడ్జెట్ మరియు ప్రాంతానికి తగిన వ్యాపార ఆలోచనలను సూచించండి" 
            : "Find the best business ideas for my capital and location")
    },
    {
      id: 'recommendations',
      title: t.quickActionAnalyze || 'Analyze my business idea',
      icon: BarChart2,
      color: 'bg-emerald-600/10 text-[#0F3D2E] border-emerald-600/20',
      prompt: language === 'hi' 
        ? "Mere business idea ka feasibility aur risk analysis karein" 
        : (language === 'te' 
            ? "నా వ్యాపార ఆలోచన సాధ్యత మరియు రిస్క్ విశ్లేషణ చేయండి" 
            : "Analyze the feasibility and market risk of my business idea")
    },
    {
      id: 'finance',
      title: t.quickActionFinances || 'Plan my finances',
      icon: Wallet,
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      prompt: language === 'hi' 
        ? "Mujhe finance planning aur loan EMI calculate karni hai" 
        : (language === 'te' 
            ? "నా ఫైనాన్స్ ప్లానింగ్ మరియు లోన్ ఈఎమ్‌ఐ లెక్కించండి" 
            : "Plan my business finances and calculate loan EMI")
    },
    {
      id: 'schemes',
      title: t.quickActionSchemes || 'Explore government schemes',
      icon: Landmark,
      color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      prompt: language === 'hi' 
        ? "Mere vyavasay ke liye kaunsi sarkari scheme aur subsidy milegi?" 
        : (language === 'te' 
            ? "నా వ్యాపారానికి ఏ ప్రభుత్వ పథకాలు మరియు సబ్సిడీలు ఉన్నాయి?" 
            : "Explore government schemes and subsidies available for my business")
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
      
      {/* Top Header with Voice Agent Controls & New Chat Reset */}
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

        {/* Action Controls Header */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {/* New Conversation Reset Button */}
          <button
            onClick={handleResetConversation}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-stone-800 hover:bg-amber-200 transition shadow-2xs"
            title="Start New Conversation"
          >
            <span>🔄 New Chat</span>
          </button>

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

      {/* Dynamic AI Memory Pill Bar */}
      {(sessionState.name || sessionState.district || sessionState.business || sessionState.businessIdea || sessionState.budget || sessionState.animalType || sessionState.productType || sessionState.subCategory || sessionState.landAvailable !== null || sessionState.shedAvailable !== null) && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 my-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl text-xs font-semibold text-[#0F3D2E] animate-in fade-in slide-in-from-top-1 duration-300 shadow-2xs">
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

      {/* Main Grid: Left Chat Area & Right Live Business Plan Dossier Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-4">
        
        {/* Left Column: Chat Window & Controls (Primary, 8 of 12 columns) */}
        <div className="lg:col-span-8 space-y-4 flex flex-col justify-between">
          
          {/* Quick Choice Buttons for Initial Greeting */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (action.prompt) {
                      handleSend(action.prompt);
                    } else {
                      setActiveTab(action.id);
                    }
                  }}
                  className={`
                    p-3.5 rounded-2xl border ${action.color} text-left transition-all duration-200 hover:-translate-y-0.5 shadow-2xs hover:shadow-md flex flex-col justify-between h-20
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-bold leading-tight truncate">{action.title}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Idea & Input Helper Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleSend("Suggest best business ideas for my location")}
              className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-stone-800 border border-emerald-200 text-left transition flex items-center space-x-2 shadow-2xs group"
            >
              <div className="p-1.5 rounded-lg bg-emerald-700/10 text-[#0F3D2E] group-hover:scale-110 transition">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold leading-tight">✨ Suggest Ideas</span>
            </button>

            <button
              onClick={() => toggleListening()}
              className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-stone-800 border border-rose-200 text-left transition flex items-center space-x-2 shadow-2xs group"
            >
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-700 group-hover:scale-110 transition">
                <Mic className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold leading-tight">🎙 Voice Input</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('saarthi-text-input');
                if (el) el.focus();
              }}
              className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-stone-800 border border-blue-200 text-left transition flex items-center space-x-2 shadow-2xs group"
            >
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-700 group-hover:scale-110 transition">
                <Keyboard className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold leading-tight">⌨ Type My Idea</span>
            </button>
          </div>

          {/* Chat Message Window */}
          <div className="bg-[#FAF8F5] rounded-2xl p-4 min-h-[380px] max-h-[500px] overflow-y-auto space-y-3 border border-stone-200/60 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
              >
                <div className={`
                  max-w-[94%] sm:max-w-[88%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs
                  ${msg.sender === 'user' 
                    ? 'bg-[#0F3D2E] text-white rounded-tr-xs' 
                    : 'bg-white text-stone-800 border border-stone-200/80 rounded-tl-xs'
                  }
                `}>
                  <div className="flex items-center space-x-1.5 mb-1 opacity-80 text-[10px] font-semibold">
                    {msg.sender === 'user' ? (
                      <>
                        <span>{msg.isVoice ? 'YOU 🎙️' : 'YOU'}</span>
                        <User className="w-3 h-3 text-amber-300" />
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-[#C28A17]" />
                        <span className="text-[#0F3D2E] font-bold">UdyamSaarthi</span>
                      </>
                    )}
                    <span className="ml-auto">{msg.timestamp}</span>
                  </div>
                  
                  <p className="whitespace-pre-line font-medium text-xs sm:text-sm leading-relaxed">{msg.text}</p>

                  {/* Maps Integration Button */}
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

                  {/* Financial Analysis & EMI Structuring Card */}
                  {(msg.actionType === 'SHOW_FINANCE' || msg.financialSummary) && msg.financialSummary && (
                    <div className="mt-3 p-3.5 bg-gradient-to-br from-blue-50/95 to-indigo-50/80 border border-blue-200 rounded-2xl text-stone-800 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-900">
                          <Wallet className="w-4 h-4 text-blue-600" />
                          <span>
                            {language === 'hi' ? 'वित्तीय संरचना एवं मासिक ईएमआई' : (language === 'te' ? 'ఆర్థిక ప్రణాళిక మరియు ఈఎమ్‌ఐ సారాంశం' : 'Financial Structuring & EMI Report')}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                          DSCR: {msg.financialSummary.dscr || '2.15'}x (Safe)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className="bg-white p-2 rounded-xl border border-blue-100">
                          <span className="text-[10px] text-stone-500 block">{language === 'hi' ? 'कुल परियोजना लागत' : (language === 'te' ? 'మొత్తం ప్రాజెక్ట్ ఖర్చు' : 'Total Project Cost')}</span>
                          <strong className="text-stone-900 font-bold">₹{Number(msg.financialSummary.project_cost || 0).toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-blue-100">
                          <span className="text-[10px] text-stone-500 block">{language === 'hi' ? 'अपनी पूँजी (Margin)' : (language === 'te' ? 'సొంత పెట్టుబడి' : 'Own Contribution')}</span>
                          <strong className="text-emerald-700 font-bold">₹{Number(msg.financialSummary.own_capital || 0).toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-blue-100">
                          <span className="text-[10px] text-stone-500 block">{language === 'hi' ? 'आवश्यक बैंक ऋण' : (language === 'te' ? 'బ్యాంక్ రుణం' : 'Term Loan Required')}</span>
                          <strong className="text-blue-700 font-bold">₹{Number(msg.financialSummary.loan_amount || 0).toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-blue-100">
                          <span className="text-[10px] text-stone-500 block">{language === 'hi' ? 'मासिक EMI (@8.0%)' : (language === 'te' ? 'నెలవారీ EMI (@8.0%)' : 'Monthly EMI (@8.0%)')}</span>
                          <strong className="text-amber-700 font-bold">₹{Number(msg.financialSummary.monthly_emi || 0).toLocaleString('en-IN')}/mo</strong>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-blue-100">
                          <span className="text-[10px] text-stone-500 block">{language === 'hi' ? 'ऋण अवधि' : (language === 'te' ? 'కాలపరిమితి' : 'Tenure')}</span>
                          <strong className="text-stone-800 font-bold">{msg.financialSummary.tenure_years || 5} Years</strong>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-blue-100">
                          <span className="text-[10px] text-stone-500 block">{language === 'hi' ? 'ब्याज दर' : (language === 'te' ? 'వడ్డీ రేటు' : 'Interest Rate')}</span>
                          <strong className="text-emerald-600 font-bold">{msg.financialSummary.interest_rate_pct || 8.0}% Concessional</strong>
                        </div>
                      </div>

                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setActiveTab('finance')}
                          className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center space-x-1.5 transition shadow-xs"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>{language === 'hi' ? 'पूरा वित्तीय प्लानर खोलें' : (language === 'te' ? 'పూర్తి ఫైనాన్స్ ప్లానర్ తెరవండి' : 'Open Financial Planner')}</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </button>
                        <button
                          onClick={() => handleSend(language === 'hi' ? "इसके लिए कौनसी सरकारी सब्सिडी योजना मिलेगी?" : "Which government subsidy applies to this loan?")}
                          className="bg-white hover:bg-stone-50 text-blue-900 border border-blue-200 font-semibold py-1.5 px-3 rounded-xl text-xs flex items-center space-x-1 transition"
                        >
                          <Landmark className="w-3.5 h-3.5 text-purple-600" />
                          <span>{language === 'hi' ? 'सब्सिडी योजनाएं देखें' : (language === 'te' ? 'సబ్సిడీ పథకాలు చూడండి' : 'Check Subsidies')}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Government Schemes & Subsidies Card */}
                  {(msg.actionType === 'SHOW_SCHEMES' || msg.actionPayload?.schemes) && (
                    <div className="mt-3 p-3.5 bg-gradient-to-br from-purple-50/95 to-amber-50/80 border border-purple-200 rounded-2xl text-stone-800 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-purple-900">
                          <Landmark className="w-4 h-4 text-purple-600" />
                          <span>{language === 'hi' ? 'सत्यापित सरकारी ऋण एवं सब्सिडी योजनाएं' : (language === 'te' ? 'ధృవీకరించబడిన ప్రభుత్వ పథకాలు & సబ్సిడీలు' : 'Verified Government Schemes & Subsidies')}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                          MoSJE / NABARD / PMFME
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-purple-100 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-900">1. PMFME Scheme (MoFPI)</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">35% Subsidy (Up to ₹10L)</span>
                          </div>
                          <p className="text-[11px] text-stone-600">Credit-linked capital subsidy for micro-enterprises and agro-processing units.</p>
                          <a href="https://pmfme.mofpi.gov.in" target="_blank" rel="noreferrer" className="text-[10px] text-purple-700 font-semibold underline inline-flex items-center">
                            Official Portal: pmfme.mofpi.gov.in ↗
                          </a>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-purple-100 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-900">2. NABARD AHIDF / DEDS</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">25% - 33.3% Capital Subsidy</span>
                          </div>
                          <p className="text-[11px] text-stone-600">Dairy and livestock units with interest subvention under Kisan Credit Card.</p>
                          <a href="https://dahd.nic.in" target="_blank" rel="noreferrer" className="text-[10px] text-purple-700 font-semibold underline inline-flex items-center">
                            Official Portal: dahd.nic.in ↗
                          </a>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-purple-100 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-900">3. MoSJE NBCFDC / NSFDC Loans</span>
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">4% - 8% p.a. Concession</span>
                          </div>
                          <p className="text-[11px] text-stone-600">Concessional project financing up to 90% for rural and backward category entrepreneurs.</p>
                          <a href="https://nbcfdc.gov.in" target="_blank" rel="noreferrer" className="text-[10px] text-purple-700 font-semibold underline inline-flex items-center">
                            Official Portal: nbcfdc.gov.in ↗
                          </a>
                        </div>
                      </div>

                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setActiveTab('schemes')}
                          className="bg-purple-800 hover:bg-purple-900 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center space-x-1.5 transition shadow-xs"
                        >
                          <Landmark className="w-3.5 h-3.5" />
                          <span>{language === 'hi' ? 'योजना पोर्टल खोलें' : (language === 'te' ? 'పథకాల పోర్టల్ తెరవండి' : 'Open Schemes Explorer')}</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </button>
                        <button
                          onClick={() => handleSend(language === 'hi' ? "आवेदन करने के लिए कौनसे दस्तावेज चाहिए?" : "What documents are required to apply for these schemes?")}
                          className="bg-white hover:bg-stone-50 text-purple-900 border border-purple-200 font-semibold py-1.5 px-3 rounded-xl text-xs flex items-center space-x-1 transition"
                        >
                          <FileText className="w-3.5 h-3.5 text-stone-600" />
                          <span>{language === 'hi' ? 'ज़रूरी दस्तावेज देखें' : (language === 'te' ? 'అవసరమైన పత్రాలు' : 'Check Required Documents')}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 7-Factor Risk Analysis Card */}
                  {(msg.actionType === 'SHOW_RISK' || msg.actionPayload?.risks) && (
                    <div className="mt-3 p-3.5 bg-amber-50/90 border border-amber-300 rounded-2xl text-stone-800 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                          <BarChart2 className="w-4 h-4 text-amber-600" />
                          <span>{language === 'hi' ? '7-कारक जोखिम एवं बचाव योजना' : (language === 'te' ? '7-కారక రిస్క్ మరియు పరిష్కారాలు' : '7-Factor Risk Assessment & Mitigations')}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          Zero-Risk Myth Guard
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="bg-white p-2 rounded-xl border border-amber-200">
                          <div className="flex justify-between items-center text-[11px] font-bold text-stone-900">
                            <span>1. चारा एवं कच्चा माल मूल्य जोखिम (Fodder/Feed)</span>
                            <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">Medium</span>
                          </div>
                          <p className="text-[10px] text-stone-600 mt-0.5">बचाव: साइलेज भंडारण और स्थानीय किसानों के साथ मौसमी अग्रिम अनुबंध।</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-amber-200">
                          <div className="flex justify-between items-center text-[11px] font-bold text-stone-900">
                            <span>2. बाज़ार मूल्य में उतार-चढ़ाव (Market Volatility)</span>
                            <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">Low-Medium</span>
                          </div>
                          <p className="text-[10px] text-stone-600 mt-0.5">बचाव: सहकारी संघ से खरीद अनुबंध और मूल्य संवर्धन (घी/पनीर)।</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-amber-200">
                          <div className="flex justify-between items-center text-[11px] font-bold text-stone-900">
                            <span>3. पशुधन स्वास्थ्य एवं मृत्यु दर जोखिम (Mortality)</span>
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">Low</span>
                          </div>
                          <p className="text-[10px] text-stone-600 mt-0.5">बचाव: 100% सरकारी पशुधन बीमा और समय पर टीकाकरण।</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Business Comparison Table Card */}
                  {(msg.actionType === 'SHOW_COMPARISON' || msg.comparisonTable) && (
                    <div className="mt-3 p-3.5 bg-emerald-50/90 border border-emerald-300 rounded-2xl text-stone-800 shadow-2xs space-y-2">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-[#0F3D2E]">
                        <BarChart2 className="w-4 h-4 text-emerald-700" />
                        <span>{language === 'hi' ? 'व्यवसाय तुलना मैट्रिक्स' : (language === 'te' ? 'వ్యాపార పోలిక పట్టిక' : 'Business Feasibility Comparison Matrix')}</span>
                      </div>

                      <div className="bg-white rounded-xl border border-emerald-200 overflow-hidden text-[11px]">
                        <div className="grid grid-cols-3 bg-emerald-100/70 p-2 font-bold text-emerald-950 border-b border-emerald-200">
                          <div>कारक / Metric</div>
                          <div>विकल्प 1 (Option 1)</div>
                          <div>विकल्प 2 (Option 2)</div>
                        </div>
                        {(msg.comparisonTable || [
                          { factor: "Project Cost", option_1: "₹3,00,000", option_2: "₹2,50,000" },
                          { factor: "Land / Space Needed", option_1: "0.5 Acre / Shed", option_2: "0.25 Acre / Shed" },
                          { factor: "Estimated Profit", option_1: "₹22,000 / mo", option_2: "₹18,000 / mo" },
                          { factor: "Risk Tier", option_1: "LOW", option_2: "MEDIUM" }
                        ]).map((row, rIdx) => (
                          <div key={rIdx} className={`grid grid-cols-3 p-2 border-b border-stone-100 ${rIdx % 2 === 1 ? 'bg-stone-50/60' : 'bg-white'}`}>
                            <div className="font-semibold text-stone-700">{row.factor}</div>
                            <div className="text-stone-900 font-bold">{row.option_1}</div>
                            <div className="text-stone-900 font-bold">{row.option_2}</div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setActiveTab('recommendations')}
                          className="bg-[#0F3D2E] text-amber-300 font-bold py-1.5 px-3 rounded-xl text-xs flex items-center space-x-1 hover:brightness-110 shadow-xs"
                        >
                          <span>{language === 'hi' ? 'विस्तृत विश्लेषण देखें' : 'View Full Details'}</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons if available */}
                  {(msg.actionType === 'CONFIRM_BUSINESS_PLAN' || msg.actionType === 'OFFER_ANALYSIS') && msg.intentData && (
                    <div className="mt-3 p-3 bg-amber-50/90 border border-amber-300 rounded-xl space-y-2 text-stone-800 shadow-2xs">
                      <div className="font-bold text-[#0F3D2E] text-xs">
                        {t.confirmPlanTitle || "Here's what I understood about your business idea:"}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-white p-2.5 rounded-lg border border-amber-200">
                        <div><span className="text-stone-500">Business:</span> <strong className="text-stone-900">{msg.intentData.businessIdea}</strong></div>
                        <div><span className="text-stone-500">Location:</span> <strong className="text-stone-900">{msg.intentData.location?.village || dossier.location || 'Local'}, {msg.intentData.location?.district || 'District'}</strong></div>
                        <div><span className="text-stone-500">Capital:</span> <strong className="text-emerald-700">₹{(msg.intentData.capital || 300000).toLocaleString('en-IN')}</strong></div>
                        <div><span className="text-stone-500">Scale:</span> <strong className="capitalize text-stone-900">{msg.intentData.scale || 'Small'}</strong></div>
                      </div>
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleConfirmAndAnalyze(msg.intentData)}
                          className="bg-[#0F3D2E] text-amber-300 font-bold px-3.5 py-1.5 rounded-lg text-xs hover:brightness-110 shadow-xs flex items-center space-x-1"
                        >
                          <span>🚀 {t.analyzeMyBusiness || "Analyze My Business"}</span>
                        </button>
                        <button
                          onClick={() => handleSend("Let me edit the details")}
                          className="bg-stone-200 text-stone-700 font-semibold px-2.5 py-1.5 rounded-lg text-xs hover:bg-stone-300"
                        >
                          {t.editDetails || "Edit Details"}
                        </button>
                      </div>
                    </div>
                  )}

                  {msg.actionType === 'UPDATE_OR_CREATE_PLAN' && (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 shadow-2xs">
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          onClick={() => handleConfirmUpdatePlan(msg.existingPlanId, msg.intentData)}
                          className="bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-900"
                        >
                          {t.updateExistingPlan || "Update Existing Plan"}
                        </button>
                        <button
                          onClick={() => handleConfirmAndAnalyze(msg.intentData)}
                          className="bg-[#0F3D2E] text-amber-300 font-bold px-3 py-1.5 rounded-lg text-xs hover:brightness-110"
                        >
                          {t.createNewPlan || "Create New Plan"}
                        </button>
                      </div>
                    </div>
                  )}

                  {(msg.actionType === 'SHOW_RECOMMENDATIONS' || msg.actionType === 'SHOW_PERSONAL_RECOMMENDATION') && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-2 border-t border-stone-100">
                      <button
                        onClick={() => {
                          if (msg.planId && setActivePlanId) setActivePlanId(msg.planId);
                          setActiveTab('recommendations');
                        }}
                        className="bg-[#0F3D2E] text-amber-300 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center space-x-1 hover:brightness-110 shadow-sm sm:col-span-2"
                      >
                        <span>✨ {t.viewFullAnalysis || "View Business Analysis →"}</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                      </button>
                      <button
                        onClick={() => setActiveTab('market')}
                        className="bg-emerald-800 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center space-x-1 hover:brightness-110 shadow-sm"
                      >
                        <span>📍 Market Map</span>
                      </button>
                    </div>
                  )}

                  {/* Replay Voice Audio Button */}
                  {msg.sender === 'ai' && (
                    <div className="flex items-center justify-between pt-1 mt-1 border-t border-stone-100/50">
                      {isSpeaking ? (
                        <button
                          onClick={stopSpeaking}
                          className="flex items-center space-x-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md text-[10px] font-bold"
                        >
                          <VolumeX className="w-3 h-3 text-amber-600 animate-pulse" />
                          <span>Speaking... Tap to Stop</span>
                        </button>
                      ) : <span />}

                      <button
                        onClick={() => speakVoice(msg.text, language)}
                        className="flex items-center space-x-1 text-stone-400 hover:text-[#0F3D2E] text-[10px] font-semibold transition ml-auto"
                        title="Replay Voice Audio"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Replay Voice</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Realtime Live Speech Feedback while speaking */}
            {isListening && (
              <div className="flex justify-center my-2 animate-in fade-in duration-150">
                <div className="bg-emerald-50 border-2 border-emerald-500/50 rounded-2xl p-3 text-xs max-w-lg w-full shadow-md">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center space-x-1.5 text-[11px] uppercase font-bold text-emerald-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      <span>Listening to Your Voice:</span>
                    </span>
                    {liveTranscript && (
                      <button
                        type="button"
                        onClick={() => stopListeningVoice(true)}
                        className="px-2.5 py-1 bg-[#0F3D2E] text-amber-300 rounded-lg text-[10px] font-bold hover:bg-[#165440] transition shadow-xs"
                      >
                        Done Speaking (Send) ↵
                      </button>
                    )}
                  </div>
                  <p className="text-stone-800 font-medium italic text-sm">
                    {liveTranscript ? `"${liveTranscript}"` : "Listening... Speak your name, village, or business question"}
                  </p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-xs p-3.5 flex items-center space-x-2 text-xs text-stone-500 font-medium">
                  <Loader2 className="w-4 h-4 text-[#0F3D2E] animate-spin" />
                  <span>Saarthi is analyzing your business context...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Right Column: Live Business Plan Dossier Widget (Secondary, 4 of 12 columns) */}
        <div className="lg:col-span-4 bg-gradient-to-br from-[#0F3D2E]/5 to-emerald-50/60 rounded-2xl p-4 border border-emerald-900/15 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-emerald-900/10 mb-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#0F3D2E]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F3D2E]">
                  LIVE BUSINESS PLAN DOSSIER
                </h3>
              </div>
              <span className="bg-emerald-100 text-[#0F3D2E] text-[10px] font-bold px-2 py-0.5 rounded-full">
                Auto-Updating
              </span>
            </div>

            {/* Completeness Progress Bar */}
            <div className="mb-3 bg-white p-2 rounded-xl border border-emerald-900/10">
              <div className="flex justify-between items-center text-[10px] font-bold text-stone-700 mb-1">
                <span>Dossier Completeness</span>
                <span className="text-emerald-700">{dossier.completeness || 15}%</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${dossier.completeness || 15}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {/* Field 1: Entrepreneur */}
              <div className="bg-white p-2.5 rounded-xl border border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold">1. Entrepreneur</span>
                  <span className="font-bold text-stone-900">{dossier.name}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" /> Captured
                </span>
              </div>

              {/* Field 2: Business Idea */}
              <div className="bg-white p-2.5 rounded-xl border border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold">2. Business Idea</span>
                  <span className="font-bold text-stone-900">
                    {dossier.businessIdea || <span className="text-amber-600 font-normal italic">Pending input...</span>}
                  </span>
                </div>
                {dossier.businessIdea ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" /> Captured
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    Missing
                  </span>
                )}
              </div>

              {/* Field 3: Location */}
              <div className="bg-white p-2.5 rounded-xl border border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold">3. Location</span>
                  <span className="font-bold text-stone-900">
                    {dossier.location || <span className="text-amber-600 font-normal italic">Pending input...</span>}
                  </span>
                </div>
                {dossier.location ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" /> Captured
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    Missing
                  </span>
                )}
              </div>

              {/* Field 4: Available Capital */}
              <div className="bg-white p-2.5 rounded-xl border border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold">4. Available Capital</span>
                  <span className="font-extrabold text-emerald-800">
                    {dossier.capital ? `₹${(typeof dossier.capital === 'number' ? dossier.capital : parseInt(dossier.capital) || 0).toLocaleString('en-IN')}` : <span className="text-amber-600 font-normal italic">Pending input...</span>}
                  </span>
                </div>
                {dossier.capital ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" /> Captured
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    Missing
                  </span>
                )}
              </div>

              {/* Field 5: Land / Workspace */}
              <div className="bg-white p-2.5 rounded-xl border border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold">5. Land / Workspace</span>
                  <span className="font-bold text-stone-900">
                    {dossier.land || <span className="text-amber-600 font-normal italic">Pending input...</span>}
                  </span>
                </div>
                {dossier.land ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" /> Captured
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    Missing
                  </span>
                )}
              </div>

              {/* Field 6: Experience & Skills */}
              <div className="bg-white p-2.5 rounded-xl border border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold">6. Core Skills</span>
                  <span className="font-bold text-stone-900 capitalize truncate max-w-[120px] block">
                    {dossier.experience || <span className="text-amber-600 font-normal italic">Pending input...</span>}
                  </span>
                </div>
                {dossier.experience ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" /> Captured
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    Missing
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-900/10">
            <button
              onClick={() => {
                if (dossier.businessIdea) {
                  handleConfirmAndAnalyze();
                } else {
                  handleSend("I want to create my personalized business plan");
                }
              }}
              className="w-full bg-[#0F3D2E] hover:bg-[#165440] text-amber-300 font-bold py-2.5 rounded-xl text-xs shadow-sm transition flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{dossier.businessIdea ? "Analyze Business Plan Now" : "Create Business Plan"}</span>
            </button>
          </div>
        </div>

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
            type="button"
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
            title={isListening ? "Listening... Tap to finish & send" : isSpeaking ? "Speaking... Tap to interrupt" : "Tap Microphone to Talk with UdyamSarthi"}
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
        <div className="mt-3.5 space-y-1 max-w-md mx-auto">
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
              type="button"
              onClick={handleStartVoiceConversation}
              className="mt-2 inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-emerald-50 text-[#0F3D2E] border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition shadow-2xs"
            >
              <Headphones className="w-3.5 h-3.5 text-emerald-700" />
              <span>🔊 Click to Hear UdyamSarthi Greeting</span>
            </button>
          )}

          {speechError && (
            <div className="mt-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium leading-relaxed shadow-xs">
              <p>{speechError}</p>
            </div>
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
            id="saarthi-text-input"
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
