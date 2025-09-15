import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { COMMON_LANGUAGES, getLanguageName } from '@/constants/languages';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LanguageSelectorProps {
  language: string;
  onLanguageChange: (language: string) => void;
  disabled?: boolean;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LanguageSelector({
  language,
  onLanguageChange,
  disabled = false,
  className,
  showLabel = true,
  size = 'md'
}: LanguageSelectorProps) {
  const handleValueChange = useCallback((value: string) => {
    onLanguageChange(value);
  }, [onLanguageChange]);

  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-base',
    lg: 'h-12 text-lg'
  };

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Globe className="w-4 h-4" />
          识别语言
        </label>
      )}
      
      <Select
        value={language}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className={cn(sizeClasses[size])}>
          <SelectValue placeholder="选择语言">
            {language && getLanguageName(language)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {COMMON_LANGUAGES.map(lang => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* 显示当前选中语言的详细信息 */}
      <div className="text-xs text-muted-foreground">
        当前选择: {getLanguageName(language)}
      </div>
    </div>
  );
}