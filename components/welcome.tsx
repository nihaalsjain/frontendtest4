import { useState } from 'react';
import { ChevronDown, Mic, Phone } from 'lucide-react';

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
      className="fixed inset-0 z-10 mx-auto flex h-svh flex-col items-center justify-center text-center bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100"
    >
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
            <div className="relative z-10 text-center" style={{ bottom: '30px' }}>
              {/* Bosch Logo and Text */}
              <div className="mb-8">
                <img
                    src="/bosch_logo_embedded.svg"
                    alt="Bosch Logo"
                    width={180}
                    height={180}
                    className="mx-auto"
                />
              </div>

              {/* Allion.ai Branding */}
              <div className="text-center -mt-4">
                <div className="flex items-center justify-center">
                  <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center mr-4 relative shadow-lg">
                    {/* Mini gear animation */}
                    <div className="w-6 h-6 animate-spin" style={{ animationDuration: '3s' }}>
                      <svg viewBox="0 0 24 24" className="w-full h-full text-white">
                        <path
                          fill="currentColor"
                          d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"
                        />
                      </svg>
                    </div>
                  </div>
                  <span className="text-black font-bold text-4xl tracking-wide">Allion.ai</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-gray-700 text-lg mb-12 font-medium">
          Chat live with Mechanic's Trusted Co-Pilot
        </h1>
      
        {/* Main Content */}
        <div className="z-10 w-full max-w-md space-y-6">
            {/* Language Selector */}
            <div className="relative">
            <button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="w-full bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg px-4 py-4 text-left text-gray-600 font-medium flex items-center justify-between shadow-sm hover:bg-white/90 transition-all duration-200"
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
            <div className="flex bg-gray-100 rounded-lg p-1">
            <button
                onClick={() => onVoiceBaseChange('Voice Assistant')}
                disabled={!language}
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                voiceBase === 'Voice Assistant' && language
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                } ${!language ? 'cursor-not-allowed' : ''}`}
            >
                VOICE ASSISTANT
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
                LIVE ASSISTANT
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
                <Phone className="w-5 h-5" />
            )}
            <span>{startButtonText}</span>
            </button>
        </div>
      </div>
    </div>
  );
};