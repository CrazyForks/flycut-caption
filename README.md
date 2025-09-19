# FlyCut Caption - Intelligent Video Subtitle Trimming Tool

<div align="center">

![FlyCut Caption](screenshots/complete-subtitle-editing-interface.png)

A powerful AI-driven video subtitle editing tool focused on intelligent subtitle generation, editing, and video trimming.

[English](README.md) | [中文](README.zh.md)

</div>

## ✨ Features

### 🎯 Core Functionality
- **🎤 Intelligent Speech Recognition**: High-precision speech-to-text based on Whisper model, supporting multiple languages
- **✂️ Visual Subtitle Editing**: Intuitive subtitle segment selection and deletion interface
- **🎬 Real-time Video Preview**: Video player synchronized with subtitles, supporting interval playback
- **📤 Multi-format Export**: Support for SRT, JSON subtitle formats and video file export
- **🎨 Subtitle Style Customization**: Custom subtitle fonts, colors, positions, and more
- **🌐 Internationalization**: Support for Chinese and English interface switching

### 🔧 Technical Features
- **⚡ Modern Tech Stack**: React 19 + TypeScript + Vite + Tailwind CSS
- **🧠 Local AI Processing**: Using Hugging Face Transformers.js to run AI models locally in browser
- **🎯 Web Workers**: ASR processing runs in background threads without blocking main UI
- **📱 Responsive Design**: Modern interface adapted to different screen sizes
- **🎪 Component Architecture**: Modular design, easy to maintain and extend

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. **Clone the project**
```bash
git clone https://github.com/your-username/fly-cut-caption.git
cd fly-cut-caption
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Start development server**
```bash
pnpm dev
```

4. **Open browser**
```
http://localhost:5173
```

### Build for production
```bash
# Build project
pnpm build

# Preview build
pnpm preview
```

## 📋 User Guide

### 1. Upload Video File
- Supported formats: MP4, WebM, AVI, MOV
- Audio support: MP3, WAV, OGG
- Drag files to upload area or click to select files

![File Upload Interface](screenshots/flycut-caption-main-interface.png)

After uploading, enter the ASR configuration interface:

![ASR Setup Interface](screenshots/asr-setup-interface.png)

### 2. Generate Subtitles
- Select recognition language (supports Chinese, English, and many other languages)
- Click start recognition, AI will automatically generate timestamped subtitles
- Recognition process runs in background without affecting UI operations

![ASR Processing Interface](screenshots/asr-processing-interface.png)

### 3. Edit Subtitles
- **Select segments**: Choose segments to delete in the subtitle list
- **Batch operations**: Support select all, batch delete, restore deleted, etc.
- **Real-time preview**: Click subtitle segments to jump to corresponding time points
- **History**: Support undo/redo operations

![Subtitle Editing Interface](screenshots/complete-subtitle-editing-interface.png)

### 4. Video Preview
- **Preview mode**: Automatically skip deleted segments to preview final result
- **Keyboard shortcuts**:
  - `Space`: Play/Pause
  - `←/→`: Rewind/Fast forward 5 seconds
  - `Shift + ←/→`: Rewind/Fast forward 10 seconds
  - `↑/↓`: Adjust volume
  - `M`: Mute/Unmute
  - `F`: Fullscreen

### 5. Subtitle Styling
- **Font settings**: Font size, weight, color
- **Position adjustment**: Subtitle display position, alignment
- **Background style**: Background color, transparency, border
- **Real-time preview**: WYSIWYG style adjustment

### 6. Export Results
- **Subtitle export**: SRT format (universal subtitle format), JSON format
- **Video export**:
  - Keep only non-deleted segments
  - Optional subtitle burning to video
  - Different quality settings available
  - Multiple output formats

## 🏗️ Project Architecture

### Tech Stack
- **Frontend Framework**: React 19 with Hooks
- **Type Checking**: TypeScript 5.8
- **Build Tool**: Vite 7.1
- **Styling**: Tailwind CSS 4.1 + Shadcn/ui
- **State Management**: Zustand + React Context
- **AI Model**: Hugging Face Transformers.js
- **Video Processing**: WebAV
- **Internationalization**: react-i18next

### Project Structure
```
src/
├── components/          # UI Components
│   ├── FileUpload/     # File upload component
│   ├── VideoPlayer/    # Video player
│   ├── SubtitleEditor/ # Subtitle editor
│   ├── ProcessingPanel/ # Processing panel
│   ├── ExportPanel/    # Export panel
│   └── ui/             # Basic UI components
├── hooks/              # Custom Hooks
├── services/           # Business service layer
│   ├── asrService.ts   # ASR speech recognition service
│   └── UnifiedVideoProcessor.ts # Video processing service
├── stores/             # State management
│   ├── appStore.ts     # Global app state
│   ├── historyStore.ts # Subtitle history
│   └── themeStore.ts   # Theme state
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── workers/            # Web Workers
│   └── asrWorker.ts    # ASR processing worker thread
└── locales/            # Internationalization files
```

### Core Modules

#### ASR Speech Recognition
- Local speech recognition based on Whisper model
- Web Workers background processing without blocking main thread
- Support for multiple languages and audio formats
- Generate precise word-level timestamps

#### Subtitle Editor
- Visual subtitle segment management
- Support for batch selection and operations
- Real-time video playback position synchronization
- History and undo/redo functionality

#### Video Processing
- Local video processing based on WebAV
- Support for interval trimming and merging
- Subtitle burning functionality
- Multiple output formats and quality options

## 🛠️ Development Guide

### Development Commands
```bash
# Start development server
pnpm dev

# Type checking
pnpm run typecheck

# Code linting
pnpm lint

# Build project
pnpm build

# Preview build
pnpm preview
```

### Adding New Components
The project uses Shadcn/ui component library:
```bash
pnpm dlx shadcn@latest add <component-name>
```

### Code Standards
- TypeScript strict mode
- ESLint + React-related rules
- Functional components + Hooks
- Component and modular design

## 🤝 Contributing

We welcome contributions of all kinds!

### How to Contribute
1. Fork this project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

### Contribution Types
- 🐛 Bug fixes
- ✨ New feature development
- 📝 Documentation improvements
- 🎨 UI/UX optimization
- ⚡ Performance optimization
- 🌐 Internationalization translation

## 📝 License

This project is licensed under the MIT License with additional terms:

- ✅ **Allowed**: Personal, educational, commercial use
- ✅ **Allowed**: Modification, distribution, creating derivative works
- ❌ **Prohibited**: Removing or modifying logos, watermarks, branding elements in the software interface
- ❌ **Prohibited**: Hiding or tampering with attribution notices

If you wish to remove branding elements, please contact FlyCut Team for explicit written permission.

See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Hugging Face](https://huggingface.co/) - For providing the excellent Transformers.js library
- [OpenAI Whisper](https://openai.com/research/whisper) - Powerful speech recognition model
- [Shadcn/ui](https://ui.shadcn.com/) - Elegant UI component library
- [WebAV](https://github.com/hughfenghen/WebAV) - Powerful Web audio/video processing library

## 📞 Contact Us

- Project Homepage: [GitHub Repository](https://github.com/your-username/fly-cut-caption)
- Bug Reports: [GitHub Issues](https://github.com/your-username/fly-cut-caption/issues)
- Feature Requests: [GitHub Discussions](https://github.com/your-username/fly-cut-caption/discussions)

---

<div align="center">

**If this project helps you, please give us a ⭐ Star!**

Made with ❤️ by FlyCut Team

</div>
