# 语言选择器组件

提供两种语言选择器组件，用于 Whisper ASR 语言选择。

## 组件

### 1. LanguageSelector - 基础语言选择器

简单的下拉选择器，适用于快速选择。

```tsx
import { LanguageSelector } from '@/components/LanguageSelector';

<LanguageSelector
  language={language}
  onLanguageChange={(lang) => setLanguage(lang)}
  disabled={false}
  showLabel={true}
  size="md"
/>
```

**Props:**
- `language: string` - 当前选中的语言代码
- `onLanguageChange: (language: string) => void` - 语言变化回调
- `disabled?: boolean` - 是否禁用
- `className?: string` - 自定义样式类
- `showLabel?: boolean` - 是否显示标签（默认 true）
- `size?: 'sm' | 'md' | 'lg'` - 组件大小

### 2. AdvancedLanguageSelector - 高级语言选择器

带搜索功能的高级选择器，支持所有 Whisper 语言。

```tsx
import { AdvancedLanguageSelector } from '@/components/LanguageSelector';

<AdvancedLanguageSelector
  language={language}
  onLanguageChange={(lang) => setLanguage(lang)}
  disabled={false}
  placeholder="搜索语言..."
/>
```

**Props:**
- `language: string` - 当前选中的语言代码
- `onLanguageChange: (language: string) => void` - 语言变化回调
- `disabled?: boolean` - 是否禁用
- `className?: string` - 自定义样式类
- `placeholder?: string` - 搜索框占位符

## 特性

### 基础选择器特性
- 📋 显示常用的 20 种语言
- 🎨 响应式设计，支持深色模式
- 🔧 可配置大小和样式
- 📱 移动端友好

### 高级选择器特性
- 🔍 实时搜索过滤（支持语言名称和代码）
- 🌍 支持所有 112 种 Whisper 语言
- 📋 智能排序（常用语言优先，搜索匹配优先）
- 🎯 键盘导航支持
- 🎨 美观的下拉界面设计
- ✅ 当前选择高亮显示

## 语言支持

支持所有 Whisper 官方语言，包括：
- **常用语言**: English, 中文, 日本語, 한국어, Français, Español, Deutsch, Русский, Italiano, Português 等
- **全部语言**: 112 种语言，涵盖主要的世界语言

## 使用场景

### 在 ASR 面板中使用
```tsx
// 快速选择（显示在主界面）
<LanguageSelector
  language={language}
  onLanguageChange={handleLanguageChange}
  disabled={isLoading}
  size="sm"
/>

// 高级选择（显示在设置面板）
<AdvancedLanguageSelector
  language={language}
  onLanguageChange={handleLanguageChange}
  disabled={isLoading}
  placeholder="搜索支持的语言..."
/>
```

## 样式定制

两个组件都支持通过 `className` 进行样式定制，并且完全兼容 Tailwind CSS 的深色模式。

```tsx
<LanguageSelector
  className="w-48"  // 自定义宽度
  // 其他 props...
/>
```