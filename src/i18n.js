import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';

export const LANGUAGES = [
  { code: 'hi', english: 'Hindi', native: 'हिन्दी', direction: 'ltr' },
  { code: 'en', english: 'English', native: 'English', direction: 'ltr' },
  { code: 'as', english: 'Assamese', native: 'অসমীয়া', direction: 'ltr' },
  { code: 'bn', english: 'Bengali', native: 'বাংলা', direction: 'ltr' },
  { code: 'brx', english: 'Bodo', native: 'बड़ो', direction: 'ltr' },
  { code: 'doi', english: 'Dogri', native: 'डोगरी', direction: 'ltr' },
  { code: 'gu', english: 'Gujarati', native: 'ગુજરાતી', direction: 'ltr' },
  { code: 'kn', english: 'Kannada', native: 'ಕನ್ನಡ', direction: 'ltr' },
  { code: 'ks', english: 'Kashmiri', native: 'कश्मीरी', direction: 'rtl' },
  { code: 'kok', english: 'Konkani', native: 'कोंकणी', direction: 'ltr' },
  { code: 'mai', english: 'Maithili', native: 'मैथिली', direction: 'ltr' },
  { code: 'ml', english: 'Malayalam', native: 'മലയാളം', direction: 'ltr' },
  { code: 'mni', english: 'Manipuri', native: 'মৈতৈলোন্ / মণিপুরী', direction: 'ltr' },
  { code: 'mr', english: 'Marathi', native: 'मराठी', direction: 'ltr' },
  { code: 'ne', english: 'Nepali', native: 'नेपाली', direction: 'ltr' },
  { code: 'or', english: 'Odia', native: 'ଓଡ଼ିଆ', direction: 'ltr' },
  { code: 'pa', english: 'Punjabi', native: 'ਪੰਜਾਬੀ', direction: 'ltr' },
  { code: 'sa', english: 'Sanskrit', native: 'संस्कृतम्', direction: 'ltr' },
  { code: 'sat', english: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ', direction: 'ltr' },
  { code: 'sd', english: 'Sindhi', native: 'سنڌي', direction: 'rtl' },
  { code: 'ta', english: 'Tamil', native: 'தமிழ்', direction: 'ltr' },
  { code: 'te', english: 'Telugu', native: 'తెలుగు', direction: 'ltr' },
  { code: 'ur', english: 'Urdu', native: 'اردو', direction: 'rtl' }
];

const translations = {
  en: {
    language: 'Language', searchLanguage: 'Search language…', close: 'Close',
    home: 'Home', tokens: 'Tokens', doctors: 'Doctors Available',
    hospitalAvailability: 'Hospital Availability', ayushman: 'Ayushman', records: 'Records',
    medicines: 'Medicines', askAAS: 'Ask AAS', notifications: 'Notifications',
    yourData: 'Your data', profile: 'Profile', yourHealth: 'YOUR HEALTH', more: 'MORE',
    needHelp: 'Need help?', askAnytime: 'Ask AAS anytime', overview: 'Overview',
    mobileNumber: 'Mobile Number', continue: 'Continue', changeLanguage: 'Change language',
    selectLanguage: 'Select your language', mobilePlaceholder: '10-digit mobile number',
    demoOtpHint: "We'll send a demo OTP to this number.", verifyLogin: 'Verify & Login',
    changeNumber: 'Change number', demoSafety: 'Demo prototype · fictional data only'
  },
  hi: {
    language: 'भाषा', searchLanguage: 'भाषा खोजें…', close: 'बंद करें', home: 'होम',
    tokens: 'टोकन', doctors: 'उपलब्ध डॉक्टर', hospitalAvailability: 'अस्पताल उपलब्धता',
    ayushman: 'आयुष्मान', records: 'स्वास्थ्य रिकॉर्ड', medicines: 'दवाइयाँ', askAAS: 'AAS से पूछें',
    notifications: 'सूचनाएँ', yourData: 'आपका डेटा', profile: 'प्रोफ़ाइल', yourHealth: 'आपका स्वास्थ्य',
    more: 'अन्य', needHelp: 'मदद चाहिए?', askAnytime: 'कभी भी AAS से पूछें', overview: 'सारांश',
    mobileNumber: 'मोबाइल नंबर', continue: 'जारी रखें', changeLanguage: 'भाषा बदलें', selectLanguage: 'अपनी भाषा चुनें',
    mobilePlaceholder: '10 अंकों का मोबाइल नंबर', demoOtpHint: 'इस नंबर पर डेमो OTP भेजा जाएगा।', verifyLogin: 'सत्यापित करें और लॉग इन करें',
    changeNumber: 'नंबर बदलें', demoSafety: 'डेमो प्रोटोटाइप · केवल काल्पनिक डेटा'
  },
  bn: { language: 'ভাষা', searchLanguage: 'ভাষা খুঁজুন…', home: 'হোম', tokens: 'টোকেন', doctors: 'উপলব্ধ ডাক্তার', notifications: 'বিজ্ঞপ্তি', profile: 'প্রোফাইল', selectLanguage: 'আপনার ভাষা নির্বাচন করুন' },
  gu: { language: 'ભાષા', searchLanguage: 'ભાષા શોધો…', home: 'હોમ', tokens: 'ટોકન', doctors: 'ઉપલબ્ધ ડૉક્ટરો', notifications: 'સૂચનાઓ', profile: 'પ્રોફાઇલ', selectLanguage: 'તમારી ભાષા પસંદ કરો' },
  mr: { language: 'भाषा', searchLanguage: 'भाषा शोधा…', home: 'मुख्यपृष्ठ', tokens: 'टोकन', doctors: 'उपलब्ध डॉक्टर', notifications: 'सूचना', profile: 'प्रोफाइल', selectLanguage: 'तुमची भाषा निवडा' },
  ta: { language: 'மொழி', searchLanguage: 'மொழியைத் தேடுங்கள்…', home: 'முகப்பு', tokens: 'டோக்கன்கள்', doctors: 'கிடைக்கும் மருத்துவர்கள்', notifications: 'அறிவிப்புகள்', profile: 'சுயவிவரம்', selectLanguage: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்' },
  te: { language: 'భాష', searchLanguage: 'భాషను వెతకండి…', home: 'హోమ్', tokens: 'టోకెన్లు', doctors: 'అందుబాటులో ఉన్న వైద్యులు', notifications: 'నోటిఫికేషన్లు', profile: 'ప్రొఫైల్', selectLanguage: 'మీ భాషను ఎంచుకోండి' },
  kn: { language: 'ಭಾಷೆ', searchLanguage: 'ಭಾಷೆಯನ್ನು ಹುಡುಕಿ…', home: 'ಮುಖಪುಟ', tokens: 'ಟೋಕನ್‌ಗಳು', doctors: 'ಲಭ್ಯವಿರುವ ವೈದ್ಯರು', notifications: 'ಅಧಿಸೂಚನೆಗಳು', profile: 'ಪ್ರೊಫೈಲ್', selectLanguage: 'ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ' },
  ml: { language: 'ഭാഷ', searchLanguage: 'ഭാഷ തിരയുക…', home: 'ഹോം', tokens: 'ടോക്കണുകൾ', doctors: 'ലഭ്യമായ ഡോക്ടർമാർ', notifications: 'അറിയിപ്പുകൾ', profile: 'പ്രൊഫൈൽ', selectLanguage: 'നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക' },
  pa: { language: 'ਭਾਸ਼ਾ', searchLanguage: 'ਭਾਸ਼ਾ ਖੋਜੋ…', home: 'ਹੋਮ', tokens: 'ਟੋਕਨ', doctors: 'ਉਪਲਬਧ ਡਾਕਟਰ', notifications: 'ਸੂਚਨਾਵਾਂ', profile: 'ਪ੍ਰੋਫ਼ਾਈਲ', selectLanguage: 'ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ' },
  ur: { language: 'زبان', searchLanguage: 'زبان تلاش کریں…', home: 'ہوم', tokens: 'ٹوکن', doctors: 'دستیاب ڈاکٹر', notifications: 'اطلاعات', profile: 'پروفائل', selectLanguage: 'اپنی زبان منتخب کریں' }
};

const LanguageContext = createContext(null);
const STORAGE_KEY = 'aas-language';

export function LanguageProvider({ children }) {
  const [languageCode, setLanguageCode] = useState(() => window.localStorage.getItem(STORAGE_KEY) || 'en');
  const language = LANGUAGES.find((item) => item.code === languageCode) || LANGUAGES[1];
  const setLanguage = (code) => {
    if (LANGUAGES.some((item) => item.code === code)) {
      setLanguageCode(code);
      window.localStorage.setItem(STORAGE_KEY, code);
    }
  };

  useEffect(() => {
    document.documentElement.lang = language.code;
    document.documentElement.dir = language.direction;
  }, [language]);

  const value = useMemo(() => ({
    language, languages: LANGUAGES, setLanguage,
    t: (key) => translations[language.code]?.[key] || translations.en[key] || key
  }), [language]);
  return createElement(LanguageContext.Provider, { value }, children);
}

export function useLanguage() {
  return useContext(LanguageContext);
}
