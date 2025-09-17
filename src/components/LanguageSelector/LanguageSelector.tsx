import { useI18n, SUPPORTED_LANGUAGES } from '@/hooks/useI18n';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'button' | 'minimal';
  showText?: boolean;
}

export function LanguageSelector({ 
  className, 
  variant = 'button',
  showText = true 
}: LanguageSelectorProps) {
  const { currentLanguage, changeLanguage, getCurrentLanguageInfo } = useI18n();
  const currentLangInfo = getCurrentLanguageInfo();

  const handleLanguageChange = async (languageCode: string) => {
    await changeLanguage(languageCode as any);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'minimal' ? (
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 px-2", className)}
          >
            <Languages className="h-4 w-4" />
            {showText && (
              <span className="ml-1 hidden sm:inline">
                {currentLangInfo.nativeName}
              </span>
            )}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className={cn("h-9 px-3", className)}
          >
            <Languages className="h-4 w-4" />
            {showText && (
              <span className="ml-2">
                {currentLangInfo.nativeName}
              </span>
            )}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {SUPPORTED_LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-medium">{language.nativeName}</span>
              <span className="text-xs text-muted-foreground">{language.name}</span>
            </div>
            {currentLanguage === language.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}