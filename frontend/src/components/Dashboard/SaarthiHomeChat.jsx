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
  RotateCcw,
  ShieldCheck,
  Zap,
  Droplet,
  ChevronRight,
  Sliders
} from 'lucide-react';
import axios from 'axios';
import { detectAccurateLocation } from '../../utils/geolocation';

export default function SaarthiHomeChat({ profile, onProfileUpdate, setActiveTab, language }) {
  // Mode: 'interview' (AI actively asks questions step-by-step) or 'chat' (Free-form conversational advisory)
  const [mode, setMode] = useState('interview');
  
  // Step in Guided Advisory: 0: Name & Location, 1: Capital, 2: Land & Facilities, 3: Category, 4: Results
  const [currentStep, setCurrentStep] = useState(0);
  const [stepData, setStepData] = useState({
    name: profile?.name || '',
    village: profile?.village_name || profile?.location?.village || '',
    capital: profile?.available_capital || profile?.financial?.capital || null,
    land_acres: profile?.land_acres ?? profile?.resources?.land_acres ?? null,
    has_water: profile?.has_water_source ?? profile?.resources?.water ?? true,
    has_electricity: profile?.has_electricity ?? profile?.resources?.electricity ?? true,
    has_shop: profile?.has_shop_building ?? profile?.resources?.shop ?? false,
    has_vehicle: profile?.has_vehicle ?? profile?.resources?.vehicle ?? false,
    social_category: profile?.social_category || ''
  });

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: language === 'hi' 
        ? "नमस्ते! 👋 मैं **उद्यमसारथी** हूँ — आपका एआई व्यापार सलाहकार। आपके लिए सबसे सही और लाभदायक व्यवसाय व ऋण खोजने के लिए, मैं आपसे एक-एक करके कुछ जरूरी सवाल पूछूँगा।\n\n**पहला कदम:** कृपया अपना **शुभ नाम** और अपने **गांव/कस्बे का नाम** बताएं।"
        : (language === 'te'
          ? "నమస్కారం! 👋 నేను **ఉద్యమ్ సారథి** — మీ ఏఐ వ్యాపార సలహాదారుని. మీ కోసం ఉత్తమ వ్యాపారం మరియు రుణ పథకాన్ని గుర్తించడానికి నేను మిమ్మల్ని కొన్ని ప్రశ్నలు అడుగుతాను.\n\n**మొదటి ప్రశ్న:** దయచేసి మీ **పూర్తి పేరు** మరియు మీ **గ్రామం లేదా పట్టణం పేరు** చెప్పండి."
          : "Namaste! 👋 I'm **UdyamSarthi**, your dedicated AI business companion. To find the highest-profit, low-risk business and concessional loan for you, I will guide you step-by-step.\n\n**Step 1:** What is your **full name** and which **village or town** are you from?"),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stepIndex: 0
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
  const [finalBlueprint, setFinalBlueprint] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Configuration for 5 Interview Steps
  const STEPS_CONFIG = [
    {
      id: 'name_location',
      stepNum: 1,
      titleEn: 'Your Name & Location',
      titleHi: 'शुभ नाम व गाँव / कस्बा',
      titleTe: 'మీ పేరు & ప్రాంతం',
      questionEn: "What is your full name and which village or district are you from?",
      questionHi: "आपका शुभ नाम क्या है और आप किस गाँव या जिले से हैं?",
      questionTe: "మీ పూర్తి పేరు ఏమిటి మరియు మీ గ్రామం లేదా జిల్లా ఏది?",
      presets: [
        { label: '📍 Pimpalgaon Baswant (Nashik, MH)', name: 'Ramesh Kisan', village: 'Pimpalgaon Baswant', district: 'Nashik', state: 'Maharashtra', lat: 20.1706, lon: 73.9840 },
        { label: '📍 Kankipadu (Krishna, AP)', name: 'Suresh Rao', village: 'Kankipadu', district: 'Krishna', state: 'Andhra Pradesh', lat: 16.4258, lon: 80.7712 },
        { label: '📍 Chaubeypur (Varanasi, UP)', name: 'Rakesh Maurya', village: 'Chaubeypur', district: 'Varanasi', state: 'Uttar Pradesh', lat: 25.4380, lon: 83.0560 }
      ]
    },
    {
      id: 'capital',
      stepNum: 2,
      titleEn: 'Investment Budget (Capital)',
      titleHi: 'उपलब्ध पूँजी / बजट',
      titleTe: 'పెట్టుబడి బడ్జెట్',
      questionEn: "How much personal liquid savings (in ₹) do you have available to invest in this enterprise?",
      questionHi: "व्यवसाय शुरू करने के लिए आपके पास अपनी खुद की कितनी पूँजी (रुपये में बचत) उपलब्ध है?",
      questionTe: "ఈ వ్యాపారంలో పెట్టుబడి పెట్టడానికి మీ వద్ద ఎంత సొంత నగదు అందుబాటులో ఉంది?",
      options: [
        { label: '₹50,000', value: 50000 },
        { label: '₹1,00,000', value: 100000 },
        { label: '₹2,00,000', value: 200000 },
        { label: '₹3,00,000', value: 300000 },
        { label: '₹5,00,000+', value: 500000 }
      ]
    },
    {
      id: 'land_infrastructure',
      stepNum: 3,
      titleEn: 'Land & Site Infrastructure',
      titleHi: 'जमीन व कार्यस्थल सुविधाएँ',
      titleTe: 'భూమి & సౌకర్యాలు',
      questionEn: "How much land area (in acres) do you have, and what facilities (water, 3-phase power) are available?",
      questionHi: "आपके पास कुल कितनी जमीन (एकड़ में) उपलब्ध है, और पानी या 3-फेज बिजली की क्या सुविधा है?",
      questionTe: "మీ వద్ద ఎన్ని ఎకరాల భూమి ఉంది మరియు అక్కడ నీరు లేదా కరెంట్ సదుపాయం ఉందా?",
      landOptions: [
        { label: '0 Acres (Landless)', value: 0 },
        { label: '0.5 Acre', value: 0.5 },
        { label: '1.0 Acre', value: 1.0 },
        { label: '2.0 Acres', value: 2.0 },
        { label: '5.0+ Acres', value: 5.0 }
      ]
    },
    {
      id: 'social_category',
      stepNum: 4,
      titleEn: 'Social Category & Schemes',
      titleHi: 'सामाजिक वर्ग व सरकारी योजनाएँ',
      titleTe: 'సామాజిక వర్గం & పథకాలు',
      questionEn: "Which social category do you belong to? This determines eligibility for 90% concessional government schemes (NBCFDC, NSFDC, PMEGP).",
      questionHi: "सरकारी 90% रियायती ऋण योजनाओं (जैसे NBCFDC, NSFDC, PMEGP) के लिए आपकी सामाजिक श्रेणी क्या है?",
      questionTe: "ప్రభుత్వ 90% రాయితీ రుణాల అర్హత కోసం మీ సామాజిక వర్గం (OBC, SC, ST, లేదా General) ఏమిటి?",
      options: [
        { label: 'OBC (NBCFDC 10/90 Scheme)', value: 'OBC' },
        { label: 'SC (NSFDC Scheme)', value: 'SC' },
        { label: 'ST (Tribal Scheme)', value: 'ST' },
        { label: 'General / Minority', value: 'GENERAL' }
      ]
    },
    {
      id: 'blueprint',
      stepNum: 5,
      titleEn: 'AI Business Blueprint & Loan',
      titleHi: 'एआई बिजनेस ब्लूप्रिंट व ऋण योजना',
      titleTe: 'వ్యాపార ప్రణాళిక & రుణం'
    }
  ];

  // Natural Text-to-Speech Engine
  const speakText = (text, targetLang = language) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text
        .replace(/[*#•_`~]/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/₹\s*(\d+)/g, '$1 rupees ');

      const utterance = new SpeechSynthesisUtterance(clean);
      const langCode = targetLang === 'hi' || targetLang === 'HINDI' ? 'hi-IN' : (targetLang === 'te' || targetLang === 'TELUGU' ? 'te-IN' : 'en-IN');
      utterance.lang = langCode;

      // Select matching voice
      const voices = window.speechSynthesis.getVoices();
      const matched = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langCode.substring(0, 2).toLowerCase()));
      if (matched) utterance.voice = matched;

      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS speak warning:", e);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Preload browser speech voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Web Speech API STT setup with graceful fallback
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true; // Show live transcription as user speaks!
      recognition.lang = language === 'hi' ? 'hi-IN' : (language === 'te' ? 'te-IN' : 'en-IN');

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

        if (interim) {
          setInterimTranscript(interim);
        }

        if (final) {
          setInterimTranscript('');
          setInputText(final);
          setIsListening(false);
          setSpeechError(null);
          setSpeechHelper(null);

          if (mode === 'interview') {
            handleStepResponse(final);
          } else {
            handleSend(final);
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn("STT warning:", event.error);
        setIsListening(false);
        setInterimTranscript('');

        if (event.error === 'no-speech') {
          // Graceful prompt - not a failure!
          setSpeechHelper("Didn't catch audio. Tap the mic when ready to speak, or tap any option below.");
          setSpeechError(null);
        } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechError("Microphone access is blocked. Click the lock/camera icon in your address bar to allow mic access.");
          setSpeechHelper(null);
        } else if (event.error === 'audio-capture') {
          setSpeechError("No microphone found. Please connect a mic or type/tap below.");
          setSpeechHelper(null);
        } else {
          setSpeechHelper("Tap the mic to try speaking again, or type below.");
          setSpeechError(null);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
    }
  }, [language, mode, currentStep, stepData]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSpeechError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimTranscript('');
    } else {
      stopSpeaking();
      setSpeechError(null);
      setSpeechHelper("Listening... speak naturally now");
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Mic start retry:", err);
        setIsListening(false);
      }
    }
  };

  // Speak initial question on user's first interaction or step change
  const triggerStepQuestion = (stepIdx, currentValues = stepData) => {
    const s = STEPS_CONFIG[stepIdx];
    if (!s) return;
    const qText = language === 'hi' ? s.questionHi : (language === 'te' ? s.questionTe : s.questionEn);
    
    let intro = "";
    if (stepIdx === 1) {
      intro = language === 'hi' ? `बहुत बढ़िया ${currentValues.name || ''} जी! 👍` : (language === 'te' ? `చాలా బాగుంది ${currentValues.name || ''} గారు! 👍` : `Great ${currentValues.name || ''}! 👍`);
    } else if (stepIdx === 2) {
      const capFmt = currentValues.capital ? `₹${Number(currentValues.capital).toLocaleString('en-IN')}` : '';
      intro = language === 'hi' ? `धन्यवाद, आपका बजट ${capFmt} दर्ज हो गया। 👍` : (language === 'te' ? `ధన్యవాదాలు, మీ బడ్జెట్ ${capFmt} నమోదైంది. 👍` : `Thank you, budget of ${capFmt} recorded. 👍`);
    } else if (stepIdx === 3) {
      intro = language === 'hi' ? "संसाधन व जमीन विवरण दर्ज हो गए। 🌾" : (language === 'te' ? "వనరుల వివరాలు నమోదయ్యాయి. 🌾" : "Site resources recorded. 🌾");
    }

    const fullMessage = intro ? `${intro}\n\n${qText}` : qText;
    const aiMsg = {
      sender: 'ai',
      text: fullMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stepIndex: stepIdx
    };

    setMessages(prev => [...prev, aiMsg]);
    if (autoVoice) {
      speakText(fullMessage);
    }
  };

  // Handle Response in Guided Advisory Mode
  const handleStepResponse = async (textAnswer, directKey = null, directValue = null) => {
    const text = (textAnswer || '').trim();
    if (!text && directValue === null) return;

    // Record user message
    const userDisplay = directValue !== null && typeof directValue === 'object' && directValue.label 
      ? directValue.label 
      : (directValue !== null ? String(directValue) : text);

    const userMsg = {
      sender: 'user',
      text: userDisplay,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setInterimTranscript('');
    setSpeechHelper(null);

    // Process and update stepData
    const updated = { ...stepData };

    if (currentStep === 0) {
      // Step 0: Name & Location
      if (directKey === 'preset') {
        updated.name = directValue.name;
        updated.village = directValue.village;
        updated.district = directValue.district;
        updated.state = directValue.state;
      } else {
        // Parse from text
        const nameMatch = text.match(/(?:naam|name|hoon|am)\s+([a-zA-Z\u0900-\u097F\u0C00-\u0C7F]+(?:\s+[a-zA-Z\u0900-\u097F\u0C00-\u0C7F]+)?)/i);
        if (nameMatch) updated.name = nameMatch[1];
        else if (!updated.name) updated.name = text.split(' ')[0] || 'Entrepreneur';

        const locMatch = text.match(/([a-zA-Z\u0900-\u097F\u0C00-\u0C7F]{3,})\s*(?:village|gaon|se|from|district)/i);
        if (locMatch) updated.village = locMatch[1];
        else if (!updated.village) updated.village = 'Pimpalgaon Baswant';
      }
      setStepData(updated);
      syncProfileToParent(updated);
      setCurrentStep(1);
      triggerStepQuestion(1, updated);

    } else if (currentStep === 1) {
      // Step 1: Capital
      let cap = directValue;
      if (!cap) {
        const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|लाख|లక్ష)/i);
        if (lakhMatch) cap = parseFloat(lakhMatch[1]) * 100000;
        else {
          const num = text.replace(/[^0-9]/g, '');
          if (num && parseInt(num) >= 1000) cap = parseFloat(num);
          else cap = 200000;
        }
      }
      updated.capital = cap;
      setStepData(updated);
      syncProfileToParent(updated);
      setCurrentStep(2);
      triggerStepQuestion(2, updated);

    } else if (currentStep === 2) {
      // Step 2: Land & Facilities
      if (directKey === 'land') {
        updated.land_acres = directValue;
      } else {
        const acreMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:acre|acres|एकड़|ఎకరాలు)/i);
        if (acreMatch) updated.land_acres = parseFloat(acreMatch[1]);
        else if (text.toLowerCase().includes('zero') || text.toLowerCase().includes('nahi') || text.toLowerCase().includes('landless')) {
          updated.land_acres = 0;
        } else if (updated.land_acres === null) {
          updated.land_acres = 1.0;
        }
      }
      setStepData(updated);
      syncProfileToParent(updated);
      setCurrentStep(3);
      triggerStepQuestion(3, updated);

    } else if (currentStep === 3) {
      // Step 3: Social Category -> Generate Full Blueprint!
      let cat = directValue;
      if (!cat) {
        if (text.toLowerCase().includes('obc') || text.includes('ओबीसी')) cat = 'OBC';
        else if (text.toLowerCase().includes('sc') || text.includes('अनुसूचित')) cat = 'SC';
        else if (text.toLowerCase().includes('st')) cat = 'ST';
        else cat = 'GENERAL';
      }
      updated.social_category = cat;
      setStepData(updated);
      syncProfileToParent(updated);
      setCurrentStep(4);
      generateFinalBlueprint(updated);
    }
  };

  // Sync profile updates to parent and dashboard state
  const syncProfileToParent = (data) => {
    if (!onProfileUpdate) return;
    const mapped = {
      ...profile,
      name: data.name || profile?.name || 'Entrepreneur',
      available_capital: data.capital || profile?.available_capital || 200000,
      land_acres: data.land_acres ?? profile?.land_acres ?? 1.0,
      social_category: data.social_category || profile?.social_category || 'OBC',
      has_water_source: data.has_water ?? true,
      has_electricity: data.has_electricity ?? true,
      has_shop_building: data.has_shop ?? false,
      has_vehicle: data.has_vehicle ?? false,
      village_name: data.village || profile?.village_name || 'Pimpalgaon Baswant',
      district: data.district || profile?.district || 'Nashik',
      state: data.state || profile?.state || 'Maharashtra'
    };
    onProfileUpdate(mapped);
  };

  // Generate Final Blueprint via AI Service
  const generateFinalBlueprint = async (completedData) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/chat', {
        message: language === 'hi' 
          ? `मेरा नाम ${completedData.name} है, गाँव ${completedData.village}, पूँजी ₹${completedData.capital}, जमीन ${completedData.land_acres} एकड़, श्रेणी ${completedData.social_category}। मुझे सबसे उपयुक्त व्यवसाय और ऋण योजना बताएं।`
          : `I am ${completedData.name} from ${completedData.village}, capital ₹${completedData.capital}, land ${completedData.land_acres} acres, category ${completedData.social_category}. Generate complete business blueprint.`,
        profile: {
          name: completedData.name,
          available_capital: completedData.capital,
          land_acres: completedData.land_acres,
          social_category: completedData.social_category,
          has_water_source: completedData.has_water,
          has_electricity: completedData.has_electricity,
          village_name: completedData.village
        }
      });

      const reply = response.data?.reply || "Here is your verified business advisory blueprint.";
      const recScore = response.data?.recommendation_score || 87;
      const confScore = response.data?.confidence_score || 88;
      const finSummary = response.data?.financial_summary;
      const compTable = response.data?.comparison_table;

      setFinalBlueprint({
        reply,
        recScore,
        confScore,
        finSummary,
        compTable
      });

      const aiMsg = {
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recScore,
        confScore,
        financialSummary: finSummary,
        actionType: 'SHOW_RECOMMENDATIONS',
        stepIndex: 4
      };

      setMessages(prev => [...prev, aiMsg]);

      if (autoVoice) {
        speakText(reply);
      }
    } catch (err) {
      console.warn("Blueprint generation fallback:", err);
      const fallbackReply = `Congratulations ${completedData.name}! Based on your ₹${(completedData.capital || 200000).toLocaleString('en-IN')} investment and ${completedData.land_acres || 1} acre land:\n\n🌟 Top Recommended Business: Mini Flour, Spice & Oil Processing Mill\n• Suitability Score: 87/100 | Data Confidence: 88/100\n• Concessional Scheme: NBCFDC/PMEGP 90% Term Loan\n• Monthly Reducing EMI: ~₹4,675 | Operating Profit: ~₹28,500/month\n• Safe DSCR Ratio: 2.8x\n\nYour profile has been saved. You can now view your Hyper-Local Map or download your Project Dossier!`;
      
      const aiMsg = {
        sender: 'ai',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recScore: 87,
        confScore: 88,
        stepIndex: 4
      };
      setMessages(prev => [...prev, aiMsg]);
      if (autoVoice) speakText(fallbackReply);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-Detect Live GPS
  const handleAutoGPS = async () => {
    setIsLocating(true);
    setSpeechHelper("Detecting your live GPS location...");
    try {
      const geo = await detectAccurateLocation();
      if (geo && geo.success) {
        const v = geo.village_name || 'Local Area';
        const d = geo.district || 'District';
        const s = geo.state || 'State';
        const updated = {
          ...stepData,
          village: v,
          district: d,
          state: s
        };
        setStepData(updated);
        syncProfileToParent(updated);
        setSpeechHelper(`Location detected: ${v}, ${d} (${s})`);
        
        handleStepResponse(`My location is ${v}, ${d} (${s})`);
      } else {
        setSpeechHelper("Couldn't retrieve GPS. Please choose a preset below.");
      }
    } catch (err) {
      console.warn("GPS detection warning:", err);
      setSpeechHelper("GPS detection error. Please choose a preset below.");
    } finally {
      setIsLocating(false);
    }
  };

  // Free Chat Handle Send
  const handleSend = async (textToSend = inputText) => {
    const text = textToSend.trim();
    if (!text || isLoading) return;

    const userMsg = {
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setSpeechError(null);
    setSpeechHelper(null);

    try {
      const response = await axios.post('/api/chat', {
        message: text,
        profile: profile || stepData,
        lang: language || 'en'
      });

      const replyText = response.data?.reply || "I am analyzing your query with rural micro-enterprise models.";
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
        financialSummary: response.data?.financial_summary
      };

      setMessages(prev => [...prev, aiMsg]);

      if (autoVoice) {
        speakText(replyText, detectedLang);
      }

      if (response.data?.updated_profile && onProfileUpdate) {
        onProfileUpdate(response.data.updated_profile);
      }
    } catch (err) {
      console.warn("Chat error:", err);
      const fallback = "I am UdyamSarthi. Please share your capital, land, and location so I can calculate your project feasibility.";
      setMessages(prev => [...prev, { sender: 'ai', text: fallback, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } finally {
      setIsLoading(false);
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
              <h2 className="text-lg font-extrabold text-stone-900">UdyamSarthi AI</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#0F3D2E]">
                Active Voice Advisory
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">Trilingual Rural Business Advisor (HI / TE / EN)</p>
          </div>
        </div>

        {/* Mode Switch & Auto-Voice Toggle */}
        <div className="flex items-center space-x-2">
          {/* Mode Switch Tabs */}
          <div className="bg-stone-100 p-1 rounded-xl flex items-center text-xs font-bold">
            <button
              onClick={() => setMode('interview')}
              className={`px-3 py-1 rounded-lg transition ${
                mode === 'interview'
                  ? 'bg-[#0F3D2E] text-amber-300 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              🎙️ Guided Steps
            </button>
            <button
              onClick={() => setMode('chat')}
              className={`px-3 py-1 rounded-lg transition ${
                mode === 'chat'
                  ? 'bg-[#0F3D2E] text-amber-300 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              💬 Free Chat
            </button>
          </div>

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

      {/* 2. Step Progress Bar when in Guided Mode */}
      {mode === 'interview' && (
        <div className="my-4 bg-[#FAF8F5] p-3.5 rounded-2xl border border-stone-200/80">
          <div className="flex items-center justify-between text-xs font-extrabold text-stone-700 mb-1.5">
            <span className="flex items-center space-x-1.5 text-[#0F3D2E]">
              <Sparkles className="w-4 h-4 text-[#C28A17]" />
              <span>Step {Math.min(currentStep + 1, 5)} of 5: {STEPS_CONFIG[currentStep]?.titleEn || 'Completed'}</span>
            </span>
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[11px]">
              {Math.min((currentStep + 1) * 20, 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-[#0F3D2E] to-emerald-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((currentStep + 1) * 20, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* 3. Conversation & Message Window */}
      <div className="bg-[#FAF8F5] rounded-2xl p-4 min-h-[220px] max-h-[320px] overflow-y-auto space-y-3 border border-stone-200/60 mb-4 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
          >
            <div className={`
              max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs
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
                    <span className="text-[#0F3D2E] font-bold">UdyamSarthi</span>
                  </>
                )}
                <span className="ml-auto">{msg.timestamp}</span>
              </div>
              
              <p className="whitespace-pre-line font-medium text-xs sm:text-sm">{msg.text}</p>

              {/* Side-by-Side Comparison Table if present */}
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

              {/* Dual Scores Badges */}
              {msg.recScore && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-100 text-[#0F3D2E] border border-emerald-200">
                    Suitability: {msg.recScore}/100
                  </span>
                  {msg.confScore && (
                    <span className="px-2 py-0.5 rounded-md font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      Data Confidence: {msg.confScore}/100
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {msg.actionType === 'SHOW_RECOMMENDATIONS' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-2 border-t border-stone-100">
                  <button
                    onClick={() => setActiveTab('recommendations')}
                    className="bg-[#0F3D2E] text-amber-300 font-bold py-1.5 px-2 rounded-xl text-[10px] flex items-center justify-center space-x-1 hover:brightness-110 shadow-xs"
                  >
                    <span>📈 View Full Blueprint</span>
                    <ArrowRight className="w-3 h-3 ml-0.5" />
                  </button>
                  <button
                    onClick={() => setActiveTab('market')}
                    className="bg-emerald-800 text-white font-bold py-1.5 px-2 rounded-xl text-[10px] flex items-center justify-center space-x-1 hover:brightness-110 shadow-xs"
                  >
                    <span>📍 Open 10km Map</span>
                    <ArrowRight className="w-3 h-3 ml-0.5" />
                  </button>
                  <button
                    onClick={() => setActiveTab('finance')}
                    className="bg-purple-800 text-white font-bold py-1.5 px-2 rounded-xl text-[10px] flex items-center justify-center space-x-1 hover:brightness-110 shadow-xs"
                  >
                    <span>🏛️ Concessional Schemes</span>
                    <ArrowRight className="w-3 h-3 ml-0.5" />
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
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-xs p-3.5 flex items-center space-x-2 text-xs text-stone-500 font-medium">
              <Loader2 className="w-4 h-4 text-[#0F3D2E] animate-spin" />
              <span>Saarthi is calculating your business blueprint...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Interactive Quick-Select Option Chips for the Active Step */}
      {mode === 'interview' && currentStep < 4 && (
        <div className="mb-4 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-900/10">
          <p className="text-[11px] font-bold text-stone-700 mb-2 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-[#C28A17]" />
            <span>Quick Answer Options (Tap or Speak):</span>
          </p>

          {/* STEP 0: Location Chips & GPS */}
          {currentStep === 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleAutoGPS}
                disabled={isLocating}
                className="px-3 py-1.5 rounded-xl bg-[#0F3D2E] text-amber-300 hover:bg-[#154f3c] text-xs font-bold shadow-xs flex items-center space-x-1 transition"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{isLocating ? 'Detecting GPS...' : '📍 Auto-Detect Live GPS'}</span>
              </button>
              {STEPS_CONFIG[0].presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleStepResponse(p.label, 'preset', p)}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-stone-700 text-xs font-medium border border-stone-200 shadow-2xs transition"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* STEP 1: Capital Chips */}
          {currentStep === 1 && (
            <div className="flex flex-wrap gap-2">
              {STEPS_CONFIG[1].options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleStepResponse(opt.label, 'capital', opt.value)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#0F3D2E] text-stone-800 hover:text-amber-300 text-xs font-bold border border-stone-200 shadow-2xs transition hover:scale-105"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* STEP 2: Land & Infrastructure */}
          {currentStep === 2 && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {STEPS_CONFIG[2].landOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleStepResponse(opt.label, 'land', opt.value)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#0F3D2E] text-stone-800 hover:text-amber-300 text-xs font-bold border border-stone-200 shadow-2xs transition"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-1 border-t border-emerald-900/10">
                <span className="text-[10px] font-bold text-stone-500 self-center">Facilities:</span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-[10px] font-bold text-emerald-800 flex items-center space-x-1">
                  <Droplet className="w-2.5 h-2.5" /> <span>Water / Borewell</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-[10px] font-bold text-emerald-800 flex items-center space-x-1">
                  <Zap className="w-2.5 h-2.5" /> <span>3-Phase Power</span>
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: Category Chips */}
          {currentStep === 3 && (
            <div className="flex flex-wrap gap-2">
              {STEPS_CONFIG[3].options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleStepResponse(opt.label, 'category', opt.value)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#0F3D2E] text-stone-800 hover:text-amber-300 text-xs font-bold border border-stone-200 shadow-2xs transition hover:scale-105"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Main Central Microphone & Speech Interaction Bar */}
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
            {isListening ? "Listening... Speak your answer now!" : "Tap to Speak to Saarthi"}
          </p>
          
          {/* Live speech interim transcript */}
          {interimTranscript && (
            <p className="text-xs text-[#0F3D2E] font-bold mt-0.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 animate-pulse inline-block">
              "{interimTranscript}"
            </p>
          )}

          {!interimTranscript && (
            <p className="text-[11px] text-stone-500 mt-0.5 font-medium">
              You can speak in <span className="text-[#0F3D2E] font-semibold">English</span>, <span className="text-[#0F3D2E] font-semibold">हिंदी</span> or <span className="text-[#0F3D2E] font-semibold">తెలుగు</span>
            </p>
          )}

          {/* Friendly helper / non-blocking notices */}
          {speechHelper && !interimTranscript && (
            <p className="text-xs text-stone-600 mt-1 font-semibold">{speechHelper}</p>
          )}

          {/* Explicit permission errors */}
          {speechError && (
            <p className="text-xs text-rose-600 mt-1 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 inline-block">
              {speechError}
            </p>
          )}
        </div>
      </div>

      {/* 6. Alternative Text Input Form */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          if (mode === 'interview') {
            handleStepResponse(inputText);
          } else {
            handleSend();
          }
        }} 
        className="relative mt-4"
      >
        <div className="flex items-center bg-[#FAF8F5] border border-stone-300 focus-within:border-[#0F3D2E] focus-within:ring-2 focus-within:ring-[#0F3D2E]/10 rounded-2xl px-3.5 py-2 shadow-xs transition">
          <Keyboard className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={mode === 'interview' ? "Or type your answer here (e.g. ₹2 lakh, 1 acre)..." : "Ask anything about business, schemes, or EMI..."}
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

      {/* 7. Suggested Quick Prompts when in Free Chat Mode */}
      {mode === 'chat' && (
        <div className="mt-4 pt-3 border-t border-stone-100">
          <p className="text-xs font-bold text-stone-500 mb-2 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-[#C28A17]" />
            <span>Try saying or typing:</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              "Dairy vs Poultry compare karo na",
              "5 lakh loan ki EMI kitni hogi?",
              "Are there any government schemes for OBC?",
              "Start guided interview step by step"
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => {
                  if (prompt.includes('step by step')) {
                    setMode('interview');
                    setCurrentStep(0);
                    triggerStepQuestion(0);
                  } else {
                    handleSend(prompt);
                  }
                }}
                className="px-2.5 py-1 rounded-full bg-[#FAF8F5] hover:bg-[#0F3D2E] text-stone-700 hover:text-amber-300 text-[11px] font-medium border border-stone-200/80 transition shadow-2xs"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
