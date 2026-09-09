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
  Scale
} from 'lucide-react';
import axios from 'axios';

export default function SaarthiHomeChat({ profile, onProfileUpdate, setActiveTab, language }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Namaste! 👋\n\nI'm UdyamSarthi, your business companion. Tell me what you want to do, and I'll guide you step by step.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const [autoVoice, setAutoVoice] = useState(true);

  const speakText = (text, targetLang = language) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*#•]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = targetLang === 'hi' || targetLang === 'HINDI' ? 'hi-IN' : (targetLang === 'te' || targetLang === 'TELUGU' ? 'te-IN' : 'en-IN');
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : (language === 'te' ? 'te-IN' : 'en-IN');

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        setSpeechError(null);
        handleSend(transcript);
      };

      recognition.onerror = (event) => {
        console.warn("Speech error:", event.error);
        setIsListening(false);
        setSpeechError("Speech not recognized. Please try again or type.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSpeechError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setSpeechError(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Mic error:", err);
        setIsListening(false);
      }
    }
  };

  const handleSend = async (textToSend = inputText) => {
    const text = textToSend.trim();
    if (!text || isLoading) return;

    // Append user message
    const userMsg = {
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Call existing API chat endpoint
      const response = await axios.post('/api/chat', {
        message: text,
        profile: profile || {},
        lang: language || 'en'
      });

      const replyText = response.data?.reply || generateLocalSaarthiReply(text);
      const actionType = response.data?.action_type;
      const comparisonTable = response.data?.comparison_table;
      const recScore = response.data?.recommendation_score;
      const confScore = response.data?.confidence_score;
      const detectedLang = response.data?.detected_language || language;
      
      const aiMsg = {
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType,
        comparisonTable,
        recScore,
        confScore,
        detectedLang,
        recommendations: response.data?.recommendations
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (autoVoice) {
        speakText(replyText, detectedLang);
      }

      // If backend returned profile updates
      if (response.data?.updated_profile && onProfileUpdate) {
        onProfileUpdate(response.data.updated_profile);
      } else if (response.data?.updatedProfile && onProfileUpdate) {
        onProfileUpdate(response.data.updatedProfile);
      }
    } catch (err) {
      console.warn("Chat API fallback to local intelligence:", err);
      const fallbackReply = generateLocalSaarthiReply(text);
      const aiMsg = {
        sender: 'ai',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Local Saarthi intelligence for instant feedback
  const generateLocalSaarthiReply = (query) => {
    const q = query.toLowerCase();
    if (q.includes('dairy') || q.includes('milk') || q.includes('cow') || q.includes('buffalo')) {
      return "Dairy farming is an excellent high-demand enterprise in rural areas!\n\nTo see if dairy is right for your area:\n1. Where would you like to set up your unit?\n2. What is your approximate investment budget?\n3. Do you already have land or fodder source?\n\nYou can also click 'Business Analysis' in the left menu to view detailed profit models!";
    }
    if (q.includes('2 lakh') || q.includes('lakh') || q.includes('capital') || q.includes('budget') || q.includes('money')) {
      return "With ₹2 Lakh capital, here are top micro-enterprises you can start:\n• Poultry / Broiler Farm (₹1.8L - ₹2.5L)\n• Food Processing & Flour Mill (₹1.5L - ₹2L)\n• Rural Retail & General Store (₹1.2L - ₹2L)\n• Solar Charging Kiosk (₹1L - ₹1.8L)\n\nWould you like me to calculate loan scheme options with 10% self-contribution?";
    }
    if (q.includes('scheme') || q.includes('loan') || q.includes('subsidy') || q.includes('government')) {
      return "We have checked top government support programs for you:\n• PMEGP (up to 35% subsidy for rural entrepreneurs)\n• Mudra Kishore Loan (up to ₹5 Lakh at low interest)\n• NBCFDC / NMDFC Concessional Schemes for backward classes.\n\nClick 'Government Schemes' on the sidebar to check your eligibility!";
    }
    return `That's a great starting point. To give you the best personalized guidance for "${query}", tell me your location and budget, and I will generate a complete step-by-step business blueprint!`;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickActions = [
    {
      id: 'recommendations',
      title: 'Find a business idea',
      icon: Lightbulb,
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    },
    {
      id: 'recommendations',
      title: 'Analyze my business idea',
      icon: BarChart2,
      color: 'bg-emerald-600/10 text-[#0F3D2E] border-emerald-600/20'
    },
    {
      id: 'finance',
      title: 'Plan my finances',
      icon: Wallet,
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    },
    {
      id: 'schemes',
      title: 'Explore government schemes',
      icon: Landmark,
      color: 'bg-purple-500/10 text-purple-600 border-purple-500/20'
    }
  ];

  const suggestedPrompts = [
    "I want to start a dairy business",
    "I have ₹2 lakh. What can I start?",
    "Are there any government schemes?",
    "I need a loan for my business",
    "Is this business good in my area?",
    "Help me create a business plan"
  ];

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl border border-emerald-900/10 flex flex-col justify-between">
      
      {/* Top Header inside Saarthi Card */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0F3D2E] to-[#17523f] text-amber-300 flex items-center justify-center shadow-md">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-extrabold text-stone-900">UdyamSarthi AI</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#0F3D2E]">
                Active Advisory
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">Trilingual Rural Business Advisor (HI / TE / EN)</p>
          </div>
        </div>

        <button
          onClick={() => setAutoVoice(!autoVoice)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs ${
            autoVoice 
              ? 'bg-[#0F3D2E] text-amber-300 hover:bg-[#144d3b]' 
              : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
          }`}
          title="Toggle Auto Voice Guidance"
        >
          {autoVoice ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{autoVoice ? 'Voice: ON' : 'Voice: OFF'}</span>
        </button>
      </div>

      {/* Quick Action Cards (4 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
        {quickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              onClick={() => setActiveTab(action.id)}
              className={`
                p-3.5 rounded-2xl border ${action.color} text-left transition-all duration-200 hover:-translate-y-0.5 shadow-2xs hover:shadow-md flex flex-col justify-between h-24
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-bold leading-tight truncate">{action.title}</span>
            </button>
          );
        })}
      </div>

      {/* Conversation Window */}
      <div className="bg-[#FAF8F5] rounded-2xl p-4 min-h-[220px] max-h-[320px] overflow-y-auto space-y-3 border border-stone-200/60 mb-5 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
          >
            <div className={`
              max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs
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
                    <span className="text-[#0F3D2E] font-bold">Saarthi</span>
                  </>
                )}
                <span className="ml-auto">{msg.timestamp}</span>
              </div>
              <p className="whitespace-pre-line font-medium text-xs sm:text-sm">{msg.text}</p>

              {/* UdyamSarthi Business Comparison Table */}
              {msg.comparisonTable && msg.comparisonTable.length > 0 && (
                <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-200 mt-2 space-y-1.5">
                  <div className="text-[11px] font-extrabold text-[#0F3D2E] flex items-center space-x-1">
                    <Scale className="w-3.5 h-3.5 text-amber-600" />
                    <span>Side-by-Side Comparison</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px] text-left border-collapse">
                      <thead>
                        <tr className="border-b border-stone-200 text-stone-600 font-bold">
                          <th className="p-1">Factor</th>
                          <th className="p-1 text-[#0F3D2E]">Option 1</th>
                          <th className="p-1 text-blue-800">Option 2</th>
                        </tr>
                      </thead>
                      <tbody>
                        {msg.comparisonTable.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-stone-100">
                            <td className="p-1 font-semibold text-stone-600">{row.factor}</td>
                            <td className="p-1 font-medium text-[#0F3D2E]">{row.option_1}</td>
                            <td className="p-1 font-medium text-blue-900">{row.option_2}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* UdyamSarthi Dual Score Badges */}
              {msg.recScore && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-100 text-[#0F3D2E] border border-emerald-200">
                    Suitability: {msg.recScore}/100
                  </span>
                  {msg.confScore && (
                    <span className="px-2 py-0.5 rounded-md font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      Confidence: {msg.confScore}/100
                    </span>
                  )}
                </div>
              )}

              {/* UdyamSarthi Dynamic Action CTA Buttons */}
              {msg.actionType === 'SHOW_SCHEMES' && (
                <button
                  onClick={() => setActiveTab('schemes')}
                  className="w-full mt-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-1.5 px-3 rounded-xl text-[11px] flex items-center justify-center space-x-1 shadow-sm hover:brightness-110 transition"
                >
                  <span>🏛️ View Matching Concessional Schemes</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              )}
              {msg.actionType === 'SHOW_MAP' && (
                <button
                  onClick={() => setActiveTab('market')}
                  className="w-full mt-2 bg-gradient-to-r from-emerald-800 to-teal-800 text-white font-bold py-1.5 px-3 rounded-xl text-[11px] flex items-center justify-center space-x-1 shadow-sm hover:brightness-110 transition"
                >
                  <span>📍 Open 10km Hyper-Local Map</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              )}
              {msg.actionType === 'SHOW_FINANCE' && (
                <button
                  onClick={() => setActiveTab('finance')}
                  className="w-full mt-2 bg-gradient-to-r from-blue-700 to-cyan-700 text-white font-bold py-1.5 px-3 rounded-xl text-[11px] flex items-center justify-center space-x-1 shadow-sm hover:brightness-110 transition"
                >
                  <span>📊 Open Concessional Finance Calculator</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              )}
              {msg.actionType === 'START_FORM_FILLING' && (
                <button
                  onClick={() => setActiveTab('profile')}
                  className="w-full mt-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold py-1.5 px-3 rounded-xl text-[11px] flex items-center justify-center space-x-1 shadow-sm hover:brightness-110 transition"
                >
                  <span>🎙️ Start Interactive Voice Form</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              )}

              {/* Replay Voice Button */}
              {msg.sender === 'ai' && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => speakText(msg.text, msg.detectedLang)}
                    className="flex items-center space-x-1 text-stone-400 hover:text-[#0F3D2E] text-[10px] font-semibold transition"
                    title="Replay Voice Audio"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Replay Voice</span>
                  </button>
                </div>
              )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-xs p-3.5 flex items-center space-x-2 text-xs text-stone-500 font-medium">
              <Loader2 className="w-4 h-4 text-[#0F3D2E] animate-spin" />
              <span>Saarthi is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Main Large Central Voice Interaction Microphone */}
      <div className="flex flex-col items-center justify-center my-2 text-center">
        
        {/* Layered Circular Microphone Button */}
        <div className="relative group">
          
          {/* Animated Glow Rings when Listening */}
          {isListening && (
            <>
              <div className="absolute -inset-4 rounded-full bg-amber-400/30 animate-ping" />
              <div className="absolute -inset-8 rounded-full bg-[#0F3D2E]/20 animate-pulse" />
            </>
          )}

          <button
            onClick={toggleListening}
            className={`
              relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform active:scale-95
              ${isListening 
                ? 'bg-rose-600 text-white ring-4 ring-rose-300 scale-105' 
                : 'bg-gradient-to-br from-[#0F3D2E] via-[#144d3b] to-[#1c664f] text-amber-400 hover:shadow-2xl hover:scale-105'
              }
            `}
            title="Tap to speak to Saarthi"
          >
            {isListening ? (
              <MicOff className="w-9 h-9 sm:w-10 sm:h-10 animate-bounce" />
            ) : (
              <Mic className="w-9 h-9 sm:w-10 sm:h-10" />
            )}
          </button>
        </div>

        {/* Micro-Instructions */}
        <div className="mt-3">
          <p className="text-sm font-bold text-stone-800">
            {isListening ? "Listening... Speak now!" : "Tap and speak to Saarthi"}
          </p>
          <p className="text-xs text-stone-500 mt-0.5 font-medium">
            You can speak in <span className="text-[#0F3D2E] font-semibold">English</span>, <span className="text-[#0F3D2E] font-semibold">हिंदी</span> or <span className="text-[#0F3D2E] font-semibold">తెలుగు</span>
          </p>
          {speechError && (
            <p className="text-xs text-rose-600 mt-1 font-semibold">{speechError}</p>
          )}
        </div>
      </div>

      {/* Alternative Text Input */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }} 
        className="relative mt-5"
      >
        <div className="flex items-center bg-[#FAF8F5] border border-stone-300 focus-within:border-[#0F3D2E] focus-within:ring-2 focus-within:ring-[#0F3D2E]/10 rounded-2xl px-3.5 py-2 shadow-xs transition">
          <Keyboard className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Or type your message here..."
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

      {/* Suggested Prompts ("Try saying...") */}
      <div className="mt-5 pt-4 border-t border-stone-100">
        <p className="text-xs font-bold text-stone-500 mb-2.5 flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-[#C28A17]" />
          <span>Try saying...</span>
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
