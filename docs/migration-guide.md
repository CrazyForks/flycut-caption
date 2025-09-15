# FlyCut Caption 本地化迁移指南

## 📋 迁移概述

本指南详细说明如何将 FlyCut Caption 从 Web 应用迁移到 Tauri 桌面应用，实现本地化 AI 处理和视频处理。

## 🎯 迁移目标

- **零重构**: 前端 React 代码 100% 保留
- **性能提升**: ASR 和视频处理速度提升 10-50 倍
- **用户体验**: 原生桌面应用体验
- **离线使用**: 完全本地化处理

## 🛣️ 迁移路线图

### Phase 1: 基础桌面化 (2-3 周)

#### 1.1 Tauri 项目初始化

```bash
# 1. 安装 Tauri CLI
cargo install tauri-cli

# 2. 初始化 Tauri 项目
pnpm tauri init
```

#### 1.2 项目配置

**tauri.conf.json 配置**:
```json
{
  "package": {
    "productName": "FlyCut Caption",
    "version": "1.0.0"
  },
  "build": {
    "distDir": "../dist",
    "devPath": "http://localhost:5175",
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "fs": {
        "all": true,
        "scope": ["$APPDATA", "$AUDIO", "$VIDEO", "$DESKTOP", "$DOCUMENT"]
      },
      "dialog": {
        "all": true
      },
      "shell": {
        "all": false,
        "open": true
      },
      "notification": {
        "all": true
      }
    },
    "bundle": {
      "active": true,
      "targets": ["deb", "appimage", "msi", "app", "dmg"],
      "identifier": "com.flycut.caption",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "fullscreen": false,
        "height": 800,
        "resizable": true,
        "title": "FlyCut Caption",
        "width": 1200,
        "minWidth": 800,
        "minHeight": 600
      }
    ]
  }
}
```

#### 1.3 基础文件操作迁移

**前端 API 适配**:
```typescript
// src/services/fileService.ts
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';

// 文件选择 (替换 HTML input file)
export async function selectVideoFile(): Promise<string | null> {
  const selected = await open({
    multiple: false,
    filters: [{
      name: 'Video',
      extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm']
    }]
  });
  
  return typeof selected === 'string' ? selected : null;
}

// 文件保存
export async function saveVideo(content: Uint8Array): Promise<string | null> {
  return await invoke('save_video_file', { content });
}
```

**Rust 后端实现**:
```rust
// src-tauri/src/commands/file.rs
use tauri::{command, api::dialog::FileDialogBuilder};
use std::path::PathBuf;

#[command]
pub async fn save_video_file(
    content: Vec<u8>,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    let save_path = FileDialogBuilder::new()
        .set_title("保存视频")
        .add_filter("视频文件", &["mp4", "mov"])
        .save_file()
        .await;
    
    if let Some(path) = save_path {
        std::fs::write(&path, content)
            .map_err(|e| format!("保存失败: {}", e))?;
        Ok(path.to_string_lossy().to_string())
    } else {
        Err("用户取消保存".to_string())
    }
}

#[command]
pub async fn get_file_info(path: String) -> Result<FileInfo, String> {
    let metadata = std::fs::metadata(&path)
        .map_err(|e| format!("获取文件信息失败: {}", e))?;
    
    Ok(FileInfo {
        size: metadata.len(),
        modified: metadata.modified().unwrap_or(SystemTime::UNIX_EPOCH),
        path,
    })
}
```

### Phase 2: AI 本地化 (1-2 周)

#### 2.1 Whisper.cpp 集成

**Cargo.toml 依赖**:
```toml
[dependencies]
whisper-rs = "0.10"
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
```

#### 2.2 ASR 服务实现

```rust
// src-tauri/src/services/whisper_service.rs
use whisper_rs::{FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters};
use std::path::PathBuf;
use tokio::sync::Mutex;

pub struct WhisperService {
    context: Mutex<WhisperContext>,
    model_path: PathBuf,
}

impl WhisperService {
    pub fn new(model_path: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        let ctx_params = WhisperContextParameters::default();
        let context = WhisperContext::new_with_params(&model_path, ctx_params)?;
        
        Ok(Self {
            context: Mutex::new(context),
            model_path,
        })
    }

    pub async fn transcribe(
        &self,
        audio_data: Vec<f32>,
        language: Option<String>,
        progress_callback: Option<fn(i32)>,
    ) -> Result<TranscriptResult, Box<dyn std::error::Error>> {
        let context = self.context.lock().await;
        
        let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });
        
        // 设置语言
        if let Some(lang) = language {
            params.set_language(Some(&lang));
        }
        
        // 设置其他参数
        params.set_translate(false);
        params.set_print_special(false);
        params.set_print_progress(false);
        params.set_print_realtime(false);
        params.set_print_timestamps(true);
        
        // 设置进度回调
        if let Some(callback) = progress_callback {
            params.set_progress_callback_safe(callback);
        }
        
        // 执行转录
        context.full(params, &audio_data)?;
        
        // 获取结果
        let num_segments = context.full_n_segments()?;
        let mut chunks = Vec::new();
        
        for i in 0..num_segments {
            let start_timestamp = context.full_get_segment_t0(i)? as f64 / 100.0;
            let end_timestamp = context.full_get_segment_t1(i)? as f64 / 100.0;
            let text = context.full_get_segment_text(i)?;
            
            chunks.push(SubtitleChunk {
                id: format!("chunk_{}", i),
                timestamp: [start_timestamp, end_timestamp],
                text: text.trim().to_string(),
            });
        }
        
        Ok(TranscriptResult {
            language: language.unwrap_or_default(),
            chunks,
        })
    }
}
```

#### 2.3 模型管理系统

```rust
// src-tauri/src/services/model_service.rs
use std::path::PathBuf;
use tokio::fs;
use reqwest;

pub struct ModelService {
    models_dir: PathBuf,
}

impl ModelService {
    pub fn new(app_data_dir: PathBuf) -> Self {
        let models_dir = app_data_dir.join("models");
        Self { models_dir }
    }

    pub async fn ensure_model(&self, model_name: &str) -> Result<PathBuf, Box<dyn std::error::Error>> {
        let model_path = self.models_dir.join(format!("{}.bin", model_name));
        
        if !model_path.exists() {
            self.download_model(model_name).await?;
        }
        
        Ok(model_path)
    }

    async fn download_model(&self, model_name: &str) -> Result<(), Box<dyn std::error::Error>> {
        let url = format!(
            "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-{}.bin",
            model_name
        );
        
        let response = reqwest::get(&url).await?;
        let bytes = response.bytes().await?;
        
        fs::create_dir_all(&self.models_dir).await?;
        let model_path = self.models_dir.join(format!("{}.bin", model_name));
        fs::write(model_path, bytes).await?;
        
        Ok(())
    }

    pub fn list_available_models() -> Vec<ModelInfo> {
        vec![
            ModelInfo { name: "tiny".to_string(), size: "39 MB".to_string(), languages: "多语言".to_string() },
            ModelInfo { name: "base".to_string(), size: "74 MB".to_string(), languages: "多语言".to_string() },
            ModelInfo { name: "small".to_string(), size: "244 MB".to_string(), languages: "多语言".to_string() },
            ModelInfo { name: "medium".to_string(), size: "769 MB".to_string(), languages: "多语言".to_string() },
            ModelInfo { name: "large".to_string(), size: "1550 MB".to_string(), languages: "多语言".to_string() },
        ]
    }
}
```

#### 2.4 前端 ASR 适配

```typescript
// src/services/asrService.ts - 适配 Tauri 版本
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

export class TauriASRService {
  async transcribeAudio(
    audioBuffer: ArrayBuffer,
    language: string = 'zh',
    model: string = 'base'
  ): Promise<TranscriptResult> {
    // 将 ArrayBuffer 转换为 Float32Array
    const audioData = this.convertAudioBuffer(audioBuffer);
    
    // 调用 Tauri 后端
    const result = await invoke('transcribe_audio', {
      audioData: Array.from(audioData),
      language,
      model
    });
    
    return result as TranscriptResult;
  }

  async setProgressCallback(callback: (progress: ProgressInfo) => void) {
    // 监听进度事件
    await listen('transcription-progress', (event) => {
      callback(event.payload as ProgressInfo);
    });
  }

  private convertAudioBuffer(buffer: ArrayBuffer): Float32Array {
    // 音频格式转换逻辑
    const audioContext = new AudioContext();
    const audioBuffer = audioContext.createBuffer(1, buffer.byteLength / 4, 16000);
    const channelData = audioBuffer.getChannelData(0);
    
    const view = new Float32Array(buffer);
    channelData.set(view);
    
    return channelData;
  }
}
```

### Phase 3: 视频处理本地化 (1-2 周)

#### 3.1 FFmpeg 集成

```rust
// src-tauri/src/services/ffmpeg_service.rs
use std::process::Command;
use std::path::PathBuf;
use tokio::process::Command as AsyncCommand;

pub struct FFmpegService {
    ffmpeg_path: PathBuf,
}

impl FFmpegService {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let ffmpeg_path = Self::find_ffmpeg()?;
        Ok(Self { ffmpeg_path })
    }

    fn find_ffmpeg() -> Result<PathBuf, Box<dyn std::error::Error>> {
        // 尝试找到系统中的 FFmpeg
        if let Ok(output) = Command::new("which").arg("ffmpeg").output() {
            if output.status.success() {
                let path = String::from_utf8(output.stdout)?;
                return Ok(PathBuf::from(path.trim()));
            }
        }
        
        // 使用打包的 FFmpeg
        let bundled_path = std::env::current_exe()?
            .parent()
            .unwrap()
            .join("binaries")
            .join(if cfg!(windows) { "ffmpeg.exe" } else { "ffmpeg" });
            
        if bundled_path.exists() {
            Ok(bundled_path)
        } else {
            Err("FFmpeg not found".into())
        }
    }

    pub async fn export_video(
        &self,
        input: &str,
        segments: &[TimeSegment],
        output: &str,
        quality: VideoQuality,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // 构建 FFmpeg 命令
        let mut cmd = AsyncCommand::new(&self.ffmpeg_path);
        
        // 输入文件
        cmd.arg("-i").arg(input);
        
        // 构建过滤器
        let filter = self.build_concat_filter(segments);
        cmd.arg("-filter_complex").arg(filter);
        
        // 应用质量设置
        self.apply_quality_settings(&mut cmd, quality);
        
        // 输出设置
        cmd.arg("-map").arg("[outv]");
        cmd.arg("-map").arg("[outa]");
        cmd.arg("-y"); // 覆盖输出文件
        cmd.arg(output);
        
        // 执行命令
        let output = cmd.output().await?;
        
        if !output.status.success() {
            return Err(format!(
                "FFmpeg failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ).into());
        }
        
        Ok(())
    }

    fn build_concat_filter(&self, segments: &[TimeSegment]) -> String {
        let mut filter = String::new();
        
        // 为每个片段创建输入
        for (i, segment) in segments.iter().enumerate() {
            filter.push_str(&format!(
                "[0:v]trim=start={}:end={},setpts=PTS-STARTPTS[v{}];",
                segment.start, segment.end, i
            ));
            filter.push_str(&format!(
                "[0:a]atrim=start={}:end={},asetpts=PTS-STARTPTS[a{}];",
                segment.start, segment.end, i
            ));
        }
        
        // 拼接所有片段
        let video_inputs: Vec<String> = (0..segments.len())
            .map(|i| format!("[v{}]", i))
            .collect();
        let audio_inputs: Vec<String> = (0..segments.len())
            .map(|i| format!("[a{}]", i))
            .collect();
        
        filter.push_str(&format!(
            "{}concat=n={}:v=1:a=0[outv];",
            video_inputs.join(""),
            segments.len()
        ));
        filter.push_str(&format!(
            "{}concat=n={}:v=0:a=1[outa]",
            audio_inputs.join(""),
            segments.len()
        ));
        
        filter
    }

    fn apply_quality_settings(&self, cmd: &mut AsyncCommand, quality: VideoQuality) {
        match quality {
            VideoQuality::High => {
                cmd.arg("-c:v").arg("libx264");
                cmd.arg("-preset").arg("medium");
                cmd.arg("-crf").arg("18");
                cmd.arg("-c:a").arg("aac");
                cmd.arg("-b:a").arg("192k");
            }
            VideoQuality::Medium => {
                cmd.arg("-c:v").arg("libx264");
                cmd.arg("-preset").arg("fast");
                cmd.arg("-crf").arg("23");
                cmd.arg("-c:a").arg("aac");
                cmd.arg("-b:a").arg("128k");
            }
            VideoQuality::Low => {
                cmd.arg("-c:v").arg("libx264");
                cmd.arg("-preset").arg("ultrafast");
                cmd.arg("-crf").arg("28");
                cmd.arg("-c:a").arg("aac");
                cmd.arg("-b:a").arg("96k");
            }
        }
    }

    pub async fn extract_audio(
        &self,
        input: &str,
        output: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let mut cmd = AsyncCommand::new(&self.ffmpeg_path);
        
        cmd.arg("-i").arg(input);
        cmd.arg("-vn"); // 不包含视频
        cmd.arg("-acodec").arg("pcm_s16le"); // PCM 16-bit
        cmd.arg("-ar").arg("16000"); // 16kHz 采样率
        cmd.arg("-ac").arg("1"); // 单声道
        cmd.arg("-y"); // 覆盖输出
        cmd.arg(output);
        
        let output = cmd.output().await?;
        
        if !output.status.success() {
            return Err(format!(
                "Audio extraction failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ).into());
        }
        
        Ok(())
    }
}
```

#### 3.2 前端视频处理适配

```typescript
// src/services/videoService.ts
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

export class TauriVideoService {
  async exportVideo(
    inputPath: string,
    segments: TimeSegment[],
    outputPath: string,
    quality: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<string> {
    const result = await invoke('export_video', {
      inputPath,
      segments,
      outputPath,
      quality
    });
    
    return result as string;
  }

  async extractAudio(
    videoPath: string,
    audioPath: string
  ): Promise<void> {
    await invoke('extract_audio', {
      inputPath: videoPath,
      outputPath: audioPath
    });
  }

  async setProgressCallback(callback: (progress: VideoProgressInfo) => void) {
    await listen('video-processing-progress', (event) => {
      callback(event.payload as VideoProgressInfo);
    });
  }

  async getVideoInfo(path: string): Promise<VideoInfo> {
    return await invoke('get_video_info', { path });
  }
}
```

### Phase 4: 功能增强 (1-2 周)

#### 4.1 系统集成功能

```rust
// src-tauri/src/commands/system.rs
use tauri::{command, api::notification::Notification, Manager};

#[command]
pub async fn show_notification(
    title: String,
    body: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    Notification::new(&app_handle.config().tauri.bundle.identifier)
        .title(&title)
        .body(&body)
        .show()
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[command]
pub async fn open_file_in_explorer(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-R", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[command]
pub async fn set_window_always_on_top(
    always_on_top: bool,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let window = app_handle.get_window("main").unwrap();
    window.set_always_on_top(always_on_top).map_err(|e| e.to_string())?;
    Ok(())
}
```

#### 4.2 全局快捷键支持

```rust
// Cargo.toml
[dependencies]
tauri-plugin-global-shortcut = "2.0.0"

// src-tauri/src/main.rs
use tauri_plugin_global_shortcut::{Code, Modifiers, ShortcutEvent, GlobalShortcutExt};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::init())
        .setup(|app| {
            // 注册全局快捷键
            app.global_shortcut().register("Cmd+Shift+F")?;
            app.global_shortcut().on_shortcut(|_app, shortcut, event| {
                if event == ShortcutEvent::Triggered {
                    println!("全局快捷键触发: {:?}", shortcut);
                    // 激活应用窗口
                    if let Some(window) = _app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

#### 4.3 自动更新实现

```rust
// Cargo.toml
[dependencies]
tauri-plugin-updater = "2.0.0"

// src-tauri/src/commands/update.rs
use tauri_plugin_updater::UpdaterExt;

#[command]
pub async fn check_for_updates(app: tauri::AppHandle) -> Result<Option<UpdateInfo>, String> {
    let updater = app.updater();
    
    match updater.check().await {
        Ok(Some(update)) => {
            Ok(Some(UpdateInfo {
                version: update.version,
                notes: update.body.unwrap_or_default(),
                pub_date: update.pub_date,
                download_url: update.download_url.to_string(),
            }))
        }
        Ok(None) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[command]
pub async fn download_and_install_update(app: tauri::AppHandle) -> Result<(), String> {
    let updater = app.updater();
    
    if let Some(update) = updater.check().await.map_err(|e| e.to_string())? {
        // 下载更新
        update.download_and_install().await.map_err(|e| e.to_string())?;
        
        // 重启应用
        app.restart();
    }
    
    Ok(())
}
```

## 📋 迁移检查清单

### Phase 1 完成标准
- [ ] Tauri 项目成功初始化
- [ ] 基础文件操作功能正常
- [ ] 应用可以正常打包和运行
- [ ] 前端界面完全正常显示

### Phase 2 完成标准
- [ ] Whisper 模型下载和缓存功能
- [ ] 本地 ASR 识别功能正常
- [ ] ASR 性能达到预期提升
- [ ] 进度回调功能正常

### Phase 3 完成标准
- [ ] FFmpeg 视频导出功能正常
- [ ] 视频处理性能达到预期
- [ ] 音频提取功能正常
- [ ] 各种视频格式支持

### Phase 4 完成标准
- [ ] 系统通知功能
- [ ] 全局快捷键支持
- [ ] 自动更新机制
- [ ] 多平台打包成功

## 🔧 常见问题解决

### 1. FFmpeg 找不到
```bash
# macOS
brew install ffmpeg

# Windows
# 下载 FFmpeg 静态编译版本到 src-tauri/binaries/

# Linux
sudo apt install ffmpeg
```

### 2. Whisper 模型下载失败
```rust
// 提供备用下载源
const MIRROR_URLS: &[&str] = &[
    "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/",
    "https://github.com/ggerganov/whisper.cpp/releases/download/v1.5.4/",
];
```

### 3. 编译错误
```bash
# 清理缓存
cargo clean
pnpm run build

# 更新依赖
cargo update
pnpm update
```

### 4. 权限问题
```json
// tauri.conf.json
{
  "tauri": {
    "allowlist": {
      "fs": {
        "scope": ["$APPDATA", "$DESKTOP", "$DOCUMENT"]
      }
    }
  }
}
```

## 📝 迁移后验证

### 性能测试
```bash
# 测试 ASR 性能
time whisper audio.wav --model base

# 测试视频导出性能  
time ffmpeg -i input.mp4 -filter_complex "..." output.mp4
```

### 功能测试
- [ ] 文件上传和选择
- [ ] ASR 识别准确性
- [ ] 视频播放和预览
- [ ] 字幕编辑功能
- [ ] 视频导出质量
- [ ] 应用稳定性

### 用户体验测试
- [ ] 启动速度
- [ ] 操作响应性
- [ ] 内存使用情况
- [ ] CPU 使用情况
- [ ] 界面流畅性

通过这个详细的迁移指南，可以系统性地将 FlyCut Caption 从 Web 应用迁移到高性能的桌面应用，在保持现有功能的同时显著提升性能和用户体验。