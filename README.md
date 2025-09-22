# @flycut/caption-react

🎥 **FlyCut Caption** - A complete video subtitle editing React component with AI-powered speech recognition and visual editing capabilities.

[![npm version](https://img.shields.io/npm/v/@flycut/caption-react.svg)](https://www.npmjs.com/package/@flycut/caption-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## ✨ Features

- 🤖 **AI-Powered Speech Recognition** - Automatic subtitle generation using Whisper model
- ✂️ **Visual Subtitle Editing** - Interactive timeline-based subtitle editing
- 🎨 **Customizable Styling** - Flexible subtitle appearance configuration
- 🎬 **Video Processing** - Built-in video cutting and processing capabilities
- 🌐 **Multi-language Support** - i18n support for Chinese and English
- 🎭 **Theme Support** - Light/dark mode with system preference detection
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🚀 **TypeScript Ready** - Full TypeScript support with type definitions

## 📦 Installation

```bash
npm install @flycut/caption-react
# or
yarn add @flycut/caption-react
# or
pnpm add @flycut/caption-react
```

## 🚀 Quick Start

### Basic Usage

```tsx
import React from 'react'
import { FlyCutCaption } from '@flycut/caption-react'
import '@flycut/caption-react/styles'

function App() {
  return (
    <div style={{ height: '100vh' }}>
      <FlyCutCaption />
    </div>
  )
}
```

### With Configuration

```tsx
import React from 'react'
import { FlyCutCaption } from '@flycut/caption-react'
import '@flycut/caption-react/styles'

function App() {
  return (
    <div style={{ height: '100vh' }}>
      <FlyCutCaption
        config={{
          theme: 'auto',
          language: 'zh-CN',
          asrLanguage: 'auto',
          enableDragDrop: true,
          enableExport: true,
          enableVideoProcessing: true,
          maxFileSize: 500,
          supportedFormats: ['mp4', 'webm', 'avi', 'mov', 'mp3', 'wav', 'ogg']
        }}
        onReady={() => console.log('FlyCut Caption is ready')}
        onFileSelected={(file) => console.log('File selected:', file.name)}
        onSubtitleGenerated={(subtitles) => console.log('Subtitles generated:', subtitles.length)}
        onSubtitleChanged={(subtitles) => console.log('Subtitles changed:', subtitles.length)}
        onVideoProcessed={(blob, filename) => {
          // Handle processed video
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = filename
          a.click()
        }}
        onExportComplete={(blob, filename) => {
          console.log('Export complete:', filename)
        }}
        onError={(error) => console.error('Error:', error)}
        onProgress={(stage, progress) => console.log(\`\${stage}: \${progress}%\`)}
      />
    </div>
  )
}
```

## 📚 Usage Guide

### 1. Installation & Setup

```bash
# Install the package
npm install @flycut/caption-react

# For TypeScript projects, types are included
# No additional @types package needed
```

### 2. Import Styles

The component requires CSS styles to work properly:

```tsx
import '@flycut/caption-react/styles'
// or specific CSS file
import '@flycut/caption-react/dist/caption-react.css'
```

### 3. Basic Integration

```tsx
import { FlyCutCaption } from '@flycut/caption-react'
import '@flycut/caption-react/styles'

function VideoEditor() {
  return (
    <div className="video-editor-container">
      <FlyCutCaption />
    </div>
  )
}
```

### 4. Event Handling

```tsx
import { FlyCutCaption } from '@flycut/caption-react'

function VideoEditorWithEvents() {
  const handleFileSelected = (file: File) => {
    console.log('Selected file:', file.name, file.size)
  }

  const handleSubtitleGenerated = (subtitles: SubtitleChunk[]) => {
    console.log('Generated subtitles:', subtitles.length)
    // Save subtitles to your backend
    saveSubtitles(subtitles)
  }

  const handleVideoProcessed = (blob: Blob, filename: string) => {
    // Handle the processed video
    const url = URL.createObjectURL(blob)
    // Download or upload to your server
    downloadFile(url, filename)
  }

  const handleError = (error: Error) => {
    // Handle errors gracefully
    console.error('FlyCut Caption error:', error)
    showErrorNotification(error.message)
  }

  return (
    <FlyCutCaption
      onFileSelected={handleFileSelected}
      onSubtitleGenerated={handleSubtitleGenerated}
      onVideoProcessed={handleVideoProcessed}
      onError={handleError}
    />
  )
}
```

### 5. Configuration Options

```tsx
import { FlyCutCaption } from '@flycut/caption-react'

function ConfiguredEditor() {
  const config = {
    // Theme settings
    theme: 'dark' as const,

    // Language settings
    language: 'en-US',
    asrLanguage: 'en',

    // Feature toggles
    enableDragDrop: true,
    enableExport: true,
    enableVideoProcessing: true,

    // File constraints
    maxFileSize: 1000, // 1GB
    supportedFormats: ['mp4', 'webm', 'mov']
  }

  return (
    <FlyCutCaption config={config} />
  )
}
```

### 6. Custom Styling

```tsx
import { FlyCutCaption } from '@flycut/caption-react'
import './custom-styles.css'

function StyledEditor() {
  return (
    <FlyCutCaption
      className="my-custom-editor"
      style={{
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}
    />
  )
}
```

```css
/* custom-styles.css */
.my-custom-editor {
  --flycut-primary: #10b981;
  --flycut-border-radius: 12px;
}

.my-custom-editor .subtitle-item {
  border-radius: var(--flycut-border-radius);
}
```

### 7. Integration with State Management

```tsx
import { useState } from 'react'
import { FlyCutCaption } from '@flycut/caption-react'
import { useStore } from 'zustand'

function EditorWithStore() {
  const { setSubtitles, setCurrentVideo } = useStore()
  const [isProcessing, setIsProcessing] = useState(false)

  return (
    <FlyCutCaption
      onFileSelected={(file) => {
        setCurrentVideo(file)
      }}
      onSubtitleGenerated={(subtitles) => {
        setSubtitles(subtitles)
      }}
      onProgress={(stage, progress) => {
        setIsProcessing(progress < 100)
      }}
    />
  )
}
```

## 📖 API Reference

### FlyCutCaptionProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `undefined` | Custom CSS class name |
| `style` | `CSSProperties` | `undefined` | Custom inline styles |
| `config` | `FlyCutCaptionConfig` | `defaultConfig` | Component configuration |
| `locale` | `FlyCutCaptionLocale` | `undefined` | Custom language pack |
| `onReady` | `() => void` | `undefined` | Called when component is ready |
| `onFileSelected` | `(file: File) => void` | `undefined` | Called when a file is selected |
| `onSubtitleGenerated` | `(subtitles: SubtitleChunk[]) => void` | `undefined` | Called when subtitles are generated |
| `onSubtitleChanged` | `(subtitles: SubtitleChunk[]) => void` | `undefined` | Called when subtitles are changed |
| `onVideoProcessed` | `(blob: Blob, filename: string) => void` | `undefined` | Called when video processing is complete |
| `onExportComplete` | `(blob: Blob, filename: string) => void` | `undefined` | Called when export is complete |
| `onError` | `(error: Error) => void` | `undefined` | Called when an error occurs |
| `onProgress` | `(stage: string, progress: number) => void` | `undefined` | Called to report progress updates |
| `onLanguageChange` | `(language: string) => void` | `undefined` | Called when language changes |

### FlyCutCaptionConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Theme mode |
| `language` | `string` | `'zh-CN'` | Interface language |
| `asrLanguage` | `string` | `'auto'` | ASR recognition language |
| `enableDragDrop` | `boolean` | `true` | Enable drag and drop file upload |
| `enableExport` | `boolean` | `true` | Enable export functionality |
| `enableVideoProcessing` | `boolean` | `true` | Enable video processing functionality |
| `enableThemeToggle` | `boolean` | `true` | Enable theme toggle button |
| `enableLanguageSelector` | `boolean` | `true` | Enable language selector |
| `maxFileSize` | `number` | `500` | Maximum file size in MB |
| `supportedFormats` | `string[]` | `['mp4', 'webm', 'avi', 'mov', 'mp3', 'wav', 'ogg']` | Supported file formats |

## 🎨 Styling

The component comes with built-in styles that you need to import:

```tsx
import '@flycut/caption-react/styles'
```

You can also customize the appearance by:

1. **CSS Custom Properties**: Override CSS variables for colors and spacing
2. **Custom CSS Classes**: Use the `className` prop to apply custom styles
3. **Theme Configuration**: Use the `theme` config option for light/dark modes

### CSS Variables

```css
:root {
  --flycut-primary: #3b82f6;
  --flycut-background: #ffffff;
  --flycut-foreground: #1f2937;
  --flycut-muted: #f3f4f6;
  --flycut-border: #e5e7eb;
}

.dark {
  --flycut-background: #111827;
  --flycut-foreground: #f9fafb;
  --flycut-muted: #374151;
  --flycut-border: #4b5563;
}
```

## 🌐 Internationalization

FlyCut Caption supports componentized internationalization with built-in and custom language packs. The component automatically syncs external language changes with internal UI components.

### Built-in Language Packs

```tsx
import { FlyCutCaption, zhCN, enUS } from '@flycut/caption-react'

// Using built-in Chinese language pack
<FlyCutCaption
  config={{ language: 'zh' }}
  locale={zhCN}
/>

// Using built-in English language pack
<FlyCutCaption
  config={{ language: 'en' }}
  locale={enUS}
/>
```

### Custom Language Packs

```tsx
import { FlyCutCaption, type FlyCutCaptionLocale } from '@flycut/caption-react'

// Create custom language pack (Japanese example)
const customJaJP: FlyCutCaptionLocale = {
  common: {
    loading: '読み込み中...',
    error: 'エラー',
    success: '成功',
    confirm: '確認',
    cancel: 'キャンセル',
    ok: 'OK',
    // ... more common translations
  },
  components: {
    fileUpload: {
      dragDropText: 'ビデオファイルをここにドラッグするか、クリックして選択',
      selectFile: 'ファイルを選択',
      supportedFormats: 'サポート形式：',
      // ... more component translations
    },
    subtitleEditor: {
      title: '字幕エディター',
      addSubtitle: '字幕を追加',
      deleteSelected: '選択項目を削除',
      // ... more editor translations
    },
    // ... other component translations
  },
  messages: {
    fileUpload: {
      uploadSuccess: 'ファイルアップロード成功',
      uploadFailed: 'ファイルアップロード失敗',
      // ... more message translations
    },
    // ... other message translations
  }
}

// Use custom language pack
<FlyCutCaption
  config={{ language: 'ja' }}
  locale={customJaJP}
/>
```

### Componentized Language Switching

The new componentized approach provides better language synchronization between external controls and internal components:

```tsx
import { useState } from 'react'
import { FlyCutCaption, zhCN, enUS, type FlyCutCaptionLocale } from '@flycut/caption-react'

function App() {
  const [currentLanguage, setCurrentLanguage] = useState('zh')
  const [currentLocale, setCurrentLocale] = useState<FlyCutCaptionLocale | undefined>(undefined)

  const handleLanguageChange = (language: string) => {
    console.log('Language changed to:', language)
    setCurrentLanguage(language)

    // Set appropriate language pack based on language
    switch (language) {
      case 'zh':
      case 'zh-CN':
        setCurrentLocale(zhCN)
        break
      case 'en':
      case 'en-US':
        setCurrentLocale(enUS)
        break
      case 'ja':
      case 'ja-JP':
        setCurrentLocale(customJaJP) // Custom Japanese pack
        break
      default:
        setCurrentLocale(undefined) // Use default language pack
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          FlyCut Caption Internationalization Demo
        </h1>

        {/* External Language Controls */}
        <div className="mb-8 text-center space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-4">Language Switcher</h2>
            <div className="flex justify-center gap-4">
              <button
                className={`px-4 py-2 rounded ${currentLanguage === 'zh' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                onClick={() => handleLanguageChange('zh')}
              >
                中文 (Built-in)
              </button>
              <button
                className={`px-4 py-2 rounded ${currentLanguage === 'en' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                onClick={() => handleLanguageChange('en')}
              >
                English (Built-in)
              </button>
              <button
                className={`px-4 py-2 rounded ${currentLanguage === 'ja' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                onClick={() => handleLanguageChange('ja')}
              >
                日本語 (Custom)
              </button>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm">
              <strong>Current Language:</strong> {currentLanguage}
            </p>
            <p className="text-sm">
              <strong>Locale Type:</strong> {currentLocale ? 'Custom Locale' : 'Built-in Locale'}
            </p>
          </div>
        </div>

        {/* FlyCut Caption Component */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">FlyCut Caption Component</h2>
          <FlyCutCaption
            config={{
              theme: 'auto',
              language: currentLanguage,
              enableThemeToggle: true,
              enableLanguageSelector: true  // Internal language selector will sync with external changes
            }}
            locale={currentLocale}
            onLanguageChange={handleLanguageChange}  // Sync internal changes back to external state
            onError={(error) => {
              console.error('Component error:', error)
            }}
            onProgress={(stage, progress) => {
              console.log(`Progress: ${stage} - ${progress}%`)
            }}
          />
        </div>
      </div>
    </div>
  )
}
```

### Available Language Packs

| Language | Import | Description |
|----------|---------|-------------|
| Chinese (Simplified) | `zhCN` | 简体中文 |
| English (US) | `enUS` | English (United States) |
| Default | `defaultLocale` | Same as `zhCN` |

### Locale API

```tsx
// Import locale utilities
import { LocaleProvider, useLocale, useTranslation } from '@flycut/caption-react'

// Use LocaleProvider for nested components
<LocaleProvider language="zh" locale={zhCN}>
  <YourComponent />
</LocaleProvider>

// Access locale context
const { t, setLanguage, registerLocale } = useLocale()

// Register custom locale
registerLocale('fr', frenchLocale)

// Switch language programmatically
setLanguage('fr')
```

📚 **Detailed internationalization guide**: See [INTERNATIONALIZATION.md](./INTERNATIONALIZATION.md) for complete documentation on language packs, custom locales, and advanced i18n features.

## 🎬 Video Processing

The component supports various video processing features:

### Supported Formats

- **Video**: MP4, WebM, AVI, MOV
- **Audio**: MP3, WAV, OGG

### Processing Options

- **Quality**: Low, Medium, High
- **Format**: MP4, WebM
- **Subtitle Processing**: Burn-in, Separate file
- **Audio Preservation**: Enabled by default

## 📱 Browser Support

- **Chrome** 88+
- **Firefox** 78+
- **Safari** 14+
- **Edge** 88+

## 💡 Examples & Best Practices

### Complete React Application

```tsx
import React, { useState, useCallback } from 'react'
import { FlyCutCaption, zhCN, enUS, type FlyCutCaptionLocale } from '@flycut/caption-react'
import '@flycut/caption-react/styles'

function VideoEditorApp() {
  const [language, setLanguage] = useState<'zh' | 'en'>('zh')
  const [subtitles, setSubtitles] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)

  const locale = language === 'zh' ? zhCN : enUS

  const handleLanguageChange = useCallback((newLang: string) => {
    setLanguage(newLang as 'zh' | 'en')
  }, [])

  const handleSubtitleGenerated = useCallback((newSubtitles) => {
    setSubtitles(newSubtitles)
    // Auto-save to local storage
    localStorage.setItem('flycut-subtitles', JSON.stringify(newSubtitles))
  }, [])

  const handleProgress = useCallback((stage: string, progress: number) => {
    setIsProcessing(progress < 100)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Video Editor</h1>
            <div className="flex gap-2">
              <button
                onClick={() => handleLanguageChange('zh')}
                className={language === 'zh' ? 'btn-primary' : 'btn-secondary'}
              >
                中文
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={language === 'en' ? 'btn-primary' : 'btn-secondary'}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <FlyCutCaption
            config={{
              theme: 'auto',
              language,
              enableDragDrop: true,
              enableExport: true,
              maxFileSize: 1000
            }}
            locale={locale}
            onLanguageChange={handleLanguageChange}
            onSubtitleGenerated={handleSubtitleGenerated}
            onProgress={handleProgress}
            onError={(error) => {
              console.error('Error:', error)
              // Show user-friendly error message
              alert('处理过程中出现错误，请重试')
            }}
          />
        </div>

        {isProcessing && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              处理中，请稍候...
            </div>
          </div>
        )}

        {subtitles.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">生成的字幕 ({subtitles.length} 条)</h2>
            <div className="text-sm text-gray-600">
              字幕已自动保存到本地存储
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default VideoEditorApp
```

### Next.js Integration

```tsx
// pages/editor.tsx
import dynamic from 'next/dynamic'
import { useState } from 'react'

// Dynamically import to avoid SSR issues
const FlyCutCaption = dynamic(
  () => import('@flycut/caption-react').then(mod => mod.FlyCutCaption),
  { ssr: false }
)

export default function EditorPage() {
  return (
    <div style={{ height: '100vh' }}>
      <FlyCutCaption
        config={{
          theme: 'auto',
          language: 'zh'
        }}
        onVideoProcessed={(blob, filename) => {
          // Handle video processing result
          const url = URL.createObjectURL(blob)
          window.open(url, '_blank')
        }}
      />
    </div>
  )
}
```

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@huggingface/transformers']
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  }
})
```

### Best Practices

1. **Always import styles**: The component requires CSS to work properly
2. **Handle errors gracefully**: Implement proper error boundaries and user feedback
3. **Optimize for performance**: Use dynamic imports for SSR applications
4. **Provide user feedback**: Show loading states and progress indicators
5. **Responsive design**: Ensure your container has appropriate height/width
6. **Accessibility**: The component includes ARIA labels and keyboard navigation
7. **Memory management**: Clean up blob URLs when components unmount

### Common Integration Patterns

```tsx
// With error boundary
import { ErrorBoundary } from 'react-error-boundary'

function EditorWithErrorBoundary() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong with the video editor</div>}>
      <FlyCutCaption />
    </ErrorBoundary>
  )
}

// With loading state
function EditorWithLoading() {
  const [isReady, setIsReady] = useState(false)

  if (!isReady) {
    return <div>Loading video editor...</div>
  }

  return (
    <FlyCutCaption
      onReady={() => setIsReady(true)}
    />
  )
}

// With custom container
function ResponsiveEditor() {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
        <FlyCutCaption />
      </div>
    </div>
  )
}
```

## 🔧 Development

### Prerequisites

- Node.js 18+
- pnpm 8+

### Setup

```bash
git clone https://github.com/your-username/fly-cut-caption.git
cd fly-cut-caption
pnpm install
```

### Development

```bash
# Start development server
pnpm dev

# Build library
pnpm run build:lib

# Build demo
pnpm run build:demo

# Lint code
pnpm lint

# Run test app
cd test-app && pnpm dev
```

## 📄 License

MIT © [FlyCut Team](https://github.com/your-username/fly-cut-caption)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

- 📧 Email: support@flycut.dev
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/fly-cut-caption/issues)
- 📖 Documentation: [API Docs](https://flycut.dev/docs)

---

Made with ❤️ by the FlyCut Team
