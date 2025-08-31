import { Button } from '@/components/ui/button';

interface WelcomeProps {
  disabled: boolean;
  startButtonText: string;
  onStartCall: () => void;
  language: 'en' | 'kn' | 'hi'; // 👈 new prop
  onLanguageChange: (lang: 'en' | 'kn' | 'hi') => void; // 👈 new prop
}

export const Welcome = ({
  disabled,
  startButtonText,
  onStartCall,
  language,
  onLanguageChange,
  ref,
}: React.ComponentProps<'div'> & WelcomeProps) => {
  return (
    <div
      ref={ref}
      inert={disabled}
      className="fixed inset-0 z-10 mx-auto flex h-svh flex-col items-center justify-center text-center"
    >
      <img
        src="/bosch_logo_embedded.svg"
        alt="Bosch Logo"
        width={180}
        height={180}
        className="mb-4"
      />

      <img src="/allion_img.png" alt="Allion Logo" width={250} height={200} className="mb-4" />

      <p className="text-fg1 max-w-prose pt-1 leading-6 font-medium">
        Chat live with your voice AI agent
      </p>

      {/* 👇 Language selection buttons with active color */}
      <div className="mt-4 flex gap-3">
        <Button
          onClick={() => onLanguageChange('en')}
          className={`px-4 py-2 ${
            language === 'en'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-black hover:bg-gray-300'
          }`}
        >
          English
        </Button>
        <Button
          onClick={() => onLanguageChange('kn')}
          className={`px-4 py-2 ${
            language === 'kn'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-black hover:bg-gray-300'
          }`}
        >
          ಕನ್ನಡ
        </Button>
        <Button
          onClick={() => onLanguageChange('hi')}
          className={`px-4 py-2 ${
            language === 'hi'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-black hover:bg-gray-300'
          }`}
        >
          हिंदी
        </Button>
      </div>

      <Button variant="primary" size="lg" onClick={onStartCall} className="mt-6 w-64 font-mono">
        {startButtonText}
      </Button>

      
    </div>
  );
};
