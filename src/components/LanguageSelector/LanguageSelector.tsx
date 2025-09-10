// 语言选择器组件

import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { COMMON_LANGUAGES, getLanguageName } from '@/constants/languages';
import { Globe } from 'lucide-react';

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
  const handleChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    onLanguageChange(event.target.value);
  }, [onLanguageChange]);

  const sizeClasses = {
    sm: 'text-sm p-1.5',
    md: 'text-base p-2',
    lg: 'text-lg p-3'
  };

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Globe className="w-4 h-4" />
          识别语言
        </label>
      )}
      
      <div className="relative">
        <select
          value={language}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            'w-full border border-gray-300 dark:border-gray-600 rounded-md',
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'appearance-none cursor-pointer',
            sizeClasses[size],
            className
          )}
        >
          {COMMON_LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        
        {/* 自定义下拉箭头 */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg 
            className="w-4 h-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* 显示当前选中语言的详细信息 */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        当前选择: {getLanguageName(language)}
      </div>
    </div>
  );
}