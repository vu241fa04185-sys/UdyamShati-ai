/**
 * UdyamSarthi AI Voice Engine
 * 
 * Provides natural Indian female AI voice selection for SpeechSynthesis
 * across all modern browsers (Chrome, Edge, Firefox, Safari, Android, Windows).
 * 
 * Target Persona:
 * - Natural Indian Female Voice
 * - Friendly, warm, professional, clear, helpful
 * - Paced for conversational clarity (pitch: ~1.08-1.12, rate: ~0.94)
 */

// Well-known natural female Indian / Asian neural voices
const FEMALE_INDIAN_VOICE_NAMES = [
  // Microsoft Natural Neural Female Voices (Edge & Windows 11)
  'swara',     // Microsoft Swara Online (Natural) - Hindi (India)
  'heera',     // Microsoft Heera Online (Natural) - Hindi / English (India)
  'neerja',    // Microsoft Neerja Online (Natural) - English (India)
  'shruti',    // Microsoft Shruti Online (Natural) - Telugu (India)
  'chitra',    // Microsoft Chitra - Telugu (India)
  'kalpana',   // Microsoft Kalpana - Hindi (India)
  'aditi',     // Aditi - Hindi / Indian English
  'priya',     // Priya - English (India)
  'kavya',     // Kavya
  'sunita',    // Sunita
  'sheetal',   // Sheetal
  'pallavi',   // Pallavi
  'geeta',     // Geeta
  'leela',     // Leela
  'ananya',    // Ananya
  'radha',     // Radha
  'veena'      // Veena - English (India)
];

// Well-known general female voices for fallback
const GENERAL_FEMALE_VOICE_NAMES = [
  'zira',      // Microsoft Zira - English (US) Female
  'samantha',  // Apple Samantha Female
  'victoria',  // Apple Victoria Female
  'karen',     // Apple Karen
  'female',    // Any voice with 'female' in name
  'woman'
];

// Names of known male voices to explicitly avoid
const MALE_VOICE_NAMES = [
  'ravi',
  'david',
  'mark',
  'george',
  'guy',
  'stefan',
  'pablo',
  'james',
  'john',
  'paul',
  'richard',
  'male',
  'man'
];

/**
 * Clean markdown and technical symbols from text for smooth natural speech
 */
export function cleanSpeechText(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/•\s+/g, ', ')
    .replace(/[`_~|]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/₹\s*(\d+(?:,\d+)*)/g, 'Rs. $1')
    .replace(/\n+/g, ' ')
    .trim();
}

/**
 * Find the most natural female voice for the given language
 */
export function getBestFemaleVoice(synth, langCode = 'hi-IN') {
  if (!synth || typeof synth.getVoices !== 'function') return null;

  const voices = synth.getVoices();
  if (!voices || voices.length === 0) return null;

  const code = (langCode || 'hi-IN').toLowerCase();
  const prefix = code.slice(0, 2); // 'hi', 'te', 'en'

  const isMale = (name) => {
    const n = name.toLowerCase();
    return MALE_VOICE_NAMES.some(m => n.includes(m));
  };

  const isIndianFemale = (name) => {
    const n = name.toLowerCase();
    return FEMALE_INDIAN_VOICE_NAMES.some(f => n.includes(f));
  };

  const isGeneralFemale = (name) => {
    const n = name.toLowerCase();
    return GENERAL_FEMALE_VOICE_NAMES.some(f => n.includes(f)) || isIndianFemale(name);
  };

  // 1. Language matches AND Indian female name (e.g. Swara, Heera, Shruti, Neerja)
  let candidate = voices.find(v => {
    const vLang = v.lang.toLowerCase();
    const langMatch = vLang === code || vLang.startsWith(prefix);
    return langMatch && isIndianFemale(v.name);
  });
  if (candidate) return candidate;

  // 2. Google's native voices in that language (Google Hindi/Telugu voices are predominantly female)
  candidate = voices.find(v => {
    const vLang = v.lang.toLowerCase();
    const langMatch = vLang === code || vLang.startsWith(prefix);
    return langMatch && /google/i.test(v.name) && !isMale(v.name);
  });
  if (candidate) return candidate;

  // 3. Language matches AND explicitly contains 'female'
  candidate = voices.find(v => {
    const vLang = v.lang.toLowerCase();
    const langMatch = vLang === code || vLang.startsWith(prefix);
    return langMatch && /female/i.test(v.name);
  });
  if (candidate) return candidate;

  // 4. Language matches AND is NOT a known male voice
  candidate = voices.find(v => {
    const vLang = v.lang.toLowerCase();
    const langMatch = vLang === code || vLang.startsWith(prefix);
    return langMatch && !isMale(v.name);
  });
  if (candidate) return candidate;

  // 5. Any Indian female voice (e.g. Neerja / Swara even if lang is en or hi)
  candidate = voices.find(v => isIndianFemale(v.name));
  if (candidate) return candidate;

  // 6. Any general female voice (e.g. Zira, Samantha)
  candidate = voices.find(v => isGeneralFemale(v.name));
  if (candidate) return candidate;

  // 7. Any voice that is not explicitly male
  candidate = voices.find(v => !isMale(v.name));
  if (candidate) return candidate;

  // Fallback to first voice
  return voices[0] || null;
}

/**
 * Configure an utterance with warm, natural female speech settings
 */
export function configureFemaleUtterance(utterance, synth, langCode = 'hi-IN') {
  if (!utterance) return;

  const femaleVoice = getBestFemaleVoice(synth, langCode);
  if (femaleVoice) {
    utterance.voice = femaleVoice;
  }

  // Warm, clear female tone
  utterance.pitch = 1.1; // Gentle feminine pitch (natural, not squeaky)
  utterance.rate = 0.94;  // Relaxed, conversational pace ideal for rural advisors
}
