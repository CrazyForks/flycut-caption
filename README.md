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

## 📖 API Reference

### FlyCutCaptionProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `undefined` | Custom CSS class name |
| `style` | `CSSProperties` | `undefined` | Custom inline styles |
| `config` | `FlyCutCaptionConfig` | `defaultConfig` | Component configuration |
| `onReady` | `() => void` | `undefined` | Called when component is ready |
| `onFileSelected` | `(file: File) => void` | `undefined` | Called when a file is selected |
| `onSubtitleGenerated` | `(subtitles: SubtitleChunk[]) => void` | `undefined` | Called when subtitles are generated |
| `onSubtitleChanged` | `(subtitles: SubtitleChunk[]) => void` | `undefined` | Called when subtitles are changed |
| `onVideoProcessed` | `(blob: Blob, filename: string) => void` | `undefined` | Called when video processing is complete |
| `onExportComplete` | `(blob: Blob, filename: string) => void` | `undefined` | Called when export is complete |
| `onError` | `(error: Error) => void` | `undefined` | Called when an error occurs |
| `onProgress` | `(stage: string, progress: number) => void` | `undefined` | Called to report progress updates |

### FlyCutCaptionConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Theme mode |
| `language` | `string` | `'zh-CN'` | Interface language |
| `asrLanguage` | `string` | `'auto'` | ASR recognition language |
| `enableDragDrop` | `boolean` | `true` | Enable drag and drop file upload |
| `enableExport` | `boolean` | `true` | Enable export functionality |
| `enableVideoProcessing` | `boolean` | `true` | Enable video processing functionality |
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

The component supports multiple languages:

- **Chinese (zh-CN)** - Default
- **English (en-US)**

```tsx
<FlyCutCaption
  config={{
    language: 'en-US', // Switch to English
    asrLanguage: 'en'  // English ASR
  }}
/>
```

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
