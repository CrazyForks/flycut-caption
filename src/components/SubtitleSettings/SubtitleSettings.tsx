// 字幕设置面板组件
import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Type,
  Palette,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Eye,
  EyeOff,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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
    <div className={cn("bg-background rounded-lg", className)}>
      {/* 标题栏 */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">字幕设置</span>
          <div className="flex items-center space-x-1">
            <Button
              onClick={() => updateStyle({ visible: !style.visible })}
              variant={style.visible ? "default" : "outline"}
              size="sm"
              title={style.visible ? '隐藏字幕' : '显示字幕'}
            >
              {style.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </Button>
            <Button
              onClick={resetToDefault}
              variant="outline"
              size="sm"
              title="重置为默认"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* 预设样式 */}
      <div className="p-4">
        <Label className="text-sm font-medium mb-3 block">预设样式</Label>
        <div className="grid grid-cols-2 gap-2">
          {presetStyles.map((preset) => (
            <Button
              key={preset.name}
              onClick={() => onStyleChange(preset.style)}
              variant="outline"
              size="sm"
              className="justify-start"
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      {/* 详细设置 */}
      <div className="p-4 space-y-6">
        {/* 字体设置 */}
        <div>
          <Label className="text-sm font-medium mb-3 flex items-center">
            <Type className="w-4 h-4 mr-2" />
            字体设置
          </Label>
          <div className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="fontSize" className="text-sm">大小</Label>
              <Input
                id="fontSize"
                type="number"
                min="8"
                max="100"
                value={style.fontSize}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value >= 8 && value <= 100) {
                    updateStyle({ fontSize: value });
                  }
                }}
                className="col-span-2"
                placeholder="字体大小"
              />
              <span className="text-sm text-muted-foreground">px</span>
            </div>

            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="fontFamily" className="text-sm">字体</Label>
              <Select
                value={style.fontFamily}
                onValueChange={(value) => updateStyle({ fontFamily: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                  <SelectItem value="'Microsoft YaHei', sans-serif">微软雅黑</SelectItem>
                  <SelectItem value="'PingFang SC', sans-serif">苹方</SelectItem>
                  <SelectItem value="'Source Han Sans', sans-serif">思源黑体</SelectItem>
                  <SelectItem value="monospace">等宽字体</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="fontBold"
                  checked={style.fontWeight === 'bold'}
                  onCheckedChange={(checked) => updateStyle({
                    fontWeight: checked ? 'bold' : 'normal'
                  })}
                />
                <Label htmlFor="fontBold" className="text-sm">加粗</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="fontItalic"
                  checked={style.fontStyle === 'italic'}
                  onCheckedChange={(checked) => updateStyle({
                    fontStyle: checked ? 'italic' : 'normal'
                  })}
                />
                <Label htmlFor="fontItalic" className="text-sm">斜体</Label>
              </div>
            </div>
          </div>
        </div>

        {/* 颜色设置 */}
        <div>
          <Label className="text-sm font-medium mb-3 flex items-center">
            <Palette className="w-4 h-4 mr-2" />
            颜色设置
          </Label>
          <div className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-sm">文字</Label>
              <input
                type="color"
                value={style.color}
                onChange={(e) => updateStyle({ color: e.target.value })}
                className="w-10 h-8 rounded border cursor-pointer"
              />
              <Input
                type="text"
                value={style.color}
                onChange={(e) => updateStyle({ color: e.target.value })}
                className="col-span-2 font-mono text-sm"
                placeholder="#FFFFFF"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-sm">背景</Label>
              <input
                type="color"
                value={style.backgroundColor}
                onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                className="w-10 h-8 rounded border cursor-pointer"
              />
              <Input
                type="text"
                value={style.backgroundColor}
                onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                className="col-span-2 font-mono text-sm"
                placeholder="#000000"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-sm">边框</Label>
              <input
                type="color"
                value={style.borderColor}
                onChange={(e) => updateStyle({ borderColor: e.target.value })}
                className="w-10 h-8 rounded border cursor-pointer"
              />
              <Input
                type="text"
                value={style.borderColor}
                onChange={(e) => updateStyle({ borderColor: e.target.value })}
                className="col-span-2 font-mono text-sm"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>

        {/* 对齐方式 */}
        <div>
          <Label className="text-sm font-medium mb-3 block">文字对齐</Label>
          <ToggleGroup
            type="single"
            value={style.textAlign}
            onValueChange={(value) => {
              if (value) {
                updateStyle({ textAlign: value as 'left' | 'center' | 'right' });
              }
            }}
          >
            <ToggleGroupItem value="left" aria-label="左对齐">
              <AlignLeft className="w-4 h-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="居中">
              <AlignCenter className="w-4 h-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="右对齐">
              <AlignRight className="w-4 h-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* 位置设置 */}
        <div>
          <Label className="text-sm font-medium mb-3 block">位置设置</Label>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="text-sm">底部距离</Label>
            <div className="col-span-2">
              <Slider
                value={[style.bottomOffset]}
                onValueChange={([value]) => updateStyle({ bottomOffset: value })}
                min={20}
                max={200}
                step={1}
              />
            </div>
            <span className="text-sm text-muted-foreground text-right">{style.bottomOffset}px</span>
          </div>
        </div>

        {/* 背景透明度 */}
        <div>
          <Label className="text-sm font-medium mb-3 block">背景透明度</Label>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="text-sm">透明度</Label>
            <div className="col-span-2">
              <Slider
                value={[style.backgroundOpacity]}
                onValueChange={([value]) => updateStyle({ backgroundOpacity: value })}
                min={0}
                max={1}
                step={0.1}
              />
            </div>
            <span className="text-sm text-muted-foreground text-right">
              {Math.round(style.backgroundOpacity * 100)}%
            </span>
          </div>
        </div>

        {/* 阴影设置 */}
        <div>
          <Label className="text-sm font-medium mb-3 block">阴影设置</Label>
          <div className="space-y-3">
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-sm">模糊</Label>
              <div className="col-span-2">
                <Slider
                  value={[style.shadowBlur]}
                  onValueChange={([value]) => updateStyle({ shadowBlur: value })}
                  min={0}
                  max={10}
                  step={1}
                />
              </div>
              <span className="text-sm text-muted-foreground text-right">{style.shadowBlur}px</span>
            </div>

            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-sm">X偏移</Label>
              <div className="col-span-2">
                <Slider
                  value={[style.shadowOffsetX]}
                  onValueChange={([value]) => updateStyle({ shadowOffsetX: value })}
                  min={-5}
                  max={5}
                  step={1}
                />
              </div>
              <span className="text-sm text-muted-foreground text-right">{style.shadowOffsetX}px</span>
            </div>

            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-sm">Y偏移</Label>
              <div className="col-span-2">
                <Slider
                  value={[style.shadowOffsetY]}
                  onValueChange={([value]) => updateStyle({ shadowOffsetY: value })}
                  min={-5}
                  max={5}
                  step={1}
                />
              </div>
              <span className="text-sm text-muted-foreground text-right">{style.shadowOffsetY}px</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}