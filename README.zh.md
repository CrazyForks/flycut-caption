# FlyCut Caption - 智能视频字幕裁剪工具

<div align="center">

![FlyCut Caption](screenshots/complete-subtitle-editing-interface.png)

一个强大的 AI 驱动的视频字幕编辑工具，专注于智能字幕生成、编辑和视频裁剪。

[English](README.md) | [中文](README.zh.md)

</div>

## ✨ 功能特色

### 🎯 核心功能
- **🎤 智能语音识别**：基于 Whisper 模型的高精度语音转文字，支持多种语言
- **✂️ 可视化字幕编辑**：直观的字幕片段选择和删除界面
- **🎬 实时视频预览**：与字幕同步的视频播放器，支持区间播放
- **📤 多格式导出**：支持 SRT、JSON 字幕格式以及视频文件导出
- **🎨 字幕样式定制**：自定义字幕字体、颜色、位置等样式
- **🌐 国际化支持**：组件化国际化设计，支持中文、英文、自定义语言包（如日语示例）

### 🔧 技术特色
- **⚡ 现代化技术栈**：React 19 + TypeScript + Vite + Tailwind CSS
- **🧠 本地 AI 处理**：使用 Hugging Face Transformers.js 在浏览器本地运行 AI 模型
- **🎯 Web Workers**：ASR 处理在后台线程运行，不阻塞主界面
- **📱 响应式设计**：适配不同屏幕尺寸的现代化界面
- **🎪 组件化架构**：模块化设计，易于维护和扩展

## 🚀 快速开始

### 环境要求
- Node.js 18+
- pnpm (推荐) 或 npm

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/fly-cut-caption.git
cd fly-cut-caption
```

2. **安装依赖**
```bash
pnpm install
```

3. **启动开发服务器**
```bash
pnpm dev
```

4. **打开浏览器**
```
http://localhost:5173
```

### 构建生产版本
```bash
# 构建项目
pnpm build

# 预览构建结果
pnpm preview
```

## 📋 使用指南

### 1. 上传视频文件
- 支持格式：MP4, WebM, AVI, MOV
- 支持音频：MP3, WAV, OGG
- 拖拽文件到上传区域或点击选择文件

![文件上传界面](screenshots/flycut-caption-main-interface.png)

上传完成后，进入ASR配置界面：

![ASR 设置界面](screenshots/asr-setup-interface.png)

### 2. 生成字幕
- 选择识别语言（支持中文、英文等多种语言）
- 点击开始识别，AI 将自动生成带时间戳的字幕
- 识别过程在后台进行，不影响界面操作

![ASR 处理界面](screenshots/asr-processing-interface.png)

### 3. 编辑字幕
- **选择片段**：在字幕列表中选择要删除的片段
- **批量操作**：支持全选、批量删除、恢复删除等操作
- **实时预览**：点击字幕片段可跳转到对应时间点
- **历史记录**：支持撤销/重做操作

![字幕编辑界面](screenshots/complete-subtitle-editing-interface.png)

### 4. 视频预览
- **预览模式**：自动跳过删除的片段，预览最终效果
- **快捷键支持**：
  - `空格`：播放/暂停
  - `←/→`：快退/快进 5 秒
  - `Shift + ←/→`：快退/快进 10 秒
  - `↑/↓`：调节音量
  - `M`：静音/取消静音
  - `F`：全屏

### 5. 字幕样式
- **字体设置**：字体大小、粗细、颜色
- **位置调整**：字幕显示位置、对齐方式
- **背景样式**：背景颜色、透明度、边框
- **实时预览**：所见即所得的样式调整

### 6. 导出结果
- **字幕导出**：SRT 格式（通用字幕格式）、JSON 格式
- **视频导出**：
  - 仅保留未删除的片段
  - 可选择烧录字幕到视频
  - 支持不同质量设置
  - 多种格式输出

## 🌐 国际化设计

FlyCut Caption 采用组件化国际化设计，支持灵活的语言包管理和实时语言切换。

### 支持的语言
- **中文（简体）**：内置语言包，完整翻译
- **英文（美式）**：内置语言包，完整翻译
- **自定义语言**：支持添加任意语言包（提供日语示例）

### 组件化国际化特性
- **自动同步**：外部语言切换自动同步到内部组件
- **类型安全**：完整的 TypeScript 类型定义
- **按需加载**：语言包可按需导入
- **扩展性强**：支持自定义语言包和动态注册

### 使用示例

#### 基础用法
```tsx
import { FlyCutCaption, zhCN, enUS } from '@flycut/caption-react'

// 使用中文语言包
<FlyCutCaption
  config={{ language: 'zh' }}
  locale={zhCN}
/>

// 使用英文语言包
<FlyCutCaption
  config={{ language: 'en' }}
  locale={enUS}
/>
```

#### 自定义语言包
```tsx
import { FlyCutCaption, type FlyCutCaptionLocale } from '@flycut/caption-react'

// 创建日语语言包示例
const customJaJP: FlyCutCaptionLocale = {
  common: {
    loading: '読み込み中...',
    error: 'エラー',
    success: '成功',
    // ... 更多通用翻译
  },
  components: {
    fileUpload: {
      dragDropText: 'ビデオファイルをここにドラッグするか、クリックして選択',
      selectFile: 'ファイルを選択',
      // ... 更多组件翻译
    },
    // ... 其他组件翻译
  },
  messages: {
    // ... 消息翻译
  }
}

// 使用自定义语言包
<FlyCutCaption
  config={{ language: 'ja' }}
  locale={customJaJP}
/>
```

#### 动态语言切换
```tsx
import { useState } from 'react'
import { FlyCutCaption, zhCN, enUS } from '@flycut/caption-react'

function App() {
  const [currentLanguage, setCurrentLanguage] = useState('zh')
  const [currentLocale, setCurrentLocale] = useState(undefined)

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language)

    // 根据语言设置相应的语言包
    switch (language) {
      case 'zh':
        setCurrentLocale(zhCN)
        break
      case 'en':
        setCurrentLocale(enUS)
        break
      case 'ja':
        setCurrentLocale(customJaJP)
        break
      default:
        setCurrentLocale(undefined) // 使用默认语言包
    }
  }

  return (
    <div>
      {/* 外部语言切换按钮 */}
      <div>
        <button onClick={() => handleLanguageChange('zh')}>中文</button>
        <button onClick={() => handleLanguageChange('en')}>English</button>
        <button onClick={() => handleLanguageChange('ja')}>日本語</button>
      </div>

      {/* FlyCut Caption 组件 */}
      <FlyCutCaption
        config={{
          language: currentLanguage,
          enableLanguageSelector: true // 内部语言选择器会自动同步
        }}
        locale={currentLocale}
        onLanguageChange={handleLanguageChange} // 内部变化同步到外部状态
      />
    </div>
  )
}
```

### 语言包结构
```typescript
interface FlyCutCaptionLocale {
  common: {
    loading: string
    error: string
    success: string
    // ... 更多通用字段
  }
  components: {
    fileUpload: {
      dragDropText: string
      selectFile: string
      // ... 更多文件上传字段
    }
    subtitleEditor: {
      title: string
      addSubtitle: string
      // ... 更多字幕编辑器字段
    }
    // ... 其他组件
  }
  messages: {
    fileUpload: {
      uploadSuccess: string
      uploadFailed: string
      // ... 更多消息字段
    }
    // ... 其他消息类型
  }
}
```

📚 **详细国际化指南**：查看 [INTERNATIONALIZATION.md](./INTERNATIONALIZATION.md) 了解完整的语言包、自定义本地化和高级国际化功能文档。

## 🏗️ 项目架构

### 技术栈
- **前端框架**：React 19 with Hooks
- **类型检查**：TypeScript 5.8
- **构建工具**：Vite 7.1
- **样式方案**：Tailwind CSS 4.1 + Shadcn/ui
- **状态管理**：Zustand + React Context
- **AI 模型**：Hugging Face Transformers.js
- **视频处理**：WebAV
- **国际化**：react-i18next

### 项目结构
```
src/
├── components/          # UI 组件
│   ├── FileUpload/     # 文件上传组件
│   ├── VideoPlayer/    # 视频播放器
│   ├── SubtitleEditor/ # 字幕编辑器
│   ├── ProcessingPanel/ # 处理面板
│   ├── ExportPanel/    # 导出面板
│   └── ui/             # 基础 UI 组件
├── hooks/              # 自定义 Hooks
├── services/           # 业务服务层
│   ├── asrService.ts   # ASR 语音识别服务
│   └── UnifiedVideoProcessor.ts # 视频处理服务
├── stores/             # 状态管理
│   ├── appStore.ts     # 应用全局状态
│   ├── historyStore.ts # 字幕历史记录
│   └── themeStore.ts   # 主题状态
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
├── workers/            # Web Workers
│   └── asrWorker.ts    # ASR 处理工作线程
└── locales/            # 国际化文件
```

### 核心模块

#### ASR 语音识别
- 基于 Whisper 模型的本地语音识别
- Web Workers 后台处理，不阻塞主线程
- 支持多种语言和音频格式
- 生成精确的字级时间戳

#### 字幕编辑器
- 可视化的字幕片段管理
- 支持批量选择和操作
- 实时同步视频播放位置
- 历史记录和撤销/重做功能

#### 视频处理
- 基于 WebAV 的本地视频处理
- 支持区间裁剪和合并
- 字幕烧录功能
- 多种输出格式和质量选项

## 🛠️ 开发指南

### 开发命令
```bash
# 启动开发服务器
pnpm dev

# 类型检查
pnpm run typecheck

# 代码检查
pnpm lint

# 构建项目
pnpm build

# 预览构建
pnpm preview
```

### 添加新组件
项目使用 Shadcn/ui 组件库：
```bash
pnpm dlx shadcn@latest add <component-name>
```

### 代码规范
- TypeScript 严格模式
- ESLint + React 相关规则
- 函数式组件 + Hooks
- 组件化和模块化设计

## 🤝 贡献指南

我们欢迎各种形式的贡献！

### 如何贡献
1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 贡献类型
- 🐛 Bug 修复
- ✨ 新功能开发
- 📝 文档改进
- 🎨 UI/UX 优化
- ⚡ 性能优化
- 🌐 国际化翻译

## 📝 许可证

本项目采用 MIT 许可证，但有以下额外条款：

- ✅ **允许**：个人、教育、商业用途
- ✅ **允许**：修改、分发、创建衍生作品
- ❌ **禁止**：移除或修改软件界面中的 Logo、水印、品牌元素
- ❌ **禁止**：隐藏或篡改归属声明

如需移除品牌元素，请联系 FlyCut Team 获得明确的书面许可。

详情请参阅 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [Hugging Face](https://huggingface.co/) - 提供优秀的 Transformers.js 库
- [OpenAI Whisper](https://openai.com/research/whisper) - 强大的语音识别模型
- [Shadcn/ui](https://ui.shadcn.com/) - 优雅的 UI 组件库
- [WebAV](https://github.com/hughfenghen/WebAV) - 强大的 Web 音视频处理库

## 📞 联系我们

- 项目主页: [GitHub Repository](https://github.com/your-username/fly-cut-caption)
- 问题反馈: [GitHub Issues](https://github.com/your-username/fly-cut-caption/issues)
- 功能建议: [GitHub Discussions](https://github.com/your-username/fly-cut-caption/discussions)

---

<div align="center">

**如果这个项目对你有帮助，请给我们一个 ⭐ Star！**

Made with ❤️ by FlyCut Team

</div>