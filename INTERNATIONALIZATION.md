# FlyCut Caption 国际化指南

## 概述

FlyCut Caption 组件现在支持类似 Ant Design 的国际化方式，提供完整的多语言支持和自定义语言包功能。

## 特性

- ✅ **内置语言包**：中文 (zh-CN)、英文 (en-US)
- ✅ **自定义语言包**：支持用户导入自定义语言
- ✅ **动态语言切换**：运行时切换语言
- ✅ **TypeScript 支持**：完整的类型定义
- ✅ **语言包管理**：注册和管理多个语言包
- ✅ **热切换**：无需重新渲染即可切换语言

## 基本使用

### 1. 导入内置语言包

```typescript
import { FlyCutCaption, zhCN, enUS } from '@flycut/caption-react'

function App() {
  return (
    <FlyCutCaption
      config={{ language: 'zh' }}
      // 语言包会自动根据 language 配置选择
    />
  )
}
```

### 2. 使用自定义语言包

```typescript
import { FlyCutCaption, type FlyCutCaptionLocale } from '@flycut/caption-react'

// 创建自定义语言包
const customLocale: FlyCutCaptionLocale = {
  common: {
    loading: '読み込み中...',
    error: 'エラー',
    // ... 其他翻译
  },
  components: {
    fileUpload: {
      dragDropText: 'ビデオファイルをここにドラッグ',
      // ... 其他翻译
    },
    // ... 其他组件翻译
  },
  messages: {
    // ... 消息翻译
  }
}

function App() {
  return (
    <FlyCutCaption
      config={{ language: 'ja' }}
      locale={customLocale}
    />
  )
}
```

### 3. 动态语言切换

```typescript
import { useState } from 'react'
import { FlyCutCaption, zhCN, enUS } from '@flycut/caption-react'

function App() {
  const [language, setLanguage] = useState('zh')
  const [locale, setLocale] = useState(undefined)

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)

    switch (lang) {
      case 'zh':
        setLocale(zhCN)
        break
      case 'en':
        setLocale(enUS)
        break
      case 'ja':
        setLocale(customJaLocale)
        break
      default:
        setLocale(undefined) // 使用默认语言包
    }
  }

  return (
    <div>
      <button onClick={() => handleLanguageChange('zh')}>中文</button>
      <button onClick={() => handleLanguageChange('en')}>English</button>
      <button onClick={() => handleLanguageChange('ja')}>日本語</button>

      <FlyCutCaption
        config={{ language }}
        locale={locale}
        onLanguageChange={handleLanguageChange}
      />
    </div>
  )
}
```

## API 参考

### FlyCutCaptionProps

新增的国际化相关属性：

```typescript
interface FlyCutCaptionProps {
  // ... 其他属性

  /** 自定义语言包 */
  locale?: FlyCutCaptionLocale

  /** 语言变化回调 */
  onLanguageChange?: (language: string) => void
}
```

### FlyCutCaptionLocale

完整的语言包类型定义：

```typescript
interface FlyCutCaptionLocale {
  common: {
    loading: string
    error: string
    success: string
    // ... 更多通用翻译
  }
  components: {
    fileUpload: {
      dragDropText: string
      selectFile: string
      // ... 更多文件上传翻译
    }
    videoPlayer: {
      play: string
      pause: string
      // ... 更多视频播放器翻译
    }
    subtitleEditor: {
      title: string
      addSubtitle: string
      // ... 更多字幕编辑器翻译
    }
    asrPanel: {
      title: string
      startASR: string
      // ... 更多语音识别翻译
    }
    exportDialog: {
      title: string
      exportVideo: string
      // ... 更多导出对话框翻译
    }
    messageCenter: {
      title: string
      noMessages: string
      // ... 更多消息中心翻译
    }
    themeToggle: {
      light: string
      dark: string
      // ... 更多主题切换翻译
    }
    languageSelector: {
      language: string
      selectLanguage: string
      // ... 更多语言选择器翻译
    }
  }
  messages: {
    fileUpload: {
      uploadSuccess: string
      uploadFailed: string
      // ... 更多文件上传消息
    }
    asr: {
      asrCompleted: string
      asrFailed: string
      // ... 更多语音识别消息
    }
    export: {
      exportCompleted: string
      exportFailed: string
      // ... 更多导出消息
    }
    subtitle: {
      subtitleAdded: string
      subtitleDeleted: string
      // ... 更多字幕操作消息
    }
    video: {
      videoLoaded: string
      videoLoadFailed: string
      // ... 更多视频操作消息
    }
    general: {
      operationSuccess: string
      operationFailed: string
      // ... 更多通用消息
    }
  }
}
```

## 导出的语言包

### 内置语言包

```typescript
import { zhCN, enUS, defaultLocale } from '@flycut/caption-react'

// zhCN - 简体中文语言包
// enUS - 英文语言包
// defaultLocale - 默认语言包（等同于 zhCN）
```

### 语言包管理

```typescript
import { LocaleProvider, useLocale, useTranslation } from '@flycut/caption-react'

// LocaleProvider - 语言包提供者组件
// useLocale - 语言包管理 Hook
// useTranslation - 翻译函数 Hook
```

## 高级使用

### 语言包注册

```typescript
import { LocaleProvider } from '@flycut/caption-react'

function App() {
  return (
    <LocaleProvider
      language="ja"
      locale={customJaLocale}
      onLanguageChange={(lang) => console.log('Language changed:', lang)}
    >
      <FlyCutCaption />
    </LocaleProvider>
  )
}
```

### 嵌套语言包使用

```typescript
const { t, setLanguage, registerLocale } = useLocale()

// 使用翻译函数
const text = t('common.loading') // "加载中..."

// 注册新语言包
registerLocale('fr', frenchLocale)

// 切换语言
setLanguage('fr')
```

## 最佳实践

### 1. 语言包组织

建议将语言包文件单独组织：

```
src/
  locales/
    zh-CN.ts
    en-US.ts
    ja-JP.ts
    index.ts
```

### 2. 按需加载

对于大型应用，可以考虑按需加载语言包：

```typescript
const loadLocale = async (language: string) => {
  switch (language) {
    case 'ja':
      return (await import('./locales/ja-JP')).default
    case 'fr':
      return (await import('./locales/fr-FR')).default
    default:
      return undefined
  }
}
```

### 3. 类型安全

始终使用 TypeScript 类型定义：

```typescript
import type { FlyCutCaptionLocale } from '@flycut/caption-react'

const myLocale: FlyCutCaptionLocale = {
  // TypeScript 会提供完整的类型检查和自动补全
}
```

## 与 Ant Design 的对比

| 特性 | Ant Design | FlyCut Caption |
|------|------------|----------------|
| 导入方式 | `import zhCN from 'antd/locale/zh_CN'` | `import { zhCN } from '@flycut/caption-react'` |
| 使用方式 | `<ConfigProvider locale={zhCN}>` | `<FlyCutCaption locale={zhCN}>` |
| 动态切换 | ✅ 支持 | ✅ 支持 |
| 自定义语言包 | ✅ 支持 | ✅ 支持 |
| TypeScript | ✅ 完整支持 | ✅ 完整支持 |
| 嵌套翻译 | ✅ 点分隔路径 | ✅ 点分隔路径 |

## 示例项目

参考 `test-app` 目录中的完整示例，演示了：

- 内置语言包使用
- 自定义语言包创建
- 动态语言切换
- 回调函数处理
- TypeScript 类型安全

运行示例：

```bash
cd test-app
pnpm install
pnpm dev
```

## 迁移指南

如果你正在从旧版本迁移到新的国际化系统：

### 旧版本
```typescript
// 旧版本需要用户配置 i18next
import i18n from 'i18next'
// ... 复杂的 i18n 配置

<FlyCutCaption />
```

### 新版本
```typescript
// 新版本直接导入语言包
import { FlyCutCaption, zhCN } from '@flycut/caption-react'

<FlyCutCaption locale={zhCN} />
```

新版本的优势：
- 🎯 **零配置**：无需配置 i18next
- 🔄 **即插即用**：直接导入使用
- 🎨 **类型安全**：完整的 TypeScript 支持
- 🚀 **性能优化**：内置语言包管理
- 🔧 **灵活扩展**：支持自定义语言包