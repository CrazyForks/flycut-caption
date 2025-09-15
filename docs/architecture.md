# FlyCut Caption 技术架构

## 🏗️ 整体架构设计

### 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                    FlyCut Caption Desktop App                   │
├─────────────────────────────────────────────────────────────────┤
│                      前端层 (React)                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │   UI 组件    │ │   状态管理   │ │   业务逻辑   │            │
│  │ Shadcn/ui   │ │   Zustand   │ │   Hooks     │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│                    通信层 (Tauri IPC)                          │
├─────────────────────────────────────────────────────────────────┤
│                     后端层 (Rust)                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │  AI 处理模块  │ │ 视频处理模块  │ │ 文件系统模块  │            │
│  │ whisper.cpp │ │   FFmpeg    │ │  File APIs  │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│                     系统资源层                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │   GPU 加速   │ │   本地存储   │ │   系统 API   │            │
│  │ CUDA/Metal  │ │   Models    │ │  Notifications│            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## 🎨 前端架构 (保持不变)

### 组件层次结构

```
App.tsx
├── FileUpload/                 # 文件上传组件
├── ProcessingPanel/            # 处理面板
│   ├── ASRPanel               # ASR 识别面板
│   └── LanguageSelector       # 语言选择器
├── VideoPlayer/               # 视频播放器
│   └── EnhancedVideoPlayer    # 增强视频播放器
├── SubtitleEditor/            # 字幕编辑器
│   ├── SubtitleList          # 字幕列表
│   └── SubtitleItem          # 字幕项
├── ExportPanel/               # 导出面板
└── MessageCenter/             # 消息中心
    ├── MessageCard           # 消息卡片
    └── ToastContainer        # 通知容器
```

### 状态管理架构

```typescript
// Zustand Stores
├── appStore.ts                # 应用全局状态
├── historyStore.ts            # 字幕历史管理
├── themeStore.ts              # 主题管理
└── messageStore.ts            # 消息管理
```

### 核心 Hooks

```typescript
├── useHotkeys.ts              # 热键管理
├── useASR.ts                  # ASR 处理 (需要适配)
└── useVideoProcessing.ts      # 视频处理 (需要适配)
```

## 🦀 后端架构 (Tauri + Rust)

### 项目结构

```
src-tauri/
├── Cargo.toml                 # Rust 依赖配置
├── tauri.conf.json            # Tauri 配置
├── src/
│   ├── main.rs               # 应用入口
│   ├── commands/             # Tauri 命令模块
│   │   ├── mod.rs
│   │   ├── asr.rs            # ASR 相关命令
│   │   ├── video.rs          # 视频处理命令
│   │   └── file.rs           # 文件操作命令
│   ├── services/             # 业务服务层
│   │   ├── mod.rs
│   │   ├── whisper_service.rs # Whisper 服务
│   │   ├── ffmpeg_service.rs  # FFmpeg 服务
│   │   └── cache_service.rs   # 缓存服务
│   ├── models/               # 数据模型
│   │   ├── mod.rs
│   │   ├── transcript.rs     # 转录数据模型
│   │   └── video.rs          # 视频数据模型
│   └── utils/                # 工具函数
│       ├── mod.rs
│       ├── path_utils.rs     # 路径处理
│       └── config.rs         # 配置管理
├── models/                   # AI 模型存储
│   ├── whisper-base.bin
│   ├── whisper-small.bin
│   └── whisper-medium.bin
└── binaries/                 # 外部二进制文件
    ├── ffmpeg
    └── ffprobe
```

### 核心服务模块

#### 1. ASR 服务模块

```rust
// src-tauri/src/services/whisper_service.rs
use whisper_rs::{FullParams, SamplingStrategy, WhisperContext};

pub struct WhisperService {
    context: WhisperContext,
    model_path: PathBuf,
}

impl WhisperService {
    pub fn new(model_path: PathBuf) -> Result<Self, WhisperError> {
        let context = WhisperContext::new(&model_path)?;
        Ok(Self { context, model_path })
    }

    pub async fn transcribe(
        &self,
        audio_path: &str,
        language: Option<&str>,
    ) -> Result<TranscriptResult, WhisperError> {
        // Whisper 转录实现
        let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });
        
        if let Some(lang) = language {
            params.set_language(Some(lang));
        }
        
        // 执行转录
        let result = self.context.full(params, audio_samples)?;
        
        // 转换为前端需要的格式
        Ok(self.convert_to_transcript_result(result))
    }
}
```

#### 2. 视频处理服务

```rust
// src-tauri/src/services/ffmpeg_service.rs
use std::process::Command;

pub struct FFmpegService {
    ffmpeg_path: PathBuf,
}

impl FFmpegService {
    pub fn new(ffmpeg_path: PathBuf) -> Self {
        Self { ffmpeg_path }
    }

    pub async fn export_video(
        &self,
        input: &str,
        segments: &[TimeSegment],
        output: &str,
        quality: VideoQuality,
    ) -> Result<String, FFmpegError> {
        // 构建 FFmpeg 命令
        let mut cmd = Command::new(&self.ffmpeg_path);
        
        // 添加输入文件
        cmd.arg("-i").arg(input);
        
        // 添加片段过滤器
        let filter = self.build_segment_filter(segments);
        cmd.arg("-vf").arg(filter);
        
        // 添加质量设置
        self.apply_quality_settings(&mut cmd, quality);
        
        // 输出文件
        cmd.arg(output);
        
        // 执行命令
        let output = cmd.output().await?;
        
        if output.status.success() {
            Ok(output.to_string())
        } else {
            Err(FFmpegError::ProcessingFailed(
                String::from_utf8_lossy(&output.stderr).to_string()
            ))
        }
    }

    fn build_segment_filter(&self, segments: &[TimeSegment]) -> String {
        // 构建复杂的 FFmpeg 过滤器
        // 例如: "select='between(t,0,10)+between(t,15,25)',setpts=N/FRAME_RATE/TB"
        segments.iter()
            .map(|seg| format!("between(t,{},{})", seg.start, seg.end))
            .collect::<Vec<_>>()
            .join("+")
    }
}
```

### Tauri 命令接口

```rust
// src-tauri/src/commands/asr.rs
use crate::services::WhisperService;

#[tauri::command]
pub async fn transcribe_audio(
    audio_path: String,
    model: String,
    language: Option<String>,
    app_handle: tauri::AppHandle,
) -> Result<TranscriptResult, String> {
    let whisper_service = app_handle.state::<WhisperService>();
    
    whisper_service
        .transcribe(&audio_path, language.as_deref())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_available_models() -> Result<Vec<ModelInfo>, String> {
    // 获取可用模型列表
    Ok(vec![
        ModelInfo { name: "base".to_string(), size: "74MB".to_string() },
        ModelInfo { name: "small".to_string(), size: "244MB".to_string() },
        ModelInfo { name: "medium".to_string(), size: "769MB".to_string() },
    ])
}

#[tauri::command]
pub async fn download_model(
    model_name: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    // 模型下载逻辑
    // 支持进度回调到前端
    Ok(())
}
```

## 🔄 前后端通信

### IPC 通信模式

```typescript
// 前端调用后端
import { invoke } from '@tauri-apps/api/tauri';

// ASR 转录
const result = await invoke<TranscriptResult>('transcribe_audio', {
  audioPath: file.path,
  model: 'base',
  language: 'zh'
});

// 视频导出
const outputPath = await invoke<string>('export_video', {
  inputPath: video.path,
  segments: keptSegments,
  outputPath: savePath,
  quality: 'high'
});

// 进度监听
import { listen } from '@tauri-apps/api/event';

await listen('transcription-progress', (event) => {
  console.log('Progress:', event.payload);
});
```

### 事件系统

```rust
// 后端发送进度事件
use tauri::Manager;

pub async fn transcribe_with_progress(
    app_handle: tauri::AppHandle,
    audio_path: String,
) -> Result<TranscriptResult, String> {
    let window = app_handle.get_window("main").unwrap();
    
    // 发送进度更新
    window.emit("transcription-progress", ProgressPayload {
        current: 50,
        total: 100,
        message: "Processing audio...".to_string(),
    }).unwrap();
    
    // 继续处理...
    Ok(result)
}
```

## 📦 资源管理

### 模型缓存策略

```
~/.flycut-caption/
├── models/
│   ├── whisper-base.bin
│   ├── whisper-small.bin
│   └── whisper-medium.bin
├── cache/
│   ├── audio-extracts/
│   └── temp-videos/
└── config.json
```

### 配置管理

```rust
// src-tauri/src/utils/config.rs
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Default)]
pub struct AppConfig {
    pub preferred_model: String,
    pub output_quality: String,
    pub cache_dir: PathBuf,
    pub hardware_acceleration: bool,
}

impl AppConfig {
    pub fn load() -> Result<Self, ConfigError> {
        let config_path = Self::config_path()?;
        if config_path.exists() {
            let content = std::fs::read_to_string(config_path)?;
            Ok(serde_json::from_str(&content)?)
        } else {
            Ok(Self::default())
        }
    }

    pub fn save(&self) -> Result<(), ConfigError> {
        let config_path = Self::config_path()?;
        let content = serde_json::to_string_pretty(self)?;
        std::fs::write(config_path, content)?;
        Ok(())
    }
}
```

## 🔧 性能优化策略

### 1. 并发处理

```rust
// 使用 Tokio 异步运行时
use tokio::task;

pub async fn process_multiple_segments(
    segments: Vec<TimeSegment>
) -> Result<Vec<ProcessedSegment>, ProcessingError> {
    let tasks = segments.into_iter()
        .map(|segment| {
            task::spawn(async move {
                process_single_segment(segment).await
            })
        })
        .collect::<Vec<_>>();

    let results = futures::future::try_join_all(tasks).await?;
    Ok(results)
}
```

### 2. 内存管理

```rust
// 流式处理大文件
use tokio::fs::File;
use tokio::io::{AsyncReadExt, BufReader};

pub async fn process_large_video(
    input_path: &str,
    chunk_size: usize,
) -> Result<(), ProcessingError> {
    let file = File::open(input_path).await?;
    let mut reader = BufReader::new(file);
    let mut buffer = vec![0; chunk_size];
    
    while reader.read_exact(&mut buffer).await.is_ok() {
        // 分块处理视频数据
        process_chunk(&buffer).await?;
    }
    
    Ok(())
}
```

### 3. 缓存策略

```rust
use std::collections::HashMap;
use tokio::sync::RwLock;

pub struct CacheService {
    cache: RwLock<HashMap<String, CachedResult>>,
    max_size: usize,
}

impl CacheService {
    pub async fn get_or_compute<T, F>(
        &self,
        key: &str,
        compute_fn: F,
    ) -> Result<T, CacheError>
    where
        F: Future<Output = Result<T, CacheError>>,
        T: Clone + Serialize + DeserializeOwned,
    {
        // 先检查缓存
        {
            let cache = self.cache.read().await;
            if let Some(cached) = cache.get(key) {
                if !cached.is_expired() {
                    return Ok(cached.data.clone());
                }
            }
        }
        
        // 计算结果
        let result = compute_fn.await?;
        
        // 存入缓存
        {
            let mut cache = self.cache.write().await;
            cache.insert(key.to_string(), CachedResult::new(result.clone()));
        }
        
        Ok(result)
    }
}
```

## 🚀 部署架构

### 构建管道

```yaml
# .github/workflows/build.yml
name: Build and Release
on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          
      - name: Install dependencies
        run: |
          pnpm install
          
      - name: Build application
        run: |
          pnpm tauri build
          
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: app-${{ matrix.os }}
          path: src-tauri/target/release/bundle/
```

### 自动更新机制

```rust
// src-tauri/src/commands/update.rs
use tauri_plugin_updater::UpdaterExt;

#[tauri::command]
pub async fn check_for_updates(app: tauri::AppHandle) -> Result<UpdateInfo, String> {
    let updater = app.updater();
    
    match updater.check().await {
        Ok(Some(update)) => {
            Ok(UpdateInfo {
                available: true,
                version: update.version,
                notes: update.body.unwrap_or_default(),
                download_url: update.download_url,
            })
        }
        Ok(None) => Ok(UpdateInfo::no_update()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
    let updater = app.updater();
    
    if let Some(update) = updater.check().await.map_err(|e| e.to_string())? {
        update.download_and_install().await.map_err(|e| e.to_string())?;
    }
    
    Ok(())
}
```

这个架构设计确保了：
- **前端零改动**: 现有 React 代码完全保留
- **高性能**: 本地处理 + 硬件加速
- **可维护性**: 清晰的模块化设计
- **可扩展性**: 插件化的服务架构
- **用户体验**: 原生应用级别的体验