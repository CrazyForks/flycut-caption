// ASR 服务 - 管理语音识别功能
// 基于 transformers.js-examples/whisper-word-timestamps 简化实现

import type { ASRProgress, SubtitleTranscript } from '../types/subtitle';
import { processAudioForASR, hasWebGPU } from '../utils/audioUtils';
import asrWorker from '../workers/asrWorker.ts?worker&inline'

export class ASRService {
  private worker: Worker | null = null;
  private onProgress: ((progress: ASRProgress) => void) | null = null;
  private isModelLoaded = false;
  private currentDevice: 'webgpu' | 'wasm' = 'wasm';
  // private currentLanguage: string = 'en'; // TODO: Implement language switching

  constructor() {
    console.log('ASR Service初始化');
    this.init();
  }

  /**
   * 初始化服务
   */
  private async init() {
    // 检测设备能力
    const supportsWebGPU = await hasWebGPU();
    this.currentDevice = supportsWebGPU ? 'webgpu' : 'wasm';
    console.log('ASR设备检测结果:', { supportsWebGPU, currentDevice: this.currentDevice });
  }

  /**
   * 创建 Worker
   */
  private createWorker(): Worker {
    if (this.worker) {
      console.log('ASR终止现有Worker');
      this.worker.terminate();
    }

    console.log('ASR创建新Worker');
    this.worker = new asrWorker()

    this.worker.onmessage = (e) => {
      console.log('ASR Worker消息接收:', e.data);
      const progress = e.data as ASRProgress;
      
      // 更新模型加载状态
      if (progress.status === 'loaded') {
        this.isModelLoaded = true;
      } else if (progress.status === 'error') {
        this.isModelLoaded = false;
      }

      // 转发进度给外部监听器
      if (this.onProgress) {
        this.onProgress(progress);
      }
    };

    this.worker.onerror = (error) => {
      console.error('ASR Worker错误:', error);
      if (this.onProgress) {
        this.onProgress({
          status: 'error',
          error: 'Worker 运行错误',
        });
      }
    };

    return this.worker;
  }

  /**
   * 设置进度回调
   */
  public setProgressCallback(callback: (progress: ASRProgress) => void) {
    this.onProgress = callback;
  }

  /**
   * 获取当前设备类型
   */
  public getCurrentDevice(): 'webgpu' | 'wasm' {
    return this.currentDevice;
  }

  /**
   * 设置设备类型
   */
  public setDevice(device: 'webgpu' | 'wasm') {
    if (this.currentDevice !== device) {
      console.log('ASR设备类型变更:', this.currentDevice, '->', device);
      this.currentDevice = device;
      this.isModelLoaded = false; // 重置模型加载状态
      
      // 设备切换时需要重新创建 Worker 以使用新设备
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
    }
  }

  /**
   * 加载模型
   */
  public async loadModel(): Promise<void> {
    console.log('ASR开始加载模型:', this.currentDevice);
    
    if (!this.worker) {
      this.createWorker();
    }

    return new Promise((resolve, reject) => {
      if (!this.worker) {
        console.error('ASR Worker创建失败');
        reject(new Error('Worker 创建失败'));
        return;
      }

      const originalCallback = this.onProgress;
      
      this.onProgress = (progress) => {
        // 转发给原始回调
        if (originalCallback) {
          originalCallback(progress);
        }

        // 处理加载完成
        if (progress.status === 'loaded') {
          console.log('ASR模型加载完成');
          this.onProgress = originalCallback;
          resolve();
        } else if (progress.status === 'error') {
          console.error('ASR模型加载失败:', progress.error);
          this.onProgress = originalCallback;
          reject(new Error(progress.error || '模型加载失败'));
        }
      };

      console.log('ASR发送模型加载消息:', { device: this.currentDevice });
      this.worker.postMessage({
        type: 'load',
        data: { device: this.currentDevice },
      });
    });
  }

  /**
   * 准备模型（分步操作第一步）
   */
  public async prepareModel(): Promise<void> {
    console.log('ASR准备模型:', this.currentDevice);
    
    if (!this.worker) {
      this.createWorker();
    }

    if (!this.isModelLoaded) {
      console.log('ASR开始加载模型');
      await this.loadModel();
    } else {
      console.log('ASR模型已加载，跳过准备步骤');
    }
  }

  /**
   * 识别音频（分步操作第二步）
   */
  public async transcribeAudio(
    audioBuffer: ArrayBuffer,
    language: string = 'en'
  ): Promise<SubtitleTranscript> {
    console.log('ASR开始转录:', { bufferSize: audioBuffer.byteLength, language });
    
    // 检查模型是否已准备好
    if (!this.isModelLoaded || !this.worker) {
      throw new Error('模型未准备好，请先调用 prepareModel()');
    }
    
    // 保存当前语言用于结果格式化
    // this.currentLanguage = language; // TODO: Implement language switching

    // 处理音频数据
    const audioData = await processAudioForASR(audioBuffer);
    console.log('ASR音频数据处理完成:', { audioDataLength: audioData.length });

    return new Promise((resolve, reject) => {
      if (!this.worker) {
        console.error('ASR Worker不可用');
        reject(new Error('Worker 不可用'));
        return;
      }

      const originalCallback = this.onProgress;
      
      this.onProgress = (progress) => {
        // 转发给原始回调
        if (originalCallback) {
          originalCallback(progress);
        }

        // 处理识别完成
        if (progress.status === 'complete' && progress.result) {
          this.onProgress = originalCallback;
          resolve(progress.result);
        } else if (progress.status === 'error') {
          console.error('ASR识别失败:', progress.error);
          this.onProgress = originalCallback;
          reject(new Error(progress.error || 'ASR 识别失败'));
        }
      };

      console.log('ASR发送识别消息:', { audioLength: audioData.length, language });
      this.worker.postMessage({
        type: 'run',
        data: { audio: audioData, language },
      });
    });
  }

  /**
   * 一键识别（兼容原有接口）
   */
  public async transcribeAudioWithAutoLoad(
    audioBuffer: ArrayBuffer,
    language: string = 'en'
  ): Promise<SubtitleTranscript> {
    await this.prepareModel();
    return this.transcribeAudio(audioBuffer, language);
  }

  /**
   * 检查模型是否已加载
   */
  public isReady(): boolean {
    return this.isModelLoaded;
  }

  /**
   * 销毁服务
   */
  public destroy() {
    console.log('ASR销毁服务');
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.onProgress = null;
    this.isModelLoaded = false;
  }
}

// 全局单例
export const asrService = new ASRService();