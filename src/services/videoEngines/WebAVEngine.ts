// WebAV 视频处理引擎实现

import { Combinator, MP4Clip, OffscreenSprite } from '@webav/av-cliper';
import type { 
  IVideoProcessingEngine, 
  VideoEngineType, 
  EngineCapabilities, 
  VideoProcessingOptions 
} from '@/types/videoEngine';
import type { VideoFile, VideoSegment, VideoProcessingProgress } from '@/types/video';

export class WebAVEngine implements IVideoProcessingEngine {
  readonly name = 'WebAV';
  readonly type: VideoEngineType = 'webav';
  readonly version = '1.0.0';

  private combinator: Combinator | null = null;
  private videoClip: MP4Clip | null = null;
  private onProgress?: (progress: VideoProcessingProgress) => void;

  async checkCapabilities(): Promise<EngineCapabilities> {
    try {
      // 检查 WebAV 依赖是否可用
      if (typeof Combinator === 'undefined' || typeof MP4Clip === 'undefined') {
        return {
          supported: false,
          reason: 'WebAV 库未正确加载',
          formats: [],
          features: {
            trimming: false,
            concatenation: false,
            audioProcessing: false,
            subtitleBurning: false,
            qualityControl: false,
          }
        };
      }

      // 检查浏览器支持
      const canvas = document.createElement('canvas');
      const supported = !!(canvas.getContext && canvas.getContext('2d'));
      
      if (!supported) {
        return {
          supported: false,
          reason: '浏览器不支持 Canvas 2D',
          formats: [],
          features: {
            trimming: false,
            concatenation: false,
            audioProcessing: false,
            subtitleBurning: false,
            qualityControl: false,
          }
        };
      }

      return {
        supported: true,
        formats: ['mp4', 'webm'],
        maxFileSize: 500 * 1024 * 1024, // 500MB
        features: {
          trimming: true,
          concatenation: true,
          audioProcessing: true,
          subtitleBurning: false, // WebAV 当前不支持字幕烧录
          qualityControl: true,
        }
      };
    } catch (error) {
      return {
        supported: false,
        reason: `WebAV 引擎检查失败: ${error instanceof Error ? error.message : '未知错误'}`,
        formats: [],
        features: {
          trimming: false,
          concatenation: false,
          audioProcessing: false,
          subtitleBurning: false,
          qualityControl: false,
        }
      };
    }
  }

  async initialize(videoFile: VideoFile, onProgress?: (progress: VideoProcessingProgress) => void): Promise<void> {
    try {
      this.onProgress = onProgress;
      this.reportProgress('initializing', 0, '初始化 WebAV 引擎...');

      // 使用原始工作方式：直接从文件创建stream
      const fileStream = videoFile.file.stream();
      this.videoClip = new MP4Clip(fileStream);
      await this.videoClip.ready;

      this.reportProgress('initializing', 100, 'WebAV 引擎初始化完成');
      console.log('WebAV 引擎初始化成功:', {
        duration: this.videoClip.meta.duration,
        width: this.videoClip.meta.width,
        height: this.videoClip.meta.height,
      });
    } catch (error) {
      console.error('WebAV 引擎初始化失败:', error);
      throw new Error(`WebAV 引擎初始化失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async processVideo(segments: VideoSegment[], options: VideoProcessingOptions): Promise<Blob> {
    if (!this.videoClip) {
      throw new Error('引擎未初始化，请先调用 initialize()');
    }

    try {
      this.reportProgress('processing', 0, '开始处理视频...');

      // 筛选保留的片段
      const keptSegments = segments
        .filter(seg => seg.keep)
        .sort((a, b) => a.start - b.start);

      if (keptSegments.length === 0) {
        throw new Error('没有要保留的视频片段');
      }

      this.reportProgress('processing', 10, '分析删除片段...');

      // 获取所有删除的片段，用于计算split点
      const deletedSegments = segments
        .filter(seg => !seg.keep)
        .sort((a, b) => a.start - b.start);

      console.log('删除片段:', deletedSegments.map(s => `${s.start}s-${s.end}s`));
      console.log('保留片段:', keptSegments.map(s => `${s.start}s-${s.end}s`));

      this.reportProgress('processing', 20, '执行视频分割...');

      // 使用split方法分割视频
      const splitClips = await this.splitVideoByDeletedSegments(this.videoClip, deletedSegments);

      this.reportProgress('processing', 50, '创建视频合成器...');

      // 创建合成器
      const combinatorOptions: {
        width: number;
        height: number;
        audio?: false;
      } = {
        width: this.videoClip.meta.width,
        height: this.videoClip.meta.height,
      };

      if (!options.preserveAudio) {
        combinatorOptions.audio = false;
      }

      this.combinator = new Combinator(combinatorOptions);

      this.reportProgress('processing', 60, '重新组合视频片段...');

      // 添加分割后的视频片段到合成器
      let totalDuration = 0;
      for (let i = 0; i < splitClips.length; i++) {
        const clip = splitClips[i];
        
        console.log(`添加视频片段 ${i + 1}/${splitClips.length}, 持续时间: ${clip.meta.duration / 1e6}s`);

        const sprite = new OffscreenSprite(clip);
        
        // 设置时间偏移
        sprite.time.offset = totalDuration;
        
        // 添加到合成器
        await this.combinator.addSprite(sprite);

        totalDuration += clip.meta.duration;

        this.reportProgress(
          'processing', 
          60 + (i / splitClips.length) * 20, 
          `重组片段 ${i + 1}/${splitClips.length}`
        );
      }

      this.reportProgress('processing', 80, '开始输出视频...');

      // 输出视频
      const outputStream = this.combinator.output();
      if (!outputStream) {
        throw new Error('无法创建视频输出流');
      }
      
      const chunks: Uint8Array[] = [];
      const reader = outputStream.getReader();

      let totalSize = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        totalSize += value.length;
        
        // 简单的进度估计
        this.reportProgress('processing', 80 + (totalSize / (10 * 1024 * 1024)) * 15, '输出视频数据...');
      }

      this.reportProgress('processing', 95, '完成视频处理...');

      // 创建最终的 Blob
      const outputBlob = new Blob(chunks.map(chunk => new Uint8Array(chunk)), { 
        type: options.format === 'webm' ? 'video/webm' : 'video/mp4' 
      });

      this.reportProgress('processing', 100, '视频处理完成');

      console.log('WebAV 视频处理完成:', {
        originalSegments: segments.length,
        keptSegments: keptSegments.length,
        splitClips: splitClips.length,
        outputSize: outputBlob.size,
        outputType: outputBlob.type,
        totalDuration: totalDuration / 1e6
      });

      return outputBlob;
    } catch (error) {
      console.error('WebAV 视频处理失败:', error);
      throw new Error(`视频处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.combinator) {
        await this.combinator.destroy();
        this.combinator = null;
      }
      
      if (this.videoClip) {
        await this.videoClip.destroy();
        this.videoClip = null;
      }
      
      this.onProgress = undefined;
      console.log('WebAV 引擎资源清理完成');
    } catch (error) {
      console.warn('WebAV 引擎清理时出现警告:', error);
    }
  }

  configure(config: Record<string, unknown>): void {
    // WebAV 引擎特定的配置选项
    console.log('WebAV 引擎配置:', config);
  }

  private reportProgress(stage: string, progress: number, message: string) {
    if (this.onProgress) {
      this.onProgress({
        stage: stage as VideoProcessingProgress['stage'],
        progress: Math.min(100, Math.max(0, progress)),
        message
      });
    }
  }

  private async splitVideoByDeletedSegments(clip: MP4Clip, deletedSegments: VideoSegment[]): Promise<MP4Clip[]> {
    if (deletedSegments.length === 0) {
      return [clip];
    }

    // 合并重叠的删除片段
    const mergedDeleted = this.mergeOverlappingSegments(deletedSegments);
    
    console.log('合并后的删除片段:', mergedDeleted.map(s => `${s.start}s-${s.end}s`));

    const resultClips: MP4Clip[] = [];
    let currentClip = clip;
    let currentTime = 0; // 当前在原视频中的时间偏移（秒）

    for (let i = 0; i < mergedDeleted.length; i++) {
      const deleteSegment = mergedDeleted[i];
      
      // 如果删除片段开始时间 > 当前时间，保留中间的片段
      if (deleteSegment.start > currentTime) {
        const keepDuration = deleteSegment.start - currentTime;
        console.log(`保留片段: ${currentTime}s-${deleteSegment.start}s, 时长: ${keepDuration}s`);
        
        if (keepDuration > 0.01) { // 最小0.01秒片段
          // 在删除片段开始处分割
          const splitTime = (deleteSegment.start - currentTime) * 1e6; // 转换为微秒
          const [keepPart, remaining] = await currentClip.split(splitTime);
          
          if (keepPart && keepPart.meta.duration > 0) {
            resultClips.push(keepPart);
          }
          
          currentClip = remaining;
        }
      }

      // 跳过删除的片段
      const deleteDuration = deleteSegment.end - deleteSegment.start;
      if (deleteDuration > 0 && currentClip) {
        const deleteTime = deleteDuration * 1e6; // 转换为微秒
        
        console.log(`跳过删除片段: ${deleteSegment.start}s-${deleteSegment.end}s, 时长: ${deleteDuration}s`);
        
        // 检查是否还有足够的视频长度
        if (currentClip.meta.duration > deleteTime) {
          const [, remaining] = await currentClip.split(deleteTime);
          currentClip = remaining;
        } else {
          // 删除片段超过了剩余视频长度，直接结束
          currentClip = null;
          break;
        }
      }

      currentTime = deleteSegment.end;
    }

    // 如果还有剩余的视频片段，添加到结果中
    if (currentClip && currentClip.meta.duration > 0.01 * 1e6) {
      console.log(`保留最后的片段，时长: ${currentClip.meta.duration / 1e6}s`);
      resultClips.push(currentClip);
    }

    console.log(`分割完成，共 ${resultClips.length} 个片段`);
    return resultClips;
  }

  private mergeOverlappingSegments(segments: VideoSegment[]): VideoSegment[] {
    if (segments.length === 0) return [];
    
    const sorted = [...segments].sort((a, b) => a.start - b.start);
    const merged: VideoSegment[] = [sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = merged[merged.length - 1];
      
      // 如果当前片段与最后一个合并的片段重叠，则合并
      if (current.start <= last.end) {
        last.end = Math.max(last.end, current.end);
      } else {
        merged.push(current);
      }
    }
    
    return merged;
  }
}