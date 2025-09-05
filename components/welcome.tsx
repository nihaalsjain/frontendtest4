import { useState } from 'react';
import { ChevronDown, Mic, Camera } from 'lucide-react';

interface WelcomeProps {
  disabled: boolean;
  startButtonText: string;
  onStartCall: () => void;
  language: 'en' | 'kn' | 'hi' | null; // allow null
  onLanguageChange: (lang: 'en' | 'kn' | 'hi') => void;
  voiceBase: 'Voice Assistant' | 'Live Assistant';
  onVoiceBaseChange: (base: 'Voice Assistant' | 'Live Assistant') => void;
}

export const Welcome = ({
  disabled,
  startButtonText,
  onStartCall,
  language,
  onLanguageChange,
  voiceBase,
  onVoiceBaseChange,
  ref,
}: React.ComponentProps<'div'> & WelcomeProps) => {
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'kn', label: 'ಕನ್ನಡ' },
    { code: 'hi', label: 'हिंदी' },
  ];

  const selectedLang = languages.find((l) => l.code === language);

  return (
    <div
      ref={ref}
      inert={disabled}
      className="fixed inset-0 z-10 mx-auto flex h-svh flex-col items-center justify-center text-center bg-gradient-to-br from-purple-900 via-blue-900 to-slate-900"
    >
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 blur-3xl"></div>
      
      {/* Main Content Wrapper */}
      <div className="flex flex-col items-center justify-center w-full">

        {/* Combined Logo Section with Glowing Ring */}
        <div className="flex flex-col items-center justify-center mb-12 relative">
          <div className="relative w-80 h-80 flex items-center justify-center">
            {/* Animated Glowing Ring */}
            <div className="absolute inset-0 rounded-full animate-pulse">
              {/* Outer glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600 opacity-20 blur-xl"></div>
              
              {/* Main ring with rotation */}
              <div className="absolute inset-4 rounded-full bg-transparent border-4 border-transparent animate-spin" style={{ animationDuration: '8s' }}>
                <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500 opacity-80 blur-sm"></div>
              </div>
              
              {/* Sharp ring overlay */}
              <div className="absolute inset-6 rounded-full border-2 border-cyan-400 opacity-90 shadow-lg shadow-cyan-400/50"></div>
              
              {/* Inner subtle glow */}
              <div className="absolute inset-8 rounded-full bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 opacity-10"></div>
            </div>

            {/* Content inside the ring */}
            <div className="relative z-10 text-center">
              {/* Allion.ai Branding */}
              <div className="text-center -mt-4">
                <div className="flex items-center justify-center">
                  <span className="text-white font-bold text-4xl tracking-wide ml-4">Allion.ai</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-gray-200 text-lg mb-12 font-medium drop-shadow-sm">
          {language === 'kn' ? 'ಮೆಕ್ಯಾನಿಕ್‌ನ ವಿಶ್ವಾಸಾರ್ಹ ಸಹ-ಪೈಲಟ್' : language === 'hi' ? 'मैकेनिक का विश्वसनीय सह-पायलट' : 'Mechanic\'s Trusted Co-Pilot'}
        </h1>
      
        {/* Main Content */}
        <div className="z-10 w-full max-w-md space-y-6">
            {/* Language Selector */}
            <div className="relative">
            <button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-4 text-left text-gray-200 font-medium flex items-center justify-between shadow-lg hover:bg-white/15 transition-all duration-200"
                disabled={disabled}
            >
                {selectedLang ? selectedLang.label : 'Select Language'}
                <ChevronDown 
                className={`w-5 h-5 transition-transform duration-200 ${
                    isLanguageDropdownOpen ? 'rotate-180' : ''
                }`} 
                />
            </button>
            
            {isLanguageDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-gray-200 shadow-lg z-20 max-h-60 overflow-y-auto">
                {languages.map((lang) => (
                    <button
                    key={lang.code}
                    onClick={() => {
                        onLanguageChange(lang.code as 'en' | 'kn' | 'hi');
                        setIsLanguageDropdownOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-gray-600 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors"
                    >
                    {lang.label}
                    </button>
                ))}
                </div>
            )}
            </div>

            {/* Assistant Type Toggle */}
            <div className="flex bg-white/70 backdrop-blur-md rounded-lg p-1 border border-white/20">
            <button
                onClick={() => onVoiceBaseChange('Voice Assistant')}
                disabled={!language}
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                voiceBase === 'Voice Assistant' && language
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                } ${!language ? 'cursor-not-allowed' : ''}`}
            >
                {language === 'kn' ? 'ಧ್ವನಿ ಸಹಾಯಕ' : language === 'hi' ? 'ध्वनि सहायक' : 'VOICE ASSISTANT'}
            </button>
            <button
                onClick={() => onVoiceBaseChange('Live Assistant')}
                disabled={!language}
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                voiceBase === 'Live Assistant' && language
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                } ${!language ? 'cursor-not-allowed' : ''}`}
            >
                {language === 'kn' ? 'ಲೈವ್ ಸಹಾಯಕ' : language === 'hi' ? 'लाइव सहायक' : 'LIVE ASSISTANT'}
            </button>
            </div>

            {/* Start Call Button */}
            <button 
                onClick={onStartCall}
                disabled={!language || disabled}
                className="w-full bg-gradient-to-r from-purple-400 to-indigo-500 text-white font-semibold py-4 px-6 rounded-lg text-lg tracking-wider shadow-lg hover:from-purple-500 hover:to-indigo-600 transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:from-purple-400"
            >
            {voiceBase === 'Voice Assistant' ? (
                <Mic className="w-5 h-5" />
            ) : (
                <Camera className="w-5 h-5" />
            )}
            <span>
              {language === 'kn' ? 'ಕರೆ ಪ್ರಾರಂಭಿಸಿ' : language === 'hi' ? 'कॉल शुरू करें' : 'Start Call'
              }
            </span>
            </button>
        </div>
      </div>
    </div>
  );
};