import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  MapPin,
  Coins,
  Tractor,
  Droplet,
  Zap,
  Shield,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Navigation,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  FileCheck2,
  Edit3,
  Bot,
  HelpCircle,
  CornerDownRight,
  Check,
  ChevronRight,
  Camera,
  Upload,
  Trash2,
  Building2,
  Home,
  Save
} from 'lucide-react';
import axios from 'axios';
import { detectAccurateLocation } from '../utils/geolocation';
import { translations } from '../locales/translations';

export default function ProfileWizard({ profile, setProfile, onRunAdvisory, lang }) {
  const t = translations[lang] || translations.en;

  // Registration Mode: 'manual' (self-fill) or 'ai' (interactive step-by-step AI interviewer)
  const [regMode, setRegMode] = useState('ai');
  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(null);
  const [profileSaveNotice, setProfileSaveNotice] = useState(false);
  const photoInputRef = useRef(null);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProfile((prev) => ({
        ...prev,
        photo: ev.target.result
      }));
      setProfileSaveNotice(true);
      setTimeout(() => setProfileSaveNotice(false), 2500);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfile((prev) => ({
      ...prev,
      photo: ''
    }));
    if (photoInputRef.current) photoInputRef.current.value = '';
    setProfileSaveNotice(true);
    setTimeout(() => setProfileSaveNotice(false), 2500);
  };

  const handleSaveProfileDirect = async () => {
    try {
      await axios.post('/api/profile', profile);
    } catch (e) {
      console.warn("Direct profile sync:", e);
    }
    setProfileSaveNotice(true);
    setTimeout(() => setProfileSaveNotice(false), 3000);
  };

  // Step-by-step conversational interview state
  // Steps: 0: name, 1: location, 2: capital, 3: land, 4: social_category, 5: utilities, 6: skills, 7: review
  const [stepIndex, setStepIndex] = useState(0);
  const [voiceGuidance, setVoiceGuidance] = useState(true); // Voice ON by default so AI talks with user
  const [isAiListening, setIsAiListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [aiInterimTranscript, setAiInterimTranscript] = useState('');
  const [newlyFilledFields, setNewlyFilledFields] = useState([]);

  const aiMessagesEndRef = useRef(null);
  const aiRecognitionRef = useRef(null);
  const isAiListeningRef = useRef(false);
  const accumulatedAiTranscriptRef = useRef('');
  const aiInterimTranscriptRef = useRef('');
  const aiSilenceTimeoutRef = useRef(null);
  const aiMaxSessionTimeoutRef = useRef(null);
  const langRef = useRef(lang);
  const handleAiChatSubmitRef = useRef(null);

  // Configuration of each question in the AI guided interview
  const STEPS = [
    {
      id: 'name',
      titleEn: 'Full Name',
      titleHi: 'शुभ नाम',
      titleTe: 'పూర్తి పేరు',
      questionEn: "Hello! Let's get your enterprise registered step-by-step. What is your full name?",
      questionHi: "नमस्ते! चलिए आपका उद्यम पंजीकरण शुरू करते हैं। कृपया अपना पूरा नाम बताएं।",
      questionTe: "నమస్కారం! మీ వ్యాపార నమోదును ప్రారంభిద్దాం. మీ పూర్తి పేరు ఏమిటి?",
      suggestions: ['Ramesh Kisan', 'Suresh Maurya', 'Lakshmi Devi', 'Sunita Patil'],
      isDone: (p) => Boolean(p.name && p.name.trim().length > 1)
    },
    {
      id: 'location',
      titleEn: 'Location & GPS',
      titleHi: 'गाँव व लोकेशन',
      titleTe: 'ప్రాంతం & GPS',
      questionEn: (p) => `Great ${p.name || 'friend'}! Which village or district are you located in? You can also tap '📍 Auto-Detect Live GPS' below.`,
      questionHi: (p) => `बहुत बढ़िया ${p.name || ''} जी! आपका गाँव, शहर या जिला कौन सा है? आप नीचे दिए गए '📍 ऑटो-डिटेक्ट GPS' बटन से भी अपनी सटीक लोकेशन जोड़ सकते हैं।`,
      questionTe: (p) => `చాలా బాగుంది ${p.name || ''}! మీ గ్రామం లేదా జిల్లా ఏమిటి? లేదా లైవ్ GPS ద్వారా లొకేషన్ ఎంచుకోండి.`,
      presets: [
        { label: 'Pimpalgaon Baswant (Nashik, MH)', lat: 20.1706, lon: 73.9840, v: 'Pimpalgaon Baswant', d: 'Nashik', s: 'Maharashtra' },
        { label: 'Kankipadu (Krishna, AP)', lat: 16.4258, lon: 80.7712, v: 'Kankipadu', d: 'Krishna', s: 'Andhra Pradesh' },
        { label: 'Chaubeypur (Varanasi, UP)', lat: 25.4380, lon: 83.0560, v: 'Chaubeypur', d: 'Varanasi', s: 'Uttar Pradesh' },
        { label: 'Mogri Rural (Anand, GJ)', lat: 22.5360, lon: 72.9340, v: 'Mogri Rural', d: 'Anand', s: 'Gujarat' }
      ],
      isDone: (p) => Boolean(p.village_name || (p.latitude && p.longitude))
    },
    {
      id: 'capital',
      titleEn: 'Available Budget',
      titleHi: 'पूँजी / बजट',
      titleTe: 'పెట్టుబడి బడ్జెట్',
      questionEn: () => "How much personal liquid capital (savings in ₹) do you have available to invest in this business?",
      questionHi: () => "व्यवसाय शुरू करने के लिए आपके पास अपनी खुद की कितनी पूँजी (रुपये में बचत) उपलब्ध है?",
      questionTe: () => "ఈ వ్యాపారంలో పెట్టుబడి పెట్టడానికి మీ వద్ద ఎంత సొంత నగదు అందుబాటులో ఉంది?",
      options: [
        { label: '₹50,000', value: 50000 },
        { label: '₹1,00,000', value: 100000 },
        { label: '₹2,00,000', value: 200000 },
        { label: '₹3,00,000', value: 300000 },
        { label: '₹5,00,000+', value: 500000 }
      ],
      isDone: (p) => Boolean(p.available_capital && p.available_capital > 0)
    },
    {
      id: 'land',
      titleEn: 'Land Holding',
      titleHi: 'जमीन / भूखंड',
      titleTe: 'భూమి వివరాలు',
      questionEn: () => "How much land area (in acres) do you own or have access to for your enterprise?",
      questionHi: () => "कार्य या खेती हेतु आपके पास कुल कितनी जमीन (एकड़ में) उपलब्ध है?",
      questionTe: () => "వ్యాపారం లేదా సాగు కోసం మీ వద్ద ఎన్ని ఎకరాల భూమి అందుబాటులో ఉంది?",
      options: [
        { label: '0 Acres (Landless / गैर-कृषि)', value: 0 },
        { label: '0.5 Acre', value: 0.5 },
        { label: '1.0 Acre', value: 1.0 },
        { label: '2.0 Acres', value: 2.0 },
        { label: '5.0+ Acres', value: 5.0 }
      ],
      isDone: (p) => Boolean(p.land_acres !== undefined && p.land_acres !== null)
    },
    {
      id: 'social_category',
      titleEn: 'Social Category',
      titleHi: 'सामाजिक वर्ग',
      titleTe: 'సామాజిక వర్గం',
      questionEn: () => "Which social category do you belong to? (Required to check eligibility for MoSJE concessional schemes like NBCFDC & NSFDC)",
      questionHi: () => "सरकारी 10/90 रियायती ऋण योजनाओं (NBCFDC/NSFDC) की पात्रता हेतु आपका सामाजिक वर्ग क्या है?",
      questionTe: () => "ప్రభుత్వ రాయితీ రుణాల అర్హత కోసం మీ సామాజిక వర్గం (కేటగిరీ) ఏమిటి?",
      options: [
        { label: 'OBC (Other Backward Classes - NBCFDC)', value: 'OBC' },
        { label: 'SC (Scheduled Caste - NSFDC)', value: 'SC' },
        { label: 'DNT (De-notified Tribes)', value: 'DNT' },
        { label: 'General Category', value: 'GENERAL' },
        { label: 'ST (Scheduled Tribe)', value: 'ST' }
      ],
      isDone: (p) => Boolean(p.social_category)
    },
    {
      id: 'utilities',
      titleEn: 'Site Infrastructure',
      titleHi: 'सुविधाएँ व बुनियादी ढांचा',
      titleTe: 'సౌకర్యాలు',
      questionEn: () => "What utilities and facilities are available at your site? (Toggle all that apply, then click Continue)",
      questionHi: () => "कार्यस्थल पर इनमें से क्या-क्या सुविधाएँ उपलब्ध हैं? (लागू होने वाली सुविधाओं पर टिक करें, फिर आगे बढ़ें)",
      questionTe: () => "మీ పని ప్రదేశంలో ఏ సౌకర్యాలు అందుబాటులో ఉన్నాయి?",
      items: [
        { key: 'has_water_source', labelEn: '💧 Water / Borewell', labelHi: '💧 पानी / बोरवेल' },
        { key: 'has_electricity', labelEn: '⚡ 3-Phase Power', labelHi: '⚡ 3-फेज बिजली' },
        { key: 'has_vehicle', labelEn: '🚛 Commercial Vehicle', labelHi: '🚛 व्यावसायिक वाहन' },
        { key: 'has_shop_building', labelEn: '🏪 Roadside Shed / Shop', labelHi: '🏪 सड़क किनारे दुकान/शेड' }
      ],
      isDone: () => true
    },
    {
      id: 'skills',
      titleEn: 'Skills & Experience',
      titleHi: 'कौशल व अनुभव',
      titleTe: 'నైపుణ్యాలు',
      questionEn: () => "What skills or prior work experience do you have? (Select your background so AI suggests high-profit matches)",
      questionHi: () => "आपको किस कार्य या व्यवसाय का अनुभव अथवा रुचि है? (AI इसके आधार पर सर्वाधिक लाभप्रद व्यवसाय चुनेगा)",
      questionTe: () => "మీకు ఏ రంగంలో మునుపటి అనుభవం లేదా నైపుణ్యం ఉంది?",
      items: [
        { key: 'farming', label: '🌾 Farming / Agriculture' },
        { key: 'dairy', label: '🐄 Dairy / Milk' },
        { key: 'poultry', label: '🐔 Poultry' },
        { key: 'goat_farming', label: '🐐 Goat Farming' },
        { key: 'food_processing', label: '📦 Food Processing' },
        { key: 'retail', label: '🏪 Retail / Shop' },
        { key: 'machinery', label: '⚙️ Machinery / Tractor' }
      ],
      isDone: (p) => Boolean(p.skills && p.skills.length > 0)
    },
    {
      id: 'review',
      titleEn: 'Review & Submit',
      titleHi: 'पुष्टि व अंतिम सबमिशन',
      titleTe: 'ధృవీకరణ',
      questionEn: () => "Excellent! All 7 registration parameters are recorded accurately. Review your summary below and submit to calculate your business advisory dossier.",
      questionHi: () => "शानदार! आपके सभी 7 विवरण सफलतापूर्वक दर्ज हो गए हैं। नीचे दिया गया फाइनल डॉसियर देखें और 'Complete Registration & Generate Advisory' पर क्लिक करें।",
      questionTe: () => "మీ 7 వివరాలు విజయవంతంగా నమోదయ్యాయి! మీ వ్యాపార నివేదికను రూపొందించడానికి క్రింది బటన్ పై క్లిక్ చేయండి.",
      isDone: () => true
    }
  ];

  // AI Chat Conversation Stream
  const [aiChatMessages, setAiChatMessages] = useState([]);

  // Audio Speech Synthesis helper - AI talks out loud to farmer
  const speakText = (text) => {
    if (!voiceGuidance || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*•#_]/g, '');
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = lang === 'hi' ? 'hi-IN' : (lang === 'te' ? 'te-IN' : 'en-IN');
      u.rate = 1.0;

      u.onstart = () => {
        setIsAiSpeaking(true);
      };

      u.onend = () => {
        setIsAiSpeaking(false);
        // Automatically start listening after question is spoken
        if (voiceGuidance && aiRecognitionRef.current && !isAiListening) {
          try {
            aiRecognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : (lang === 'te' ? 'te-IN' : 'en-IN');
            aiRecognitionRef.current.start();
            setIsAiListening(true);
          } catch (e) {
            console.warn("Auto-mic start info:", e.message);
          }
        }
      };

      u.onerror = () => {
        setIsAiSpeaking(false);
      };

      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn("TTS error:", e);
      setIsAiSpeaking(false);
    }
  };

  // Get current step question text in the active language
  const getStepQuestion = (stepIdx, currProfile = profile) => {
    const s = STEPS[stepIdx] || STEPS[0];
    if (typeof s.questionHi === 'function') {
      return lang === 'hi' ? s.questionHi(currProfile) : (lang === 'te' ? s.questionTe(currProfile) : s.questionEn(currProfile));
    }
    return lang === 'hi' ? s.questionHi : (lang === 'te' ? s.questionTe : s.questionEn);
  };

  // Ask question for a specific step
  const triggerQuestionForStep = (newStepIdx, currProfile = profile, introMessage = '') => {
    setStepIndex(newStepIdx);
    const questionText = getStepQuestion(newStepIdx, currProfile);
    const fullText = introMessage ? `${introMessage}\n\n${questionText}` : questionText;

    const aiMsg = {
      sender: 'ai',
      text: fullText,
      stepId: STEPS[newStepIdx]?.id,
      isQuestion: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAiChatMessages(prev => [...prev, aiMsg]);
    speakText(fullText);
  };

  // Initial greeting and Question 1 on component mount
  useEffect(() => {
    if (aiChatMessages.length === 0) {
      const qText = getStepQuestion(0, profile);
      setAiChatMessages([
        {
          sender: 'ai',
          text: qText,
          stepId: 'name',
          isQuestion: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      speakText(qText);
    }
  }, []);

  useEffect(() => {
    langRef.current = lang;
    if (aiRecognitionRef.current) {
      aiRecognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : (lang === 'te' ? 'te-IN' : 'en-IN');
    }
  }, [lang]);

  const submitSpokenAiAnswer = (directTranscript = null) => {
    const raw = (
      directTranscript || 
      accumulatedAiTranscriptRef.current || 
      aiInterimTranscriptRef.current || 
      aiInputText || 
      ''
    ).trim();

    isAiListeningRef.current = false;
    setIsAiListening(false);

    if (aiSilenceTimeoutRef.current) {
      clearTimeout(aiSilenceTimeoutRef.current);
      aiSilenceTimeoutRef.current = null;
    }
    if (aiMaxSessionTimeoutRef.current) {
      clearTimeout(aiMaxSessionTimeoutRef.current);
      aiMaxSessionTimeoutRef.current = null;
    }

    try {
      if (aiRecognitionRef.current) {
        aiRecognitionRef.current.stop();
      }
    } catch (e) {}

    setAiInterimTranscript('');
    aiInterimTranscriptRef.current = '';

    if (raw) {
      setAiInputText(raw);
      accumulatedAiTranscriptRef.current = '';
      handleAiChatSubmitRef.current?.(raw);
    }
  };

  // Robust Web Speech API STT setup with continuous listening and keep-alive
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;       // Continuous: DO NOT cut off on silence!
      recognition.interimResults = true;   // Live transcription
      recognition.maxAlternatives = 1;
      recognition.lang = langRef.current === 'hi' ? 'hi-IN' : (langRef.current === 'te' ? 'te-IN' : 'en-IN');

      recognition.onstart = () => {
        setIsAiListening(true);
        isAiListeningRef.current = true;
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
          accumulatedAiTranscriptRef.current = (accumulatedAiTranscriptRef.current + ' ' + final).trim();
        }

        const combined = (accumulatedAiTranscriptRef.current + ' ' + interim).trim();
        if (combined) {
          aiInterimTranscriptRef.current = combined;
          setAiInterimTranscript(combined);
          setAiInputText(combined);
        }

        if (aiSilenceTimeoutRef.current) {
          clearTimeout(aiSilenceTimeoutRef.current);
        }

        // Auto-finalize after 2.0s of silence once speech is detected!
        if (combined.length > 0) {
          aiSilenceTimeoutRef.current = setTimeout(() => {
            if (isAiListeningRef.current) {
              submitSpokenAiAnswer();
            }
          }, 2000);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Profile STT warning:", event.error);
        if (event.error === 'no-speech') return; // Do not close on pause
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          isAiListeningRef.current = false;
          setIsAiListening(false);
          alert("Microphone access is blocked. Please allow microphone access in your browser address bar.");
          return;
        }
      };

      recognition.onend = () => {
        // If user is STILL supposed to be listening, keep it alive so it never shuts down after 1s!
        if (isAiListeningRef.current) {
          try {
            recognition.lang = langRef.current === 'hi' ? 'hi-IN' : (langRef.current === 'te' ? 'te-IN' : 'en-IN');
            recognition.start();
          } catch (err) {
            setTimeout(() => {
              if (isAiListeningRef.current) {
                try {
                  recognition.start();
                } catch (e) {
                  isAiListeningRef.current = false;
                  setIsAiListening(false);
                }
              }
            }, 300);
          }
        } else {
          setIsAiListening(false);
          setAiInterimTranscript('');
          aiInterimTranscriptRef.current = '';
        }
      };

      aiRecognitionRef.current = recognition;
    }

    return () => {
      isAiListeningRef.current = false;
      if (aiSilenceTimeoutRef.current) clearTimeout(aiSilenceTimeoutRef.current);
      if (aiMaxSessionTimeoutRef.current) clearTimeout(aiMaxSessionTimeoutRef.current);
      if (aiRecognitionRef.current) {
        try {
          aiRecognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChatMessages, isAiLoading, stepIndex]);

  // Live GPS & Network location detection
  const handleDetectLiveGPS = async () => {
    setIsLocating(true);
    setGpsStatus("Detecting location (GPS / Network WiFi)...");

    const result = await detectAccurateLocation();

    if (result.success) {
      const updated = {
        ...profile,
        latitude: result.latitude,
        longitude: result.longitude,
        village_name: result.village_name,
        district: result.district,
        state: result.state,
        pincode: result.pincode || profile.pincode
      };

      setProfile(updated);
      setGpsStatus(`✓ ${result.message}`);
      setNewlyFilledFields(prev => [...new Set([...prev, 'location', 'gps'])]);

      // If in AI interview, add user selection and advance to Step 2 (Capital)
      if (regMode === 'ai') {
        const userMsg = {
          sender: 'user',
          text: `📍 Location Auto-Detected: ${result.village_name}, ${result.district} (${result.latitude.toFixed(4)}° N, ${result.longitude.toFixed(4)}° E)`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setAiChatMessages(prev => [...prev, userMsg]);

        const confirmText = lang === 'hi'
          ? `✓ आपकी लोकेशन (${result.village_name}, ${result.district}) दर्ज कर ली गई है!`
          : `✓ Location locked for ${result.village_name}, ${result.district}!`;

        advanceToNextStep(updated, 1, confirmText);
      }
    } else {
      setGpsStatus(result.message);
    }

    setIsLocating(false);
  };

  // Helper to advance to the next step
  const advanceToNextStep = (currProfile, currentIdx, confirmationMessage = '') => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < STEPS.length) {
      triggerQuestionForStep(nextIdx, currProfile, confirmationMessage);
    } else {
      triggerQuestionForStep(STEPS.length - 1, currProfile, confirmationMessage);
    }
  };

  // Handle direct 1-click chip answer
  const handleChipAnswer = (field, value, displayLabel) => {
    const userMsg = {
      sender: 'user',
      text: displayLabel || String(value),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setAiChatMessages(prev => [...prev, userMsg]);

    const updated = { ...profile };
    if (field === 'location_preset') {
      updated.latitude = value.lat;
      updated.longitude = value.lon;
      updated.village_name = value.v;
      updated.district = value.d;
      updated.state = value.s;
      setNewlyFilledFields(prev => [...new Set([...prev, 'location'])]);
    } else {
      updated[field] = value;
      setNewlyFilledFields(prev => [...new Set([...prev, field])]);
    }

    setProfile(updated);

    const confirmationText = lang === 'hi'
      ? `✓ दर्ज किया: ${displayLabel || value}`
      : `✓ Recorded: ${displayLabel || value}`;

    advanceToNextStep(updated, stepIndex, confirmationText);
  };

  // Submit AI registration speech/text
  const handleAiChatSubmit = async (customText = null) => {
    const textToSend = (customText || aiInputText || '').trim();
    if (!textToSend) return;

    const userMsg = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAiChatMessages(prev => [...prev, userMsg]);
    setAiInputText('');
    setAiInterimTranscript('');
    setIsAiLoading(true);

    let entities = {};
    let intent = null;

    try {
      // Call NLU parser in AI service via backend proxy
      const nluRes = await axios.post('/api/nlp/parse', { text: textToSend });
      if (nluRes.data?.entities) {
        entities = nluRes.data.entities;
        intent = nluRes.data.intent;
      }
    } catch (apiErr) {
      console.warn("Backend NLU parse failed or unavailable, fallback to direct client parsing:", apiErr);
    } finally {
      setIsAiLoading(false);
    }

    const updated = { ...profile };
    const filled = [];
    const lowerText = textToSend.toLowerCase();

    // 1. Step 0: Name extraction
    if (stepIndex === 0 || !entities.name) {
      const cleanName = textToSend
        .replace(/^(मेरा\s*नाम\s*(?:hai|hoon)?|my\s*name\s*is|naam\s*hai|i\s*am|main\s*hoon)\s*/i, '')
        .replace(/\s*(?:hai|hoon|naam)$/i, '')
        .trim();
      
      if (stepIndex === 0 && cleanName.length >= 2 && !cleanName.match(/^(yes|no|haan|nahi|ok|theek|hello|namaste|hi)$/i)) {
        entities.name = cleanName;
      } else if (cleanName.length >= 2 && cleanName.split(' ').length <= 4 && !cleanName.match(/^(yes|no|haan|nahi|ok|hello)$/i)) {
        entities.name = cleanName;
      }
    }

    // 2. Step 1: Location extraction
    if (stepIndex === 1 || !entities.location_hint) {
      const locMatch = textToSend.match(/([a-zA-Z\u0900-\u097F\u0C00-\u0C7F]{3,})\s*(?:village|gaon|se|from|district|zila|mandal)/i);
      if (locMatch) {
        entities.location_hint = locMatch[1].trim();
      } else if (stepIndex === 1 && textToSend.length >= 3 && !textToSend.match(/^(yes|no|haan|nahi|ok|hello)$/i)) {
        entities.location_hint = textToSend.trim();
      }
    }

    // 3. Step 2: Capital extraction
    if (stepIndex === 2 || (entities.capital === null || entities.capital === undefined)) {
      const lakhMatch = textToSend.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|लाख|లక్ష)/i);
      if (lakhMatch) {
        entities.capital = parseFloat(lakhMatch[1]) * 100000;
      } else {
        const numClean = textToSend.replace(/[^\d.]/g, '');
        if (numClean && !isNaN(parseFloat(numClean))) {
          const val = parseFloat(numClean);
          entities.capital = val < 50 ? val * 100000 : val;
        }
      }
    }

    // 4. Step 3: Land Acres extraction
    if (stepIndex === 3 || (entities.land_acres === null || entities.land_acres === undefined)) {
      if (lowerText.includes('zero') || lowerText.includes('nahi') || lowerText.includes('landless') || lowerText.includes('no land')) {
        entities.land_acres = 0;
      } else {
        const acreMatch = textToSend.match(/(\d+(?:\.\d+)?)\s*(?:acre|acres|एकड़|ఎకరాలు)?/i);
        if (acreMatch && !isNaN(parseFloat(acreMatch[1]))) {
          entities.land_acres = parseFloat(acreMatch[1]);
        }
      }
    }

    // 5. Step 4: Social Category extraction
    if (stepIndex === 4 || !entities.social_category) {
      if (lowerText.includes('obc') || textToSend.includes('ओबीसी')) entities.social_category = 'OBC';
      else if (lowerText.includes('sc') || textToSend.includes('अनुसूचित')) entities.social_category = 'SC';
      else if (lowerText.includes('st') || textToSend.includes('जनजाति')) entities.social_category = 'ST';
      else if (lowerText.includes('dnt')) entities.social_category = 'DNT';
      else if (lowerText.includes('gen') || textToSend.includes('सामान्य')) entities.social_category = 'GENERAL';
    }

    // 6. Step 5: Infrastructure & Utilities
    if (lowerText.includes('water') || lowerText.includes('paani') || lowerText.includes('borewell')) {
      entities.has_water_source = true;
    }
    if (lowerText.includes('electric') || lowerText.includes('power') || lowerText.includes('bijli') || lowerText.includes('current')) {
      entities.has_electricity = true;
    }
    if (lowerText.includes('vehicle') || lowerText.includes('tractor') || lowerText.includes('gadi') || lowerText.includes('auto')) {
      entities.has_vehicle = true;
    }
    if (lowerText.includes('shop') || lowerText.includes('dukaan') || lowerText.includes('building') || lowerText.includes('shed')) {
      entities.has_shop_building = true;
    }

    // 7. Step 6: Skills
    const skillList = ['dairy', 'poultry', 'farming', 'agriculture', 'goat_farming', 'machinery', 'food_processing', 'retail', 'mechanic'];
    const detectedSkills = skillList.filter(s => lowerText.includes(s.replace('_', ' ')) || lowerText.includes(s));
    if (detectedSkills.length > 0) {
      entities.skills = Array.from(new Set([...(entities.skills || []), ...detectedSkills]));
    }

    // Apply entities to updated profile
    if (entities.name) {
      updated.name = entities.name;
      filled.push('name');
    }
    if (entities.capital !== null && entities.capital !== undefined) {
      updated.available_capital = entities.capital;
      filled.push('capital');
    }
    if (entities.land_acres !== null && entities.land_acres !== undefined) {
      updated.land_acres = entities.land_acres;
      filled.push('land');
    }
    if (entities.social_category) {
      updated.social_category = entities.social_category;
      filled.push('social_category');
    }
    if (entities.has_water_source !== null && entities.has_water_source !== undefined) {
      updated.has_water_source = entities.has_water_source;
      filled.push('water');
    }
    if (entities.has_electricity !== null && entities.has_electricity !== undefined) {
      updated.has_electricity = entities.has_electricity;
      filled.push('electricity');
    }
    if (entities.has_vehicle !== null && entities.has_vehicle !== undefined) {
      updated.has_vehicle = entities.has_vehicle;
      filled.push('vehicle');
    }
    if (entities.has_shop_building !== null && entities.has_shop_building !== undefined) {
      updated.has_shop_building = entities.has_shop_building;
      filled.push('shop');
    }
    if (entities.skills && entities.skills.length > 0) {
      updated.skills = Array.from(new Set([...(profile.skills || []), ...entities.skills]));
      filled.push('skills');
    }
    if (entities.location_hint) {
      const locCoords = {
        "Nashik": { lat: 20.1706, lon: 73.9840, v: "Pimpalgaon Baswant", d: "Nashik", s: "Maharashtra" },
        "Krishna": { lat: 16.4258, lon: 80.7712, v: "Kankipadu", d: "Krishna", s: "Andhra Pradesh" },
        "Varanasi": { lat: 25.4380, lon: 83.0560, v: "Chaubeypur", d: "Varanasi", s: "Uttar Pradesh" },
        "Anand": { lat: 22.5360, lon: 72.9340, v: "Mogri Rural", d: "Anand", s: "Gujarat" }
      };
      const c = locCoords[entities.location_hint];
      if (c) {
        updated.latitude = c.lat;
        updated.longitude = c.lon;
        updated.village_name = c.v;
        updated.district = c.d;
        updated.state = c.s;
      } else {
        updated.village_name = entities.location_hint;
      }
      filled.push('location');
    }

    setProfile(updated);
    setNewlyFilledFields(prev => [...new Set([...prev, ...filled])]);

    // Handle location query in middle of conversation
    if (intent === 'LOCATION_QUERY') {
      const v = updated.village_name || 'Registered Location';
      const d = updated.district || 'District';
      const locMsg = lang === 'hi'
        ? `आपकी पंजीकृत लोकेशन: **${v}, ${d}** (${updated.latitude?.toFixed(4)}° N, ${updated.longitude?.toFixed(4)}° E) है। आप नीचे दिए बटन से कभी भी लाइव GPS बदल सकते हैं।`
        : `Your current location is **${v}, ${d}** (${updated.latitude?.toFixed(4)}° N, ${updated.longitude?.toFixed(4)}° E).`;
      
      triggerQuestionForStep(stepIndex, updated, locMsg);
      setIsAiLoading(false);
      return;
    }

    // Advance to next step
    if (filled.length > 0) {
      let confirmText = "";
      if (entities.name) {
        confirmText = lang === 'hi'
          ? `✓ नमस्ते ${entities.name} जी! आपका नाम दर्ज हो गया है।`
          : (lang === 'te' ? `✓ నమస్కారం ${entities.name} గారు! మీ పేరు నమోదైంది.` : `✓ Great, ${entities.name}! Your name has been recorded.`);
      } else {
        confirmText = lang === 'hi'
          ? `✓ धन्यवाद! विवरण दर्ज कर लिया गया है: ${filled.map(f => f.toUpperCase()).join(', ')}।`
          : `✓ Recorded: ${filled.map(f => f.toUpperCase()).join(', ')}.`;
      }

      let targetStep = stepIndex + 1;
      if (targetStep >= STEPS.length) targetStep = STEPS.length - 1;

      triggerQuestionForStep(targetStep, updated, confirmText);
    } else {
      const gentleReprompt = lang === 'hi'
        ? "मैंने आपकी बात सुनी। कृपया नीचे दिए गए विकल्पों में से चुनें या स्पष्ट उत्तर दें।"
        : "Understood. Please pick from the options below or specify clearly.";
      triggerQuestionForStep(stepIndex, updated, gentleReprompt);
    }

    setIsAiLoading(false);
  };

  handleAiChatSubmitRef.current = handleAiChatSubmit;

  const toggleAiListening = async () => {
    if (!aiRecognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please type your answer or click the option chips.");
      return;
    }

    // If currently listening, tap again to immediately finish & submit what was said
    if (isAiListening || isAiListeningRef.current) {
      submitSpokenAiAnswer();
      return;
    }

    // Stop speaking bot audio
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsAiSpeaking(false);
    }

    accumulatedAiTranscriptRef.current = '';
    aiInterimTranscriptRef.current = '';
    setAiInterimTranscript('');

    // Pre-prompt microphone permission with getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
      } catch (permErr) {
        if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
          alert("Microphone access is blocked. Please allow mic access in your browser settings.");
          return;
        }
      }
    }

    try {
      aiRecognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : (lang === 'te' ? 'te-IN' : 'en-IN');
      isAiListeningRef.current = true;
      setIsAiListening(true);
      aiRecognitionRef.current.start();

      // Generous 15s max timeout so mic doesn't stay open forever if user walks away
      if (aiMaxSessionTimeoutRef.current) clearTimeout(aiMaxSessionTimeoutRef.current);
      aiMaxSessionTimeoutRef.current = setTimeout(() => {
        if (isAiListeningRef.current) {
          submitSpokenAiAnswer();
        }
      }, 15000);
    } catch (err) {
      if (err.name === 'InvalidStateError') {
        isAiListeningRef.current = true;
        setIsAiListening(true);
      } else {
        isAiListeningRef.current = false;
        setIsAiListening(false);
      }
    }
  };

  // Jump directly to edit a step
  const handleEditStep = (targetIdx) => {
    triggerQuestionForStep(targetIdx, profile, lang === 'hi' ? `आइए ${STEPS[targetIdx].titleHi} को अपडेट करें:` : `Let's update ${STEPS[targetIdx].titleEn}:`);
  };

  // Skill options
  const skillOptions = [
    'farming', 'agriculture', 'dairy', 'poultry',
    'goat_farming', 'machinery', 'food_processing', 'retail', 'mechanic'
  ];

  const toggleSkill = (skill) => {
    const current = profile.skills || [];
    let updatedSkills;
    if (current.includes(skill)) {
      updatedSkills = current.filter((s) => s !== skill);
    } else {
      updatedSkills = [...current, skill];
    }
    setProfile({ ...profile, skills: updatedSkills });
    setNewlyFilledFields(prev => [...new Set([...prev, 'skills'])]);
  };

  // Toggle utility flag
  const toggleUtility = (key) => {
    const updated = { ...profile, [key]: !profile[key] };
    setProfile(updated);
    setNewlyFilledFields(prev => [...new Set([...prev, 'utilities', key])]);
  };

  // Calculate completion percentage
  const totalFields = 7;
  let filledCount = 0;
  if (profile.name && profile.name.trim().length > 1) filledCount++;
  if (profile.available_capital > 0) filledCount++;
  if (profile.land_acres >= 0) filledCount++;
  if (profile.village_name) filledCount++;
  if (profile.skills && profile.skills.length > 0) filledCount++;
  if (profile.social_category) filledCount++;
  if (profile.latitude && profile.longitude) filledCount++;
  const completionPct = Math.min(100, Math.round((filledCount / totalFields) * 100));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Registration Mode Selector Header */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
            National Rural Entrepreneur Registration Studio
          </span>
          <h2 className="text-lg font-black text-slate-900 mt-0.5 flex items-center space-x-2">
            <span>Register Rural Micro-Entrepreneur</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
              AI Powered
            </span>
          </h2>
        </div>

        {/* Dual Mode Switcher Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setRegMode('ai')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${regMode === 'ai'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Bot className="w-4 h-4 text-amber-300" />
            <span>Option 1: Fill Using AI Interview (Guided Voice/Chat)</span>
          </button>

          <button
            onClick={() => setRegMode('manual')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${regMode === 'manual'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Option 2: Self-Fill Form (Manual)</span>
          </button>
        </div>
      </div>

      {/* Profile Saved Toast Notification */}
      {profileSaveNotice && (
        <div className="p-4 bg-emerald-700 text-white text-xs font-bold rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>{t.profileSavedSuccess || 'Profile details (Photo, Gender, Address) updated successfully!'}</span>
          </div>
          <span className="text-[11px] bg-emerald-800/80 px-2.5 py-1 rounded-lg">Synchronized</span>
        </div>
      )}

      {/* Progress & Quick Archetype Presets */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center font-black text-emerald-800 text-sm">
            {completionPct}%
          </div>
          <div>
            <div className="font-bold text-slate-900 flex items-center space-x-2">
              <span>Registration Dossier Completeness</span>
              {completionPct === 100 && (
                <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                  ✓ Ready for Advisory
                </span>
              )}
            </div>
            <div className="w-48 bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none w-full md:w-auto">
          <span className="text-slate-400 font-bold whitespace-nowrap">Load Profile Preset:</span>
          <button
            onClick={() => {
              setProfile(prev => ({
                ...prev,
                name: 'Ramesh Kisan',
                village_name: 'Pimpalgaon Baswant',
                district: 'Nashik',
                state: 'Maharashtra',
                latitude: 20.1706,
                longitude: 73.9840,
                social_category: 'OBC',
                available_capital: 300000,
                land_acres: 2.0,
                skills: ['farming', 'agriculture']
              }));
              setNewlyFilledFields(['name', 'capital', 'land', 'skills', 'location', 'social_category']);
              triggerQuestionForStep(7, profile, lang === 'hi' ? '✓ रमेश किसान का प्रोफ़ाइल लोड कर लिया गया है।' : '✓ Ramesh Kisan profile preset loaded.');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold whitespace-nowrap text-[11px] transition border border-slate-200"
          >
            Ramesh Kisan (₹3.0L • Nashik)
          </button>
          <button
            onClick={() => {
              setProfile(prev => ({
                ...prev,
                name: 'Lakshmi Devi',
                village_name: 'Kankipadu',
                district: 'Krishna',
                state: 'Andhra Pradesh',
                latitude: 16.4258,
                longitude: 80.7712,
                social_category: 'SC',
                available_capital: 200000,
                land_acres: 1.0,
                skills: ['dairy', 'livestock']
              }));
              setNewlyFilledFields(['name', 'capital', 'land', 'skills', 'location', 'social_category']);
              triggerQuestionForStep(7, profile, lang === 'hi' ? '✓ लक्ष्मी देवी का प्रोफ़ाइल लोड कर लिया गया है।' : '✓ Lakshmi Devi profile preset loaded.');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold whitespace-nowrap text-[11px] transition border border-slate-200"
          >
            Lakshmi Devi (₹2.0L • Krishna)
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODE 1: INTERACTIVE AI INTERVIEWER (VOICE / CHAT ASSISTED)   */}
      {/* ------------------------------------------------------------- */}
      {regMode === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: Voice / Chat Interviewer */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[580px]">
            <div className="space-y-4">
              {/* Header with Step Tracker and Voice Guidance Toggle */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold shadow-sm">
                    <Bot className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <span>AI Entrepreneur Interviewer</span>
                      <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                        Step {stepIndex + 1} of 7: {STEPS[stepIndex]?.titleHi || STEPS[stepIndex]?.titleEn}
                      </span>
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      The AI asks every required question — speak, type, or tap options below!
                    </span>
                  </div>
                </div>

                {/* Voice Guidance & Replay Audio Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => speakText(getStepQuestion(stepIndex, profile))}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-xs"
                    title="Replay question voice"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                    <span>{lang === 'hi' ? 'आवाज़ दोबारा सुनें' : 'Replay Voice'}</span>
                  </button>

                  <button
                    onClick={() => {
                      const next = !voiceGuidance;
                      setVoiceGuidance(next);
                      if (next) {
                        speakText(getStepQuestion(stepIndex, profile));
                      } else {
                        window.speechSynthesis?.cancel();
                        setIsAiSpeaking(false);
                      }
                    }}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${voiceGuidance
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    title="Toggle audio voice reading"
                  >
                    {voiceGuidance ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{voiceGuidance ? 'Audio ON' : 'Audio OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Chat Stream with Interactive Action Prompts */}
              <div className="max-h-[380px] overflow-y-auto space-y-3.5 text-xs pr-1">
                {aiChatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[90%] p-3.5 rounded-2xl space-y-2 ${msg.sender === 'user'
                          ? 'bg-emerald-800 text-white rounded-br-none shadow-sm'
                          : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none'
                        }`}
                    >
                      <div className="flex items-center justify-between text-[10px] opacity-70 font-semibold">
                        <span>{msg.sender === 'user' ? 'You' : 'AI Registration Assistant'}</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      <p className="leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>

                      {/* Render Interactive Action Cards for the latest AI question */}
                      {msg.isQuestion && i === aiChatMessages.length - 1 && (
                        <div className="pt-2 border-t border-slate-200/60 mt-2 space-y-2">
                          {/* Step 0: Name Quick Suggestions */}
                          {msg.stepId === 'name' && (
                            <div>
                              <span className="text-[10px] text-slate-500 font-bold block mb-1.5">
                                Suggestions (or speak your name):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {STEPS[0].suggestions.map((name) => (
                                  <button
                                    key={name}
                                    onClick={() => handleChipAnswer('name', name, name)}
                                    className="bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-lg text-xs font-semibold transition shadow-xs"
                                  >
                                    + {name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Step 1: Location & GPS Options */}
                          {msg.stepId === 'location' && (
                            <div className="space-y-2">
                              {/* Prominent GPS Auto-Detect Button */}
                              <button
                                onClick={handleDetectLiveGPS}
                                disabled={isLocating}
                                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md transition"
                              >
                                <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                                <span>{isLocating ? 'Detecting satellite coordinates...' : '📍 Auto-Detect My Device Live GPS'}</span>
                              </button>

                              <span className="text-[10px] text-slate-500 font-bold block">
                                Or select sample rural village cluster:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {STEPS[1].presets.map((preset) => (
                                  <button
                                    key={preset.v}
                                    onClick={() => handleChipAnswer('location_preset', preset, `${preset.v}, ${preset.d}`)}
                                    className="text-left bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 p-2 rounded-xl text-xs font-semibold transition"
                                  >
                                    <div className="font-bold text-slate-900">{preset.v}</div>
                                    <div className="text-[10px] text-slate-500">{preset.d}, {preset.s}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Step 2: Available Capital Chips */}
                          {msg.stepId === 'capital' && (
                            <div>
                              <span className="text-[10px] text-slate-500 font-bold block mb-1.5">
                                Select capital budget (or speak your own amount):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {STEPS[2].options.map((opt) => (
                                  <button
                                    key={opt.value}
                                    onClick={() => handleChipAnswer('available_capital', opt.value, opt.label)}
                                    className="bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Step 3: Land Holding Chips */}
                          {msg.stepId === 'land' && (
                            <div>
                              <span className="text-[10px] text-slate-500 font-bold block mb-1.5">
                                Select available land area:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {STEPS[3].options.map((opt) => (
                                  <button
                                    key={opt.value}
                                    onClick={() => handleChipAnswer('land_acres', opt.value, opt.label)}
                                    className="bg-white hover:bg-emerald-600 hover:text-white text-slate-800 border border-slate-200 hover:border-emerald-500 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-xs"
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Step 4: Social Category Chips */}
                          {msg.stepId === 'social_category' && (
                            <div>
                              <span className="text-[10px] text-slate-500 font-bold block mb-1.5">
                                Select social category for MoSJE concessional financing:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {STEPS[4].options.map((opt) => (
                                  <button
                                    key={opt.value}
                                    onClick={() => handleChipAnswer('social_category', opt.value, opt.label)}
                                    className="text-left bg-white hover:bg-emerald-50 hover:border-emerald-400 border border-slate-200 p-2 rounded-xl text-xs font-semibold text-slate-800 transition"
                                  >
                                    <div className="font-bold text-emerald-800">{opt.value}</div>
                                    <div className="text-[10px] text-slate-500">{opt.label}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Step 5: Utilities Multi-Select */}
                          {msg.stepId === 'utilities' && (
                            <div className="space-y-2">
                              <span className="text-[10px] text-slate-500 font-bold block">
                                Tap to toggle utilities available at your site:
                              </span>
                              <div className="grid grid-cols-2 gap-2">
                                {STEPS[5].items.map((item) => {
                                  const checked = Boolean(profile[item.key]);
                                  return (
                                    <button
                                      key={item.key}
                                      type="button"
                                      onClick={() => toggleUtility(item.key)}
                                      className={`p-2.5 rounded-xl text-left border text-xs font-bold flex items-center justify-between transition ${checked
                                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                      <span>{lang === 'hi' ? item.labelHi : item.labelEn}</span>
                                      {checked ? <Check className="w-3.5 h-3.5 text-white" /> : <span className="w-3 h-3 rounded-full border border-slate-300" />}
                                    </button>
                                  );
                                })}
                              </div>
                              <button
                                onClick={() => advanceToNextStep(profile, 5, lang === 'hi' ? '✓ सुविधाएँ दर्ज कर ली गईं।' : '✓ Site utilities recorded.')}
                                className="w-full flex items-center justify-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white py-2 rounded-xl text-xs font-bold transition mt-2"
                              >
                                <span>Continue to Skills Step</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Step 6: Skills Multi-Select */}
                          {msg.stepId === 'skills' && (
                            <div className="space-y-2">
                              <span className="text-[10px] text-slate-500 font-bold block">
                                Tap skills you have experience in:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {STEPS[6].items.map((item) => {
                                  const active = (profile.skills || []).includes(item.key);
                                  return (
                                    <button
                                      key={item.key}
                                      type="button"
                                      onClick={() => toggleSkill(item.key)}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${active
                                          ? 'bg-emerald-600 text-white shadow-sm'
                                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                      {active ? `✓ ${item.label}` : `+ ${item.label}`}
                                    </button>
                                  );
                                })}
                              </div>
                              <button
                                onClick={() => advanceToNextStep(profile, 6, lang === 'hi' ? '✓ अनुभव व कौशल दर्ज कर लिए गए।' : '✓ Skills recorded.')}
                                className="w-full flex items-center justify-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white py-2 rounded-xl text-xs font-bold transition mt-2"
                              >
                                <span>Complete All Steps & Review Dossier</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Step 7: Review & Final Submit Action */}
                          {msg.stepId === 'review' && (
                            <div className="pt-2">
                              <button
                                onClick={onRunAdvisory}
                                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white py-3 px-4 rounded-xl text-xs font-extrabold shadow-lg transition transform hover:-translate-y-0.5"
                              >
                                <FileCheck2 className="w-4 h-4 text-amber-300" />
                                <span>🚀 Complete Registration & Open Decision Advisory</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isAiLoading && (
                  <div className="text-xs text-slate-500 flex items-center space-x-2 p-2 bg-slate-50 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span>Extracting parameters and updating dossier...</span>
                  </div>
                )}
                <div ref={aiMessagesEndRef} />
              </div>
            </div>

            {/* Bottom Input: Microphone (STT) + Free-form text */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              {isAiSpeaking && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-2 rounded-xl text-xs flex items-center justify-between font-bold animate-pulse">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="w-4 h-4 text-emerald-600 animate-bounce" />
                    <span>🔊 AI बोल रहा है... सुनिए (AI is Speaking Question...)</span>
                  </div>
                  <button
                    onClick={() => {
                      window.speechSynthesis?.cancel();
                      setIsAiSpeaking(false);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 underline font-normal"
                  >
                    Skip Audio
                  </button>
                </div>
              )}

              {isAiListening && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2 rounded-xl text-xs flex items-center justify-between font-bold animate-pulse">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                    <span>
                      {aiInterimTranscript
                        ? `🎙️ "${aiInterimTranscript}"`
                        : "🎙️ Listening... Speak your answer naturally in Hindi, English, or Telugu"}
                    </span>
                  </div>
                  <button onClick={toggleAiListening} className="text-xs underline ml-2 shrink-0">Finish & Submit</button>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleAiListening}
                  className={`p-3 rounded-xl transition shadow-xs ${isAiListening
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  title="Speak to answer current question"
                >
                  {isAiListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-700" />}
                </button>

                <input
                  type="text"
                  value={aiInputText}
                  onChange={(e) => setAiInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiChatSubmit()}
                  placeholder={
                    stepIndex === 0 ? "Type your name or say 'Mera naam ...'" :
                      stepIndex === 1 ? "Type village name or say 'Nashik se hoon'..." :
                        stepIndex === 2 ? "Type capital e.g. 200000 or say '3 lakh'..." :
                          stepIndex === 3 ? "Type land acres e.g. 2 or say '2 acre'..." :
                            stepIndex === 4 ? "Type OBC, SC, ST, or General..." :
                              "Speak or type your answer..."
                  }
                  className="flex-1 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />

                <button
                  onClick={() => handleAiChatSubmit()}
                  disabled={!aiInputText.trim() || isAiLoading}
                  className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white p-3 rounded-xl font-bold transition shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: LIVE AUTO-FILLING REGISTRATION DOSSIER (Real-Time Synchronized) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-sm font-bold text-white">
                    Live Auto-Filling Registration Dossier
                  </h3>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold border border-emerald-400/30">
                  {completionPct}% Complete
                </span>
              </div>

              {/* Entrepreneur Photo & Identity Summary */}
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="relative shrink-0">
                  {profile.photo ? (
                    <img
                      src={profile.photo}
                      alt="Profile"
                      className="w-11 h-11 rounded-xl object-cover border border-emerald-400/40"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-emerald-800/60 text-amber-300 flex items-center justify-center font-bold text-xs">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-xs font-bold text-white truncate">{profile.name || 'Entrepreneur'}</p>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold border border-emerald-400/30">
                      {profile.gender || 'MALE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {profile.address ? `${profile.address}, ${profile.state || ''}` : `${profile.village_name || ''}, ${profile.state || ''}`}
                  </p>
                </div>
                <button
                  onClick={() => setRegMode('manual')}
                  className="text-amber-400 hover:text-amber-300 text-[10px] font-bold underline shrink-0"
                >
                  Edit Details
                </button>
              </div>

              {/* Form Parameter Checkpoints with Direct Edit Triggers */}
              <div className="space-y-2.5 text-xs">
                {/* 1. Name */}
                <div className={`p-3 rounded-xl border transition-all ${stepIndex === 0 ? 'border-amber-400 bg-amber-950/20 ring-2 ring-amber-400/40' :
                    newlyFilledFields.includes('name') ? 'bg-emerald-900/60 border-emerald-400 ring-1 ring-emerald-400/30' : 'bg-white/5 border-white/10'
                  }`}>
                  <div className="flex justify-between items-center text-slate-400 text-[11px] mb-0.5">
                    <span className="font-semibold">1. Entrepreneur Name:</span>
                    <div className="flex items-center space-x-1.5">
                      {profile.name && <span className="text-emerald-400 font-bold">✓ Captured</span>}
                      <button onClick={() => handleEditStep(0)} className="text-slate-400 hover:text-white text-[10px] underline">Edit</button>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-white">
                    {profile.name || <span className="text-slate-500 italic">Awaiting answer...</span>}
                  </div>
                </div>

                {/* 2. Location */}
                <div className={`p-3 rounded-xl border transition-all ${stepIndex === 1 ? 'border-amber-400 bg-amber-950/20 ring-2 ring-amber-400/40' :
                    newlyFilledFields.includes('location') ? 'bg-emerald-900/60 border-emerald-400 ring-1 ring-emerald-400/30' : 'bg-white/5 border-white/10'
                  }`}>
                  <div className="flex justify-between items-center text-slate-400 text-[11px] mb-0.5">
                    <span className="font-semibold">2. Village & GPS:</span>
                    <div className="flex items-center space-x-1.5">
                      {profile.village_name && <span className="text-emerald-400 font-bold">✓ Locked</span>}
                      <button onClick={() => handleEditStep(1)} className="text-slate-400 hover:text-white text-[10px] underline">Edit</button>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-white">
                    {profile.village_name ? `${profile.village_name}, ${profile.district || ''} (${profile.latitude?.toFixed(2)}°N, ${profile.longitude?.toFixed(2)}°E)` : <span className="text-slate-500 italic">Awaiting answer...</span>}
                  </div>
                </div>

                {/* 2b. Address, PIN, Post, Police Station */}
                <div className="p-3 rounded-xl border bg-white/5 border-white/10">
                  <div className="flex justify-between items-center text-slate-400 text-[11px] mb-0.5">
                    <span className="font-semibold">Permanent Address Details:</span>
                    <button onClick={() => setRegMode('manual')} className="text-slate-400 hover:text-white text-[10px] underline">Edit</button>
                  </div>
                  <div className="text-xs text-white space-y-0.5">
                    <p className="font-semibold">{profile.address || <span className="text-slate-500 italic">Address line not set</span>}</p>
                    <p className="text-[11px] text-slate-300">
                      PIN: <span className="text-amber-300 font-bold">{profile.pincode || '—'}</span> • Post: <span className="text-emerald-300 font-bold">{profile.post || '—'}</span>
                    </p>
                    <p className="text-[11px] text-slate-300">
                      Police Station: <span className="text-slate-200 font-medium">{profile.police_station || '—'}</span> • State: <span className="text-slate-200 font-medium">{profile.state || '—'}</span>
                    </p>
                  </div>
                </div>

                {/* 3. Capital */}
                <div className={`p-3 rounded-xl border transition-all ${stepIndex === 2 ? 'border-amber-400 bg-amber-950/20 ring-2 ring-amber-400/40' :
                    newlyFilledFields.includes('capital') ? 'bg-emerald-900/60 border-emerald-400 ring-1 ring-emerald-400/30' : 'bg-white/5 border-white/10'
                  }`}>
                  <div className="flex justify-between items-center text-slate-400 text-[11px] mb-0.5">
                    <span className="font-semibold">3. Available Capital:</span>
                    <div className="flex items-center space-x-1.5">
                      {profile.available_capital > 0 && <span className="text-emerald-400 font-bold">✓ Captured</span>}
                      <button onClick={() => handleEditStep(2)} className="text-slate-400 hover:text-white text-[10px] underline">Edit</button>
                    </div>
                  </div>
                  <div className="text-sm font-extrabold text-amber-300">
                    ₹{(profile.available_capital || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                {/* 4. Land */}
                <div className={`p-3 rounded-xl border transition-all ${stepIndex === 3 ? 'border-amber-400 bg-amber-950/20 ring-2 ring-amber-400/40' :
                    newlyFilledFields.includes('land') ? 'bg-emerald-900/60 border-emerald-400 ring-1 ring-emerald-400/30' : 'bg-white/5 border-white/10'
                  }`}>
                  <div className="flex justify-between items-center text-slate-400 text-[11px] mb-0.5">
                    <span className="font-semibold">4. Land Holding:</span>
                    <div className="flex items-center space-x-1.5">
                      {profile.land_acres !== undefined && <span className="text-emerald-400 font-bold">✓ Captured</span>}
                      <button onClick={() => handleEditStep(3)} className="text-slate-400 hover:text-white text-[10px] underline">Edit</button>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-white">
                    {profile.land_acres ?? 0} Acres
                  </div>
                </div>

                {/* 5. Social Category */}
                <div className={`p-3 rounded-xl border transition-all ${stepIndex === 4 ? 'border-amber-400 bg-amber-950/20 ring-2 ring-amber-400/40' :
                    newlyFilledFields.includes('social_category') ? 'bg-emerald-900/60 border-emerald-400 ring-1 ring-emerald-400/30' : 'bg-white/5 border-white/10'
                  }`}>
                  <div className="flex justify-between items-center text-slate-400 text-[11px] mb-0.5">
                    <span className="font-semibold">5. Social Category (MoSJE):</span>
                    <div className="flex items-center space-x-1.5">
                      {profile.social_category && <span className="text-emerald-400 font-bold">✓ Captured</span>}
                      <button onClick={() => handleEditStep(4)} className="text-slate-400 hover:text-white text-[10px] underline">Edit</button>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-white">
                    {profile.social_category || <span className="text-slate-500 italic">Awaiting answer...</span>}
                  </div>
                </div>

                {/* 6. Utilities */}
                <div className={`p-3 rounded-xl border transition-all ${stepIndex === 5 ? 'border-amber-400 bg-amber-950/20 ring-2 ring-amber-400/40' : 'bg-white/5 border-white/10'
                  }`}>
                  <div className="flex justify-between items-center text-slate-400 text-[11px] mb-0.5">
                    <span className="font-semibold">6. Site Infrastructure:</span>
                    <button onClick={() => handleEditStep(5)} className="text-slate-400 hover:text-white text-[10px] underline">Edit</button>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {profile.has_water_source && <span className="bg-emerald-800/80 text-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">💧 Water</span>}
                    {profile.has_electricity && <span className="bg-emerald-800/80 text-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">⚡ 3-Phase Power</span>}
                    {profile.has_vehicle && <span className="bg-emerald-800/80 text-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">🚛 Vehicle</span>}
                    {profile.has_shop_building && <span className="bg-emerald-800/80 text-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">🏪 Shop/Shed</span>}
                    {!profile.has_water_source && !profile.has_electricity && !profile.has_vehicle && !profile.has_shop_building && (
                      <span className="text-slate-400 text-[11px]">Basic / Land only</span>
                    )}
                  </div>
                </div>

                {/* 7. Skills */}
                <div className={`p-3 rounded-xl border transition-all ${stepIndex === 6 ? 'border-amber-400 bg-amber-950/20 ring-2 ring-amber-400/40' :
                    newlyFilledFields.includes('skills') ? 'bg-emerald-900/60 border-emerald-400 ring-1 ring-emerald-400/30' : 'bg-white/5 border-white/10'
                  }`}>
                  <div className="flex justify-between items-center text-slate-400 text-[11px] mb-0.5">
                    <span className="font-semibold">7. Skills & Experience:</span>
                    <div className="flex items-center space-x-1.5">
                      {profile.skills?.length > 0 && <span className="text-emerald-400 font-bold">✓ Captured</span>}
                      <button onClick={() => handleEditStep(6)} className="text-slate-400 hover:text-white text-[10px] underline">Edit</button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(profile.skills || []).map((s, idx) => (
                      <span key={idx} className="bg-white/10 text-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold capitalize">
                        {s.replace('_', ' ')}
                      </span>
                    ))}
                    {(!profile.skills || profile.skills.length === 0) && (
                      <span className="text-slate-500 italic text-[11px]">Awaiting selection...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Complete & Run Decision Advisory CTA */}
            <div className="pt-4 mt-4 border-t border-white/10">
              <button
                onClick={onRunAdvisory}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black py-3.5 rounded-xl text-xs shadow-lg transition"
              >
                <span>Save Dossier & Calculate Business Advisory</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODE 2: SELF-REGISTRATION (MANUAL FORM)                      */}
      {/* ------------------------------------------------------------- */}
      {regMode === 'manual' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          {/* AI Banner for quick switch */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <Bot className="w-5 h-5 text-emerald-700 flex-shrink-0" />
              <span className="text-slate-700 font-medium">
                <strong>Prefer voice or chat assistance?</strong> The AI assistant can ask you each question step-by-step and auto-fill your entire registration dossier!
              </span>
            </div>
            <button
              onClick={() => setRegMode('ai')}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition"
            >
              Switch to AI Interview
            </button>
          </div>

          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-emerald-600" />
                Step 1: Entrepreneur Identity & Physical Location
              </h3>
              <p className="text-xs text-slate-500">
                Fill out the registration details directly or use the live GPS button to capture your device location.
              </p>
            </div>

            {/* Live GPS Button */}
            <button
              onClick={handleDetectLiveGPS}
              disabled={isLocating}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition"
            >
              <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Detecting GPS...' : '📍 Auto-Detect Live GPS Coordinates'}</span>
            </button>
          </div>

          {/* A. Profile Photo & Gender Identity Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border border-emerald-200/80 flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center space-x-4">
              <div className="relative shrink-0">
                {profile.photo ? (
                  <img
                    src={profile.photo}
                    alt="Entrepreneur Profile"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-[#0F3D2E] shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-[#0F3D2E] text-amber-300 flex flex-col items-center justify-center font-bold text-xs shadow-md">
                    <User className="w-8 h-8 mb-1 opacity-80" />
                    <span className="text-[10px]">No Photo</span>
                  </div>
                )}
                <input
                  type="file"
                  ref={photoInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                  <span>{t.photoLabel || 'Profile Photo'}</span>
                  <span className="text-[10px] bg-emerald-100 text-[#0F3D2E] px-2 py-0.5 rounded-full font-bold">
                    Official Avatar
                  </span>
                </h4>
                <p className="text-xs text-slate-500">
                  Upload an official photo or avatar for your enterprise identity (PNG/JPG up to 5MB).
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="flex items-center space-x-1.5 bg-[#0F3D2E] hover:bg-[#165440] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition shadow-xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{profile.photo ? 'Change Photo' : (t.uploadPhoto || 'Upload Photo')}</span>
                  </button>

                  {profile.photo && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="flex items-center space-x-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.removePhoto || 'Remove'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Gender Selection */}
            <div className="w-full md:w-56 bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs">
              <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                {t.genderLabel || 'Gender'} *
              </label>
              <select
                value={profile.gender || 'MALE'}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="MALE">{t.genderMale || 'Male (पुरुष)'}</option>
                <option value="FEMALE">{t.genderFemale || 'Female (महिला)'}</option>
                <option value="OTHER">{t.genderOther || 'Other (अन्य)'}</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Required for MoSJE scheme gender concession matches.
              </span>
            </div>
          </div>

          {/* B. Complete Address Details Card */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-stone-200">
              <Home className="w-4 h-4 text-[#0F3D2E]" />
              <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider">
                Permanent & Enterprise Address Details
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Full Address */}
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1.5">
                  {t.addressLabel || 'Street Address / House No. / Locality'} *
                </label>
                <input
                  type="text"
                  value={profile.address || ''}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="e.g. House No. 42, Main Bazar Road"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                />
              </div>

              {/* State */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  {t.stateLabel || 'State'} *
                </label>
                <input
                  type="text"
                  value={profile.state || ''}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  placeholder="e.g. Andhra Pradesh, Maharashtra"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                />
              </div>

              {/* PIN Code */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  {t.pincodeLabel || 'PIN Code'} *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={profile.pincode || ''}
                  onChange={(e) => setProfile({ ...profile, pincode: e.target.value.replace(/\D/g, '') })}
                  placeholder="6-digit PIN code (e.g. 522213)"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
              </div>

              {/* Post Office */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  {t.postOfficeLabel || 'Post Office (Post)'} *
                </label>
                <input
                  type="text"
                  value={profile.post || ''}
                  onChange={(e) => setProfile({ ...profile, post: e.target.value })}
                  placeholder="e.g. Chebrole S.O."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                />
              </div>

              {/* Police Station */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  {t.policeStationLabel || 'Police Station (PS)'} *
                </label>
                <input
                  type="text"
                  value={profile.police_station || ''}
                  onChange={(e) => setProfile({ ...profile, police_station: e.target.value })}
                  placeholder="e.g. Chebrole Police Station"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Farmer / Entrepreneur Full Name *</label>
              <input
                type="text"
                value={profile.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="e.g. Ramesh Kisan"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Mobile Contact Number</label>
              <input
                type="text"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Social Category (MoSJE Scheme Rule Match) *</label>
              <select
                value={profile.social_category || 'OBC'}
                onChange={(e) => setProfile({ ...profile, social_category: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="OBC">OBC (Other Backward Classes - NBCFDC)</option>
                <option value="SC">SC (Scheduled Caste - NSFDC)</option>
                <option value="DNT">DNT (De-notified Tribes)</option>
                <option value="GENERAL">General Category</option>
                <option value="ST">ST (Scheduled Tribe)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Village / Locality *</label>
              <input
                type="text"
                value={profile.village_name || ''}
                onChange={(e) => setProfile({ ...profile, village_name: e.target.value })}
                placeholder="e.g. Pimpalgaon Baswant"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">District *</label>
              <input
                type="text"
                value={profile.district || ''}
                onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                placeholder="e.g. Nashik"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">State *</label>
              <input
                type="text"
                value={profile.state || ''}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                placeholder="e.g. Maharashtra"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">GPS Latitude (° N)</label>
              <input
                type="number"
                step="0.0001"
                value={profile.latitude || 20.1706}
                onChange={(e) => setProfile({ ...profile, latitude: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">GPS Longitude (° E)</label>
              <input
                type="number"
                step="0.0001"
                value={profile.longitude || 73.9840}
                onChange={(e) => setProfile({ ...profile, longitude: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Analysis Radius Catchment (GIS)</label>
              <select
                value={profile.analysis_radius_km || 10.0}
                onChange={(e) => setProfile({ ...profile, analysis_radius_km: parseFloat(e.target.value) })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="5.0">5 km (Immediate Village Clusters)</option>
                <option value="10.0">10 km (Standard Block & Mandi Reach)</option>
                <option value="15.0">15 km (Extended Sub-District Reach)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center">
              <Coins className="w-5 h-5 mr-2 text-emerald-600" />
              Step 2: Financial Capital & Land Holding
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Available Liquid Capital (₹) *</label>
                <input
                  type="number"
                  step="10000"
                  value={profile.available_capital || 300000}
                  onChange={(e) => setProfile({ ...profile, available_capital: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-black text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Emergency Liquid Reserve (₹)</label>
                <input
                  type="number"
                  step="5000"
                  value={profile.liquid_reserve || 20000}
                  onChange={(e) => setProfile({ ...profile, liquid_reserve: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Available Land Area (Acres) *</label>
                <input
                  type="number"
                  step="0.25"
                  value={profile.land_acres ?? 1.0}
                  onChange={(e) => setProfile({ ...profile, land_acres: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center">
              <Tractor className="w-5 h-5 mr-2 text-emerald-600" />
              Step 3: Farm Infrastructure & Core Skills
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <label className="flex items-center space-x-2.5 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  checked={Boolean(profile.has_water_source)}
                  onChange={(e) => setProfile({ ...profile, has_water_source: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-bold text-slate-800">💧 Water / Borewell</span>
              </label>
              <label className="flex items-center space-x-2.5 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  checked={Boolean(profile.has_electricity)}
                  onChange={(e) => setProfile({ ...profile, has_electricity: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-bold text-slate-800">⚡ 3-Phase Power</span>
              </label>
              <label className="flex items-center space-x-2.5 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  checked={Boolean(profile.has_vehicle)}
                  onChange={(e) => setProfile({ ...profile, has_vehicle: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-bold text-slate-800">🚛 Commercial Vehicle</span>
              </label>
              <label className="flex items-center space-x-2.5 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  checked={Boolean(profile.has_shop_building)}
                  onChange={(e) => setProfile({ ...profile, has_shop_building: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-bold text-slate-800">🏪 Roadside Shed / Shop</span>
              </label>
            </div>

            {/* Skills Pills */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">Select Skills & Background Experience:</label>
              <div className="flex flex-wrap gap-2">
                {skillOptions.map((s) => {
                  const active = (profile.skills || []).includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSkill(s)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition ${active
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                      {active ? `✓ ${s.replace('_', ' ')}` : `+ ${s.replace('_', ' ')}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleSaveProfileDirect}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-700 px-6 py-3.5 rounded-xl font-black text-sm shadow-xs transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{t.saveProfileChanges || 'Save Profile Details'}</span>
            </button>

            <button
              onClick={onRunAdvisory}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white px-8 py-3.5 rounded-xl font-black text-sm shadow-md transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <FileCheck2 className="w-5 h-5" />
              <span>Complete Registration & Generate Dossier</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
