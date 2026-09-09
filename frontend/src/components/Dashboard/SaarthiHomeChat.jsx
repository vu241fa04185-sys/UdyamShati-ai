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
  ArrowRight,
  Scale,
  MapPin,
  CheckCircle2,
  Droplet,
  Zap,
  FileText,
  Edit2,
  Check
} from 'lucide-react';
import axios from 'axios';
import { detectAccurateLocation } from '../../utils/geolocation';
import { translations } from '../../locales/translations';
import { useSaarthi } from '../../context/SaarthiContext';
import { extractBusinessIntent } from '../../utils/businessPlanEngine';

export default function SaarthiHomeChat({ profile, onProfileUpdate, setActiveTab, language = 'en' }) {
  const t = translations[language] || translations.en;

  const { 
    personalPlans, 
    createPlanFromIntent, 
    updatePlan, 
    setActivePlanId, 
    pendingBusinessIdea, 
    setPendingBusinessIdea 
  } = useSaarthi();

  const userName = profile?.name || 'Entrepreneur';

  // Live Dossier State for Business Plan creation
  const [dossier, setDossier] = useState({
    name: userName,
    businessIdea: profile?.business_idea || '',
    location: `${profile?.village_name || 'Village'}, ${profile?.district || 'District'}`,
    capital: profile?.available_capital || 300000,
    land: `${profile?.land_acres || 2} Acres`,
    experience: (profile?.skills || ['Agriculture']).join(', '),
    scale: 'Small'
  });

  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Mode & Conversation State
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: language === 'hi'
        ? `नमस्ते ${userName} 👋\n\nमैं सारथी हूँ, आपका व्यावसायिक साथी। क्या आपके पास कोई व्यावसायिक विचार है, या आप चाहते हैं कि मैं आपको कुछ बेहतरीन अवसर सुझाऊँ?`
        : (language === 'te'
          ? `నమస్తే ${userName} 👋\n\nనేను సారథిని, మీ వ్యాపార తోడు. మీ మనస్సులో ఏదైనా వ్యాపార ఆలోచన ఉందా, లేదా నేను కొన్ని అవకాశాలను సూచించమంటారా?`
          : `Hello ${userName} 👋\n\nI'm Saarthi, your business companion. Do you already have a business idea in mind, or would you like me to suggest some opportunities for you?`),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionType: 'INITIAL_GREETING_CHOICE'
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechHelper, setSpeechHelper] = useState(null);
  const [speechError, setSpeechError] = useState(null);
  const [autoVoice, setAutoVoice] = useState(true);
  const [isLocating, setIsLocating] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : (language === 'te' ? 'te-IN' : 'en-IN');

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInterimTranscript(transcript);
        if (event.results[0].isFinal) {
          setInputText(transcript);
          setInterimTranscript('');
          setIsListening(false);
          handleSend(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setSpeechError("Speech recognition notice. Please try typing your message.");
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language, profile]);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/\*\*/g, '').replace(/•/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = language === 'hi' ? 'hi-IN' : (language === 'te' ? 'te-IN' : 'en-IN');
      utterance.rate = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

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
        setSpeechError(null);
        recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : (language === 'te' ? 'te-IN' : 'en-IN');
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Error starting speech recognition:", err);
      }
    }
  };

  // Synchronize dossier if profile updates
  useEffect(() => {
    setDossier(prev => ({
      ...prev,
      name: profile?.name || prev.name,
      location: `${profile?.village_name || 'Village'}, ${profile?.district || 'District'}`,
      capital: profile?.available_capital || prev.capital,
      land: `${profile?.land_acres || 2} Acres`,
      experience: (profile?.skills || ['Agriculture']).join(', ')
    }));
  }, [profile]);

  // Trigger full dynamic business analysis and creation
  const handleConfirmAndAnalyze = (intentData) => {
    setIsLoading(true);
    const targetIntent = intentData || pendingBusinessIdea || {
      businessIdea: dossier.businessIdea || "Rural Micro-Enterprise",
      location: { village: profile?.village_name || "Village", district: profile?.district || "District", state: profile?.state || "State" },
      capital: typeof dossier.capital === 'number' ? dossier.capital : parseInt(dossier.capital) || 300000,
      scale: dossier.scale,
      rawQuery: inputText
    };

    // Update live dossier
    setDossier(prev => ({
      ...prev,
      businessIdea: targetIntent.businessIdea,
      capital: targetIntent.capital || prev.capital
    }));

    // Create new personal business plan
    const newPlan = createPlanFromIntent(targetIntent);

    const successMsg = {
      sender: 'ai',
      text: language === 'hi'
        ? `🎉 आपकी **${newPlan.businessName}** व्यावसायिक योजना तैयार है! उपयुक्तता स्कोर: ${newPlan.suitabilityScore}/100। नीचे बटन पर क्लिक करके अपना संपूर्ण विश्लेषण देखें।`
        : (language === 'te'
          ? `🎉 మీ **${newPlan.businessName}** వ్యాపార ప్రణాళిక సిద్ధంగా ఉంది! అనుకూలత స్కోరు: ${newPlan.suitabilityScore}/100. నివేదిక చూడటానికి కింద బటన్ నొక్కండి.`
          : `🎉 Your **${newPlan.businessName}** Business Plan is Ready! Suitability Score: ${newPlan.suitabilityScore}/100. Click below to inspect your full analysis.`),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionType: 'SHOW_PERSONAL_RECOMMENDATION',
      planId: newPlan.id
    };

    setMessages(prev => [...prev, successMsg]);
    setIsLoading(false);

    if (autoVoice) {
      speakText(successMsg.text, language);
    }
  };

  // Update existing plan
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

    if (autoVoice) {
      speakText(updatedMsg.text, language);
    }
  };

  const handleSend = async (customText = null) => {
    const messageToSend = customText || inputText;
    if (!messageToSend || !messageToSend.trim()) return;

    const userMessage = {
      sender: 'user',
      text: messageToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Extract business intent from Voice/Text input
    const extractedIntent = extractBusinessIntent(messageToSend, profile);

    // Check if prompt expresses clear business creation intent
    const hasIntent = messageToSend.toLowerCase().includes('want') || 
                      messageToSend.toLowerCase().includes('start') || 
                      messageToSend.toLowerCase().includes('open') || 
                      messageToSend.toLowerCase().includes('business') || 
                      messageToSend.toLowerCase().includes('farm') || 
                      messageToSend.toLowerCase().includes('poultry') || 
                      messageToSend.toLowerCase().includes('dairy') ||
                      messageToSend.toLowerCase().includes('mushroom') ||
                      messageToSend.toLowerCase().includes('processing') ||
                      messageToSend.toLowerCase().includes('chahata') ||
                      messageToSend.toLowerCase().includes('shuru') ||
                      messageToSend.toLowerCase().includes('karna');

    if (hasIntent && extractedIntent.businessIdea && extractedIntent.businessIdea !== 'Rural Micro-Enterprise') {
      setPendingBusinessIdea(extractedIntent);

      // Check if user already has an active plan of similar type
      const existingPlan = personalPlans.find(p => 
        p.businessName.toLowerCase().includes(extractedIntent.businessIdea.toLowerCase()) ||
        extractedIntent.businessIdea.toLowerCase().includes(p.businessName.toLowerCase())
      );

      if (existingPlan) {
        setIsLoading(false);
        const dupMessage = {
          sender: 'ai',
          text: language === 'hi'
            ? `आपकी प्रोफ़ाइल में पहले से ही **${existingPlan.businessName}** की योजना सुरक्षित है। क्या आप इसे नए विवरणों के साथ अपडेट करना चाहते हैं या नई अलग योजना बनाना चाहते हैं?`
            : (language === 'te'
              ? `మీ వద్ద ఇప్పటికే **${existingPlan.businessName}** ప్రణాళిక భద్రపరచబడి ఉంది. దాన్ని నవీకరించాలా లేదా కొత్త ప్రణాళికను సృష్టించాలా?`
              : `You already have a **${existingPlan.businessName}** plan. Would you like to update it or create a new separate plan?`),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionType: 'UPDATE_OR_CREATE_PLAN',
          existingPlanId: existingPlan.id,
          existingPlanName: existingPlan.businessName,
          intentData: extractedIntent
        };
        setMessages(prev => [...prev, dupMessage]);
        if (autoVoice) speakText(dupMessage.text, language);
        return;
      }

      // Show confirmation prompt before running business analysis
      setIsLoading(false);
      const confirmMessage = {
        sender: 'ai',
        text: language === 'hi'
          ? `मैंने आपके विचार से यह विवरण समझा:\n• व्यवसाय: **${extractedIntent.businessIdea}**\n• स्थान: **${extractedIntent.location.village}, ${extractedIntent.location.district}**\n• उपलब्ध पूँजी: **₹${extractedIntent.capital.toLocaleString('en-IN')}**\n\nक्या मैं इस व्यावसायिक अवसर का विश्लेषण करूँ?`
          : (language === 'te'
            ? `మీ ఆలోచన నుండి నేను గ్రహించిన వివరాలు:\n• వ్యాపారం: **${extractedIntent.businessIdea}**\n• ప్రాంతం: **${extractedIntent.location.village}, ${extractedIntent.location.district}**\n• అందుబాటులో ఉన్న పెట్టుబడి: **₹${extractedIntent.capital.toLocaleString('en-IN')}**\n\nనేను ఈ అవకాశాన్ని విశ్లేషించమంటారా?`
            : `Here's what I understood about your business idea:\n• Business: **${extractedIntent.businessIdea}**\n• Location: **${extractedIntent.location.village}, ${extractedIntent.location.district}**\n• Available Capital: **₹${extractedIntent.capital.toLocaleString('en-IN')}**\n\nShould I analyze this business opportunity now?`),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType: 'CONFIRM_BUSINESS_PLAN',
        intentData: extractedIntent
      };
      setMessages(prev => [...prev, confirmMessage]);
      if (autoVoice) speakText(confirmMessage.text, language);
      return;
    }

    try {
      const res = await axios.post('/api/chat', {
        message: messageToSend,
        profile: profile,
        language: language
      });

      const responseText = res.data?.response || res.data?.reply || "I have recorded your request. Let me assist you further.";
      const aiMessage = {
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recScore: res.data?.suitability_score,
        confScore: res.data?.confidence_score,
        actionType: res.data?.action_type
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (autoVoice) {
        speakText(responseText, language);
      }

      if (res.data?.updated_profile && onProfileUpdate) {
        onProfileUpdate(res.data.updated_profile);
      }
    } catch (err) {
      console.error("Chat API error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: language === 'hi'
            ? "क्षमा करें, नेटवर्क समस्या के कारण उत्तर प्राप्त नहीं हो सका। कृपया पुनः प्रयास करें।"
            : (language === 'te'
              ? "క్షమించండి, నెట్‌వర్క్ సమస్య ఉంది. దయచేసి మళ్లీ ప్రయత్నించండి."
              : "Apologies, I encountered a temporary connection notice. Please ask again or select an option below."),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepResponse = (userInput, specialType = null, extraVal = null) => {
    handleSend(userInput);
  };

  const handleAutoGPS = async () => {
    setIsLocating(true);
    try {
      const loc = await detectAccurateLocation();
      if (loc && onProfileUpdate) {
        const updated = {
          ...profile,
          district: loc.district || profile.district,
          state: loc.state || profile.state,
          latitude: loc.latitude || profile.latitude,
          longitude: loc.longitude || profile.longitude
        };
        onProfileUpdate(updated);
        handleSend(`Location updated via GPS: ${loc.district}, ${loc.state}`);
      }
    } catch (e) {
      console.warn("GPS notice:", e);
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, interimTranscript]);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl border border-emerald-900/10 flex flex-col justify-between">
      
      {/* 1. Top Header inside Saarthi Card */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0F3D2E] to-[#17523f] text-amber-300 flex items-center justify-center shadow-md">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-extrabold text-stone-900">
                {t.saarthiTitle || "Saarthi AI"}
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#0F3D2E]">
                {t.saarthiStatus || "Online Companion"}
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              {t.saarthiSubtitle || "Your 24/7 Rural Business Companion"}
            </p>
          </div>
        </div>

        {/* Mode Switch & Auto-Voice Toggle */}
        <div className="flex items-center space-x-2">
          {/* Voice Toggle */}
          <button
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setAutoVoice(!autoVoice);
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs ${
              autoVoice 
                ? 'bg-[#0F3D2E] text-amber-300 hover:bg-[#144d3b]' 
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
            title="Toggle Voice Output"
          >
            {autoVoice ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{autoVoice ? 'Voice: ON' : 'Voice: OFF'}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Grid: Left Chat Area & Right Live Business Plan Dossier Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 my-4">
        
        {/* Left Column: Chat Window & Controls */}
        <div className="lg:col-span-2 space-y-4 flex flex-col justify-between">
          
          {/* Quick Choice Buttons for Initial Greeting */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleSend("I have a business idea in mind")}
              className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-stone-800 border border-amber-200 text-left transition flex items-center space-x-2 shadow-2xs group"
            >
              <div className="p-1.5 rounded-lg bg-amber-400/20 text-[#C28A17] group-hover:scale-110 transition">
                <Lightbulb className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold leading-tight">💡 I Have an Idea</span>
            </button>

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
          <div className="bg-[#FAF8F5] rounded-2xl p-4 min-h-[240px] max-h-[340px] overflow-y-auto space-y-3 border border-stone-200/60 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
              >
                <div className={`
                  max-w-[88%] sm:max-w-[82%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs
                  ${msg.sender === 'user' 
                    ? 'bg-[#0F3D2E] text-white rounded-tr-xs' 
                    : 'bg-white text-stone-800 border border-stone-200/80 rounded-tl-xs'
                  }
                `}>
                  <div className="flex items-center space-x-1.5 mb-1 opacity-80 text-[10px] font-semibold">
                    {msg.sender === 'user' ? (
                      <>
                        <span>You</span>
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
                  
                  <p className="whitespace-pre-line font-medium text-xs sm:text-sm">{msg.text}</p>

                  {/* Action Buttons if available */}
                  {msg.actionType === 'CONFIRM_BUSINESS_PLAN' && msg.intentData && (
                    <div className="mt-3 p-3 bg-amber-50/90 border border-amber-300 rounded-xl space-y-2 text-stone-800 shadow-2xs">
                      <div className="font-bold text-[#0F3D2E] text-xs">
                        {t.confirmPlanTitle || "Here's what I understood about your business idea:"}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-white p-2.5 rounded-lg border border-amber-200">
                        <div><span className="text-stone-500">Business:</span> <strong className="text-stone-900">{msg.intentData.businessIdea}</strong></div>
                        <div><span className="text-stone-500">Location:</span> <strong className="text-stone-900">{msg.intentData.location.village}, {msg.intentData.location.district}</strong></div>
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
                          if (msg.planId) setActivePlanId(msg.planId);
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
                    <div className="flex items-center justify-between pt-1">
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
                        onClick={() => speakText(msg.text, language)}
                        className="flex items-center space-x-1 text-stone-400 hover:text-[#0F3D2E] text-[10px] font-semibold transition"
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

        {/* Right Column: Live Business Plan Dossier Widget */}
        <div className="bg-gradient-to-br from-[#0F3D2E]/5 to-emerald-50/60 rounded-2xl p-4 border border-emerald-900/15 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-emerald-900/10 mb-3">
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
                  <span className="font-bold text-stone-900">{dossier.location}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" /> Profile
                </span>
              </div>

              {/* Field 4: Available Capital */}
              <div className="bg-white p-2.5 rounded-xl border border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold">4. Available Capital</span>
                  <span className="font-extrabold text-emerald-800">
                    ₹{(typeof dossier.capital === 'number' ? dossier.capital : parseInt(dossier.capital) || 300000).toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" /> Captured
                </span>
              </div>

              {/* Field 5: Land / Workspace */}
              <div className="bg-white p-2.5 rounded-xl border border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold">5. Land / Workspace</span>
                  <span className="font-bold text-stone-900">{dossier.land}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" /> Captured
                </span>
              </div>

              {/* Field 6: Experience & Skills */}
              <div className="bg-white p-2.5 rounded-xl border border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold">6. Core Skills</span>
                  <span className="font-bold text-stone-900 capitalize truncate max-w-[120px] block">{dossier.experience}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" /> Profile
                </span>
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



      {/* 4. Main Central Microphone & Speech Interaction Bar */}
      <div className="flex flex-col items-center justify-center my-2 text-center">
        
        {/* Layered Circular Microphone Button */}
        <div className="relative group">
          {isListening && (
            <>
              <div className="absolute -inset-4 rounded-full bg-amber-400/30 animate-ping" />
              <div className="absolute -inset-8 rounded-full bg-[#0F3D2E]/20 animate-pulse" />
            </>
          )}

          <button
            onClick={toggleListening}
            className={`
              relative z-10 w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform active:scale-95
              ${isListening 
                ? 'bg-rose-600 text-white ring-4 ring-rose-300 scale-105' 
                : 'bg-gradient-to-br from-[#0F3D2E] via-[#144d3b] to-[#1c664f] text-amber-400 hover:shadow-2xl hover:scale-105'
              }
            `}
            title="Tap to speak to Saarthi"
          >
            {isListening ? (
              <MicOff className="w-8 h-8 sm:w-9 sm:h-9 animate-bounce" />
            ) : (
              <Mic className="w-8 h-8 sm:w-9 sm:h-9" />
            )}
          </button>
        </div>

        {/* Live Audio Transcription & Guidance */}
        <div className="mt-3 min-h-[38px]">
          <p className="text-xs sm:text-sm font-bold text-stone-800">
            {isListening ? (t.listeningState || "Listening... Speak your answer now!") : (t.tapAndSpeak || "Tap and speak to Saarthi")}
          </p>
          
          {/* Live speech interim transcript */}
          {interimTranscript && (
            <p className="text-xs text-[#0F3D2E] font-bold mt-0.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 animate-pulse inline-block">
              "{interimTranscript}"
            </p>
          )}

          {!interimTranscript && (
            <p className="text-[11px] text-stone-500 mt-0.5 font-medium">
              {t.speakLanguageHint || "You can speak in English, हिंदी or తెలుగు"}
            </p>
          )}

          {speechHelper && !interimTranscript && (
            <p className="text-xs text-stone-600 mt-1 font-semibold">{speechHelper}</p>
          )}

          {speechError && (
            <p className="text-xs text-rose-600 mt-1 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 inline-block">
              {speechError}
            </p>
          )}
        </div>
      </div>

      {/* 5. Alternative Text Input Form */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }} 
        className="relative mt-3"
      >
        <div className="flex items-center bg-[#FAF8F5] border border-stone-300 focus-within:border-[#0F3D2E] focus-within:ring-2 focus-within:ring-[#0F3D2E]/10 rounded-2xl px-3.5 py-2 shadow-xs transition">
          <Keyboard className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.typeMessagePlaceholder || "Or type your message here..."}
            className="w-full bg-transparent text-stone-800 text-xs sm:text-sm focus:outline-none placeholder:text-stone-400 font-medium"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="ml-2 p-2 rounded-xl bg-[#0F3D2E] text-amber-300 hover:bg-[#165440] disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0 flex items-center space-x-1"
          >
            <span className="text-xs font-bold px-1 hidden sm:inline">{t.send || "Send"}</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* 6. Try Saying Prompts */}
      <div className="mt-4 pt-3 border-t border-stone-100">
        <p className="text-xs font-bold text-stone-500 mb-2 flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-[#C28A17]" />
          <span>{t.trySayingTitle || "Try saying:"}</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[
            t.tryPrompt1 || "I want to start a dairy business",
            t.tryPrompt2 || "I have ₹2 lakh. What can I start?",
            t.tryPrompt3 || "Are there any government schemes?",
            t.tryPrompt4 || "I need a loan for my business",
            t.tryPrompt5 || "Is this business good in my area?",
            t.tryPrompt6 || "Help me create a business plan"
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded-full bg-[#FAF8F5] hover:bg-[#0F3D2E] text-stone-700 hover:text-amber-300 text-[11px] font-medium border border-stone-200/80 transition shadow-2xs"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
