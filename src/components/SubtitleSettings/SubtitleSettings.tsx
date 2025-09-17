// 字幕设置面板组件
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Settings,
  Type,
  Palette,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Eye,
  EyeOff,
  RotateCcw
} from 'lucide-react';

export interface SubtitleStyle {
  // 字体设置
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  
  // 颜色设置
  color: string;
  backgroundColor: string;
  borderColor: string;
  shadowColor: string;
  
  // 布局设置
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
  
  // 边框和阴影
  borderWidth: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowBlur: number;
  
  // 背景
  backgroundOpacity: number;
  backgroundRadius: number;
  backgroundPadding: number;
  
  // 位置
  bottomOffset: number; // 距离底部的偏移量
  
  // 显示设置
  visible: boolean;
}

export const defaultSubtitleStyle: SubtitleStyle = {
  fontSize: 24,
  fontFamily: 'Arial, sans-serif',
  fontWeight: 'bold',
  fontStyle: 'normal',
  
  color: '#FFFFFF',
  backgroundColor: '#000000',
  borderColor: '#000000',
  shadowColor: '#000000',
  
  textAlign: 'center',
  lineHeight: 1.2,
  letterSpacing: 0,
  
  borderWidth: 1,
  shadowOffsetX: 1,
  shadowOffsetY: 1,
  shadowBlur: 2,
  
  backgroundOpacity: 0.8,
  backgroundRadius: 4,
  backgroundPadding: 8,
  
  bottomOffset: 60,
  
  visible: true,
};

interface SubtitleSettingsProps {
  style: SubtitleStyle;
  onStyleChange: (style: SubtitleStyle) => void;
  className?: string;
}

export function SubtitleSettings({
  style,
  onStyleChange,
  className
}: SubtitleSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false); // 详细设置展开状态
  const [isVisible, setIsVisible] = useState(false); // 整个面板显示状态，默认隐藏

  const updateStyle = useCallback((updates: Partial<SubtitleStyle>) => {
    onStyleChange({ ...style, ...updates });
  }, [style, onStyleChange]);

  const resetToDefault = useCallback(() => {
    onStyleChange(defaultSubtitleStyle);
  }, [onStyleChange]);

  const presetStyles = [
    {
      name: '经典白字',
      style: {
        ...defaultSubtitleStyle,
        color: '#FFFFFF',
        borderColor: '#000000',
        borderWidth: 2,
        backgroundColor: 'transparent',
        backgroundOpacity: 0,
      }
    },
    {
      name: '黄色字幕',
      style: {
        ...defaultSubtitleStyle,
        color: '#FFFF00',
        borderColor: '#000000',
        borderWidth: 1,
        backgroundColor: 'transparent',
        backgroundOpacity: 0,
      }
    },
    {
      name: '黑底白字',
      style: {
        ...defaultSubtitleStyle,
        color: '#FFFFFF',
        backgroundColor: '#000000',
        backgroundOpacity: 0.8,
        borderWidth: 0,
      }
    },
    {
      name: '透明背景',
      style: {
        ...defaultSubtitleStyle,
        color: '#FFFFFF',
        backgroundColor: 'transparent',
        backgroundOpacity: 0,
        shadowBlur: 3,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
      }
    }
  ];

  return (
    <div className={cn('bg-card rounded-lg border', className)}>
      {!isVisible ? (
        /* 收起状态 - 简洁按钮 */
        <div className="p-4">
          <button
            onClick={() => setIsVisible(true)}
            className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg border border-dashed hover:bg-muted/50 transition-colors group"
          >
            <Settings className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              字幕设置
            </span>
            <div className="text-xs text-muted-foreground">
              点击展开
            </div>
          </button>
        </div>
      ) : (
        <>
          {/* 标题栏 */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span className="font-medium">字幕设置</span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => updateStyle({ visible: !style.visible })}
                className={cn(
                  'p-1.5 rounded-md transition-colors text-xs',
                  style.visible 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                )}
                title={style.visible ? '隐藏字幕' : '显示字幕'}
              >
                {style.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>
              <button
                onClick={resetToDefault}
                className="p-1.5 hover:bg-muted rounded-md transition-colors"
                title="重置为默认"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:bg-muted rounded-md transition-colors"
                title={isExpanded ? '收起详细设置' : '展开详细设置'}
              >
                <div className={cn(
                  'w-3 h-3 transition-transform',
                  isExpanded ? 'rotate-180' : ''
                )}>
                  ▼
                </div>
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="p-1.5 hover:bg-muted rounded-md transition-colors"
                title="收起字幕设置"
              >
                <div className="w-3 h-3 transition-transform">
                  ✕
                </div>
              </button>
            </div>
          </div>

          {/* 预设样式 */}
          <div className="p-4 border-b">
            <label className="text-sm font-medium mb-2 block">预设样式</label>
            <div className="grid grid-cols-2 gap-2">
              {presetStyles.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => onStyleChange(preset.style)}
                  className="p-2 text-left text-xs border rounded-md hover:bg-muted transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* 详细设置 */}
          {isExpanded && (
        <div className="p-4 space-y-4">
          {/* 字体设置 */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center">
              <Type className="w-3 h-3 mr-1" />
              字体设置
            </label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <label className="text-xs w-16">大小:</label>
                <input
                  type="range"
                  min="12"
                  max="48"
                  value={style.fontSize}
                  onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-xs w-8 text-right">{style.fontSize}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-xs w-16">字体:</label>
                <select
                  value={style.fontFamily}
                  onChange={(e) => updateStyle({ fontFamily: e.target.value })}
                  className="flex-1 text-xs p-1 border rounded"
                >
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="'Microsoft YaHei', sans-serif">微软雅黑</option>
                  <option value="'PingFang SC', sans-serif">苹方</option>
                  <option value="'Source Han Sans', sans-serif">思源黑体</option>
                  <option value="monospace">等宽字体</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center text-xs">
                  <input
                    type="checkbox"
                    checked={style.fontWeight === 'bold'}
                    onChange={(e) => updateStyle({ 
                      fontWeight: e.target.checked ? 'bold' : 'normal' 
                    })}
                    className="mr-1"
                  />
                  加粗
                </label>
                <label className="flex items-center text-xs">
                  <input
                    type="checkbox"
                    checked={style.fontStyle === 'italic'}
                    onChange={(e) => updateStyle({ 
                      fontStyle: e.target.checked ? 'italic' : 'normal' 
                    })}
                    className="mr-1"
                  />
                  斜体
                </label>
              </div>
            </div>
          </div>

          {/* 颜色设置 */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center">
              <Palette className="w-3 h-3 mr-1" />
              颜色设置
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <label className="text-xs w-16">文字:</label>
                <input
                  type="color"
                  value={style.color}
                  onChange={(e) => updateStyle({ color: e.target.value })}
                  className="w-8 h-6 rounded"
                />
                <input
                  type="text"
                  value={style.color}
                  onChange={(e) => updateStyle({ color: e.target.value })}
                  className="flex-1 text-xs p-1 border rounded font-mono"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-xs w-16">背景:</label>
                <input
                  type="color"
                  value={style.backgroundColor}
                  onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                  className="w-8 h-6 rounded"
                />
                <input
                  type="text"
                  value={style.backgroundColor}
                  onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                  className="flex-1 text-xs p-1 border rounded font-mono"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-xs w-16">边框:</label>
                <input
                  type="color"
                  value={style.borderColor}
                  onChange={(e) => updateStyle({ borderColor: e.target.value })}
                  className="w-8 h-6 rounded"
                />
                <input
                  type="text"
                  value={style.borderColor}
                  onChange={(e) => updateStyle({ borderColor: e.target.value })}
                  className="flex-1 text-xs p-1 border rounded font-mono"
                />
              </div>
            </div>
          </div>

          {/* 对齐方式 */}
          <div>
            <label className="text-sm font-medium mb-2 block">文字对齐</label>
            <div className="flex space-x-1">
              {[
                { value: 'left', icon: AlignLeft, label: '左对齐' },
                { value: 'center', icon: AlignCenter, label: '居中' },
                { value: 'right', icon: AlignRight, label: '右对齐' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => updateStyle({ textAlign: value as any })}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    style.textAlign === value
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                  title={label}
                >
                  <Icon className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>

          {/* 位置设置 */}
          <div>
            <label className="text-sm font-medium mb-2 block">位置设置</label>
            <div className="flex items-center space-x-2">
              <label className="text-xs w-20">底部距离:</label>
              <input
                type="range"
                min="20"
                max="200"
                value={style.bottomOffset}
                onChange={(e) => updateStyle({ bottomOffset: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="text-xs w-8 text-right">{style.bottomOffset}</span>
            </div>
          </div>

          {/* 背景透明度 */}
          <div>
            <label className="text-sm font-medium mb-2 block">背景透明度</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={style.backgroundOpacity}
                onChange={(e) => updateStyle({ backgroundOpacity: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="text-xs w-8 text-right">
                {Math.round(style.backgroundOpacity * 100)}%
              </span>
            </div>
          </div>

          {/* 阴影设置 */}
          <div>
            <label className="text-sm font-medium mb-2 block">阴影设置</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <label className="text-xs w-16">模糊:</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={style.shadowBlur}
                  onChange={(e) => updateStyle({ shadowBlur: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-xs w-8 text-right">{style.shadowBlur}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-xs w-16">X偏移:</label>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  value={style.shadowOffsetX}
                  onChange={(e) => updateStyle({ shadowOffsetX: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-xs w-8 text-right">{style.shadowOffsetX}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-xs w-16">Y偏移:</label>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  value={style.shadowOffsetY}
                  onChange={(e) => updateStyle({ shadowOffsetY: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-xs w-8 text-right">{style.shadowOffsetY}</span>
              </div>
            </div>
          </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}