import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

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
  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'kn', label: 'ಕನ್ನಡ' },
    { code: 'hi', label: 'हिंदी' },
  ];

  const selectedLang = languages.find((l) => l.code === language);

  const handleSelect = (lang: 'en' | 'kn' | 'hi') => {
    onLanguageChange(lang);
    setIsLangOpen(false); // close dropdown
  };

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={ref}
      inert={disabled}
      className="fixed inset-0 z-10 mx-auto flex h-svh flex-col items-center justify-center text-center"
    >
      {/* Logos */}
      <img
        src="/bosch_logo_embedded.svg"
        alt="Bosch Logo"
        width={180}
        height={180}
        className="mb-4"
      />
      <img src="/allion_img.png" alt="Allion Logo" width={250} height={200} className="mb-4" />

      {/* Heading */}
      <p className="text-fg1 max-w-prose pt-1 leading-6 font-medium">
        Chat live with your voice AI agent
      </p>

      {/* 👇 Language Dropdown */}
      <div className="relative mt-4 w-64" ref={dropdownRef}>
        <Button
          onClick={() => setIsLangOpen((prev) => !prev)}
          className={`flex w-full items-center justify-between py-2 ${
            selectedLang ? 'bg-blue-600 text-white' : 'bg-gray-400 text-black'
          }`}
        >
          {selectedLang ? selectedLang.label : 'Select Language'}
          <span className="ml-2">▼</span>
        </Button>

        {isLangOpen && (
          <div className="absolute top-full left-0 z-[9999] mt-2 max-h-40 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code as 'en' | 'kn' | 'hi')}
                className={`block w-full px-4 py-2 text-left text-black ${
                  language === lang.code
                    ? 'bg-blue-100 font-semibold text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 👇 Voice base selection */}
      <div className="mt-4 flex gap-3">
        <Button
          onClick={() => onVoiceBaseChange('Voice Assistant')}
          disabled={!language}
          className={`w-40 px-4 py-2 ${
            voiceBase === 'Voice Assistant' && language
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-black hover:bg-gray-300'
          }`}
        >
          Voice Assistant
        </Button>
        <Button
          onClick={() => onVoiceBaseChange('Live Assistant')}
          disabled={!language}
          className={`w-40 px-4 py-2 ${
            voiceBase === 'Live Assistant' && language
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-black hover:bg-gray-300'
          }`}
        >
          Live Assistant
        </Button>
      </div>

      {/* Start Call button */}
      <Button
        variant="primary"
        size="lg"
        onClick={onStartCall}
        disabled={!language}
        className={`mt-6 w-64 font-mono ${!language ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        {startButtonText}
      </Button>
    </div>
  );
};
