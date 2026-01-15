// ASR Worker - 基于 Whisper 的语音识别处理
// 生成句子级别时间戳，适合字幕编辑

import { pipeline, env } from '@huggingface/transformers';
import type { ASRProgress, SubtitleTranscript } from '../types/subtitle';
import { isValidLanguageCode } from '../constants/languages';

// 配置模型加载路径 - 使用 OSS
// OSS 配置：fly-cut bucket, oss-cn-hangzhou.aliyuncs.com
const OSS_BASE_URL = 'https://fly-cut.oss-cn-hangzhou.aliyuncs.com';
const OSS_MODEL_PATH = 'models/onnx-community/whisper-small';

// 配置 transformers.js 环境以从 OSS 加载模型
const modelBaseURL = `${OSS_BASE_URL}/${OSS_MODEL_PATH}`;
console.log('ASR配置OSS模型路径:', modelBaseURL);

// transformers.js 不支持直接将 HTTP URL 作为模型 ID
// 我们需要拦截文件加载请求，将 Hugging Face Hub 的 URL 重定向到 OSS
// 方法：重写全局 fetch 函数来拦截模型文件请求

// 保存原始的 fetch 函数
const originalFetch = globalThis.fetch;

console.log('🔧 设置 fetch 拦截器，OSS 路径:', modelBaseURL);

// 重写 fetch 函数以从 OSS 加载文件
globalThis.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  
  // 检查是否是 Hugging Face Hub 的模型文件请求
  if (url && url.includes('huggingface.co') && url.includes('onnx-community/whisper-small')) {
    console.log('🔍 检测到 Hugging Face 请求:', url);
    
    // 匹配 Hugging Face Hub 的 URL 格式：
    // https://huggingface.co/onnx-community/whisper-small/resolve/main/tokenizer_config.json
    // 或
    // https://huggingface.co/onnx-community/whisper-small/raw/main/tokenizer_config.json
    const match = url.match(/onnx-community\/whisper-small\/(?:resolve|raw)\/[^/]+\/(.+)$/);
    if (match) {
      const filePath = match[1];
      const ossUrl = `${modelBaseURL}/${filePath}`;
      console.log(`🔄 重定向到 OSS: ${filePath} -> ${ossUrl}`);
      try {
        return await originalFetch(ossUrl, init);
      } catch (error) {
        console.error(`❌ OSS 请求失败: ${ossUrl}`, error);
        throw error;
      }
    }
    
    // 也尝试匹配其他可能的格式
    const match2 = url.match(/onnx-community\/whisper-small\/(.+)$/);
    if (match2) {
      const filePath = match2[1];
      // 跳过 resolve/main/ 或 raw/main/ 等路径段
      const cleanPath = filePath.replace(/^(resolve|raw)\/[^/]+\//, '');
      const ossUrl = `${modelBaseURL}/${cleanPath}`;
      console.log(`🔄 重定向到 OSS (格式2): ${cleanPath} -> ${ossUrl}`);
      try {
        return await originalFetch(ossUrl, init);
      } catch (error) {
        console.error(`❌ OSS 请求失败: ${ossUrl}`, error);
        throw error;
      }
    }
    
    console.warn('⚠️ 无法匹配 URL 格式:', url);
  }
  
  // 其他请求使用原始 fetch
  return originalFetch(input, init);
};

// 获取模型 ID（使用原始的 Hugging Face 模型 ID）
function getModelId(): string {
  // 使用原始的模型 ID，fetch 拦截器会将请求重定向到 OSS
  return 'onnx-community/whisper-small';
}

const PER_DEVICE_CONFIG = {
  webgpu: {
    dtype: {
      encoder_model: 'fp32',
      decoder_model_merged: 'q4',
    },
    device: 'webgpu',
  },
  wasm: {
    dtype: 'q8',
    device: 'wasm',
  },
} as const;

/**
 * ASR 管道单例模式 - 句子级别时间戳版本
 */
class PipelineSingleton {
  static model_id = getModelId();
  static instance: Awaited<ReturnType<typeof pipeline>> | null = null;

  static async getInstance(progress_callback?: (progress: unknown) => void, device: 'webgpu' | 'wasm' = 'webgpu') {
    if (!this.instance) {
      console.log('ASR创建新的管道实例:', { device, model_id: this.model_id });
      
      // 如果使用 OSS URL，Transformers.js 会直接从该 URL 加载模型文件
      // 确保 OSS Bucket 已配置 CORS，允许跨域访问
      this.instance = pipeline('automatic-speech-recognition', this.model_id, {
        ...PER_DEVICE_CONFIG[device],
        progress_callback,
      });
    }
    return this.instance;
  }
}

/**
 * 加载 ASR 模型
 */
async function load({ device }: { device: 'webgpu' | 'wasm' }) {
  console.log('ASR Worker开始加载模型:', device);
  
  self.postMessage({
    status: 'loading',
    data: `正在加载模型 (${device})...`,
  } satisfies ASRProgress);

  try {
    // 加载管道并保存以供将来使用
    const transcriber = await PipelineSingleton.getInstance((progress) => {
      // 添加进度回调以跟踪模型加载
      console.log('ASR模型加载进度:', progress);
      self.postMessage(progress);
    }, device);

    // WebGPU 需要预热
    if (device === 'webgpu') {
      self.postMessage({
        status: 'loading',
        data: '正在编译着色器并预热模型...',
      } satisfies ASRProgress);

      await transcriber(new Float32Array(16_000), {
        language: 'en',
      });
    }

    console.log('ASR模型加载完成');
    self.postMessage({ status: 'loaded' } satisfies ASRProgress);
    
  } catch (error) {
    console.error('ASR模型加载失败:', error);
    self.postMessage({
      status: 'error',
      error: error instanceof Error ? error.message : '模型加载失败',
    } satisfies ASRProgress);
  }
}

/**
 * 运行 ASR 识别
 */
async function run({ audio, language }: { audio: Float32Array; language: string }) {
  console.log('ASR Worker开始识别:', { audioLength: audio?.length, language });
  
  try {
    const transcriber = await PipelineSingleton.getInstance();
    const start = performance.now();

    self.postMessage({
      status: 'running',
      data: '正在进行语音识别...',
    } satisfies ASRProgress);

    // 确保语言代码正确，如果传入不支持的语言，使用英语作为默认值
    const validLanguage = isValidLanguageCode(language) ? language : 'en';
    console.log('ASR使用语言:', { original: language, valid: validLanguage });
    
    const result = await transcriber(audio, {
      language: validLanguage,
      return_timestamps: true,  // 生成句子级别时间戳
      chunk_length_s: 30,
    });

    const end = performance.now();
    console.log('ASR识别原始结果:', result);

    // 处理结果，生成句子级别的字幕片段
    let chunks = [];
    let duration = 0;
    
    if (result.chunks && Array.isArray(result.chunks)) {
      // Whisper base 模型返回句子级别的chunks
      chunks = result.chunks.map((chunk: { text: string; timestamp: [number, number] }, index: number) => ({
        text: chunk.text.trim(),
        timestamp: chunk.timestamp,
        id: `sentence-${index}`,
        selected: false,
      }));
      duration = Math.max(...result.chunks.map((c: { timestamp: [number, number] }) => c.timestamp[1]));
    } else if (result.text) {
      // 如果没有chunks，创建单个片段
      chunks = [{
        text: result.text.trim(),
        timestamp: [0, duration || 0] as [number, number],
        id: 'sentence-0',
        selected: false,
      }];
    }

    const transcript: SubtitleTranscript = {
      text: result.text,
      chunks,
      language,
      duration,
    };

    console.log('ASR识别完成:', { 
      transcriptLength: transcript.chunks.length, 
      duration: transcript.duration, 
      time: end - start 
    });
    
    self.postMessage({ 
      status: 'complete', 
      result: transcript, 
      time: end - start 
    } satisfies ASRProgress);
    
  } catch (error) {
    console.error('ASR识别失败:', error);
    self.postMessage({
      status: 'error',
      error: error instanceof Error ? error.message : 'ASR 识别失败',
    } satisfies ASRProgress);
  }
}

// 监听主线程消息
self.addEventListener('message', async (e) => {
  console.log('ASR Worker接收消息:', e.data);
  const { type, data } = e.data;

  switch (type) {
    case 'load':
      await load(data);
      break;

    case 'run':
      await run(data);
      break;

    default:
      console.error('未知的ASR Worker消息类型:', type);
      self.postMessage({
        status: 'error',
        error: `未知的消息类型: ${type}`,
      } satisfies ASRProgress);
      break;
  }
});

export {}; // 确保这是一个模块