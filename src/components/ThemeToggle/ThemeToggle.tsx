import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface ThemeToggleProps {
  variant?: 'select' | 'button';
  className?: string;
}

const themeOptions = [
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
  { value: 'system', label: '跟随系统', icon: Monitor },
] as const;

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'button', 
  className 
}) => {
  const { theme, setTheme, toggleTheme } = useThemeStore();

  if (variant === 'select') {
    return (
      <Select value={theme} onValueChange={setTheme}>
        <SelectTrigger className={className}>
          <SelectValue>
            {(() => {
              const currentOption = themeOptions.find(option => option.value === theme);
              const Icon = currentOption?.icon || Monitor;
              return (
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{currentOption?.label}</span>
                </div>
              );
            })()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {themeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  // Button variant
  const currentOption = themeOptions.find(option => option.value === theme);
  const Icon = currentOption?.icon || Monitor;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={className}
      title={`当前主题: ${currentOption?.label || '未知'}`}
    >
      <Icon className="h-4 w-4" />
      <span className="sr-only">切换主题</span>
    </Button>
  );
};