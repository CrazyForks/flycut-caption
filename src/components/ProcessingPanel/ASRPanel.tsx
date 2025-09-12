// ASR 处理面板组件

import { useCallback, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { useHistoryStore } from '@/stores/historyStore';
import { asrService } from '@/services/asrService';
import type { ASRProgress } from '@/types/subtitle';
import { readFileAsArrayBuffer } from '@/utils/fileUtils';
import { 
  Mic, 
  Play, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Settings,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { AdvancedLanguageSelector, LanguageSelector } from '@/components/LanguageSelector';

interface ASRPanelProps {
  className?: string;
}

export function ASRPanel({ className }: ASRPanelProps) {
  const videoFile = useAppStore((state) => state.videoFile);
  const language = useAppStore(state => state.language);
  const deviceType = useAppStore(state => state.deviceType);
  const asrProgress = useAppStore(state => state.asrProgress);
  const isLoading = useAppStore(state => state.isLoading);
  const error = useAppStore(state => state.error);
  
  const setASRProgress = useAppStore(state => state.setASRProgress);
  const setError = useAppStore(state => state.setError);
  const setLoading = useAppStore(state => state.setLoading);
  const setLanguage = useAppStore(state => state.setLanguage);
  const setDeviceType = useAppStore(state => state.setDeviceType);
  
  // 使用 historyStore 管理转录内容
  const setTranscript = useHistoryStore(state => state.setTranscript);
  // const transcript = useTranscript(); // 使用预定义的选择器，避免无限重渲染
  const hasTranscriptChunks = useHistoryStore((state) => state.chunks.length > 0);

  const [showSettings, setShowSettings] = useState(false);
  const audioBufferRef = useRef<ArrayBuffer | null>(null);

  // 设置进度回调
  useEffect(() => {
    const handleProgress = (progress: ASRProgress) => {
      setASRProgress(progress);

      // 处理完成状态
      if (progress.status === 'complete' && progress.result) {
        setTranscript(progress.result);
      }

      // 处理错误状态
      if (progress.status === 'error') {
        console.error('ASR处理进度错误:', progress.error);
        setError(`ASR处理失败: ${progress.error}`);
      }
    };

    asrService.setProgressCallback(handleProgress);

    return () => {
      asrService.setProgressCallback(() => {});
    };
  }, [setASRProgress, setTranscript, setError]);

  // 设置设备类型
  useEffect(() => {
    asrService.setDevice(deviceType);
  }, [deviceType]);

  // 检查是否准备就绪
  const isReady = useCallback(() => {
    return asrService.isReady();
  }, []);

  // 加载模型
  const loadModel = useCallback(async () => {
    try {
      setLoading(true);
      await asrService.loadModel();
    } catch (error) {
      console.error('ASR模型加载失败:', error);
      setError(error instanceof Error ? error.message : '模型加载失败');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // 开始转录
  const startTranscription = useCallback(async (audioBuffer: ArrayBuffer) => {
    if (!videoFile) {
      setError('请先上传视频文件');
      return;
    }

    try {
      setLoading(true);
      
      // 先确保模型已准备
      if (!asrService.isReady()) {
        setASRProgress({ status: 'loading', data: '准备模型中...' });
        await asrService.prepareModel();
      }

      // 然后进行转录
      setASRProgress({ status: 'loading', data: '开始转录音频...' });
      
      const transcriptResult = await asrService.transcribeAudio(
        audioBuffer,
        language
      );

      setTranscript(transcriptResult);
    } catch (error) {
      console.error('ASR转录失败:', error);
      setError(error instanceof Error ? error.message : '转录失败');
    } finally {
      setLoading(false);
    }
  }, [videoFile, language, setLoading, setError, setASRProgress, setTranscript]);

  // 重新开始转录
  const retryTranscription = useCallback(async (audioBuffer: ArrayBuffer) => {
    // 重置状态
    setASRProgress({ status: 'loading', data: '准备重新转录...' });
    await startTranscription(audioBuffer);
  }, [startTranscription, setASRProgress]);

  // 更改设备类型
  const changeDevice = useCallback((device: 'webgpu' | 'wasm') => {
    setDeviceType(device);
  }, [setDeviceType]);

  // 更改语言
  const changeLanguage = useCallback((newLanguage: string) => {
    setLanguage(newLanguage);
  }, [setLanguage]);

  // 准备音频数据
  const prepareAudioData = useCallback(async () => {
    if (!videoFile) return null;

    try {
      audioBufferRef.current = await readFileAsArrayBuffer(videoFile.file);
      return audioBufferRef.current;
    } catch (error) {
      console.error('音频数据准备失败:', error);
      console.error('音频数据准备错误详情:', { videoFile: videoFile?.name, error });
      return null;
    }
  }, [videoFile]);

  // 开始ASR处理
  const handleStartASR = useCallback(async () => {
    const audioBuffer = await prepareAudioData();
    if (!audioBuffer) {
      alert('音频数据准备失败');
      return;
    }

    if (!isReady()) {
      await loadModel();
    }

    await startTranscription(audioBuffer);
  }, [prepareAudioData, isReady, loadModel, startTranscription]);

  // 重试ASR处理
  const handleRetryASR = useCallback(async () => {
    if (audioBufferRef.current) {
      await retryTranscription(audioBufferRef.current);
    } else {
      await handleStartASR();
    }
  }, [audioBufferRef, retryTranscription, handleStartASR]);

  // 语言变更
  const handleLanguageChange = useCallback((newLanguage: string) => {
    changeLanguage(newLanguage);
  }, [changeLanguage]);

  // 设备类型变更
  const handleDeviceChange = useCallback((newDevice: 'webgpu' | 'wasm') => {
    changeDevice(newDevice);
  }, [changeDevice]);

  // 获取状态显示
  const getStatusDisplay = () => {
    if (error) {
      return {
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        text: '处理失败',
        description: error,
        color: 'text-red-600',
      };
    }

    if (asrProgress?.status === 'complete') {
      return {
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        text: '处理完成',
        description: `用时 ${asrProgress.time ? (asrProgress.time / 1000).toFixed(1) : '0'}s`,
        color: 'text-green-600',
      };
    }

    if (isLoading || asrProgress?.status === 'loading' || asrProgress?.status === 'running') {
      return {
        icon: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />,
        text: asrProgress?.data || '正在处理...',
        description: asrProgress?.status === 'running' ? '正在识别语音内容' : '正在加载模型',
        color: 'text-blue-600',
      };
    }

    if (isReady()) {
      return {
        icon: <Mic className="h-5 w-5 text-green-500" />,
        text: '模型已就绪',
        description: '可以开始语音识别',
        color: 'text-green-600',
      };
    }

    return {
      icon: <Play className="h-5 w-5 text-gray-500" />,
      text: '准备开始',
      description: '点击开始生成字幕',
      color: 'text-gray-600',
    };
  };

  const statusDisplay = getStatusDisplay();
  const canStart = videoFile && !isLoading && !asrProgress?.status;
  const canRetry = error || (asrProgress?.status === 'complete' && hasTranscriptChunks);

  return (
    <div className={cn('bg-card border rounded-lg p-6 space-y-4', className)}>
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <Mic className="h-5 w-5" />
          <span>语音识别 (ASR)</span>
        </h3>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-muted rounded-md transition-colors"
          title="设置"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 语言选择 */}
            <div className="space-y-2">
              <AdvancedLanguageSelector
                language={language}
                onLanguageChange={handleLanguageChange}
                disabled={isLoading}
                placeholder="搜索支持的语言..."
              />
            </div>

            {/* 设备类型选择 */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium">
                <Cpu className="h-4 w-4" />
                <span>计算设备</span>
              </label>
              <select
                value={deviceType}
                onChange={(e) => handleDeviceChange(e.target.value as 'webgpu' | 'wasm')}
                className="w-full p-2 border rounded-md bg-background"
                disabled={isLoading}
              >
                <option value="webgpu">WebGPU (推荐)</option>
                <option value="wasm">WebAssembly (兼容)</option>
              </select>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• <strong>WebGPU</strong>: 速度更快，需要现代浏览器支持</p>
            <p>• <strong>WebAssembly</strong>: 兼容性更好，适用于所有浏览器</p>
            <p>• 首次使用会下载约 {deviceType === 'webgpu' ? '196MB' : '77MB'} 的模型文件</p>
          </div>
        </div>
      )}

      {/* 状态显示 */}
      <div className="flex items-center space-x-3 p-4 border rounded-lg">
        {statusDisplay.icon}
        <div className="flex-1">
          <p className={cn('font-medium', statusDisplay.color)}>
            {statusDisplay.text}
          </p>
          <p className="text-sm text-muted-foreground">
            {statusDisplay.description}
          </p>
        </div>
      </div>

      {/* 进度显示 */}
      {asrProgress && asrProgress.progress !== undefined && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>加载进度</span>
            <span>{Math.round(asrProgress.progress || 0)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${asrProgress.progress || 0}%` }}
            />
          </div>
        </div>
      )}

      {/* 快速语言选择 */}
      {!showSettings && (
        <div className="border rounded-lg p-3 bg-muted/20">
          <LanguageSelector
            language={language}
            onLanguageChange={handleLanguageChange}
            disabled={isLoading}
            showLabel={true}
            size="sm"
            className="max-w-xs"
          />
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex space-x-3">
        <button
          onClick={handleStartASR}
          disabled={!canStart}
          className={cn(
            'flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-md transition-colors',
            'font-medium text-sm',
            canStart
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          <Play className="h-4 w-4" />
          <span>开始生成字幕</span>
        </button>

        {canRetry && (
          <button
            onClick={handleRetryASR}
            className="flex items-center space-x-2 py-2.5 px-4 border rounded-md hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>重试</span>
          </button>
        )}
      </div>

      {/* 文件信息 */}
      {videoFile && (
        <div className="text-xs text-muted-foreground border-t pt-4">
          <p>文件: {videoFile.name}</p>
          <p>类型: {videoFile.type}</p>
          {videoFile.duration > 0 && (
            <p>时长: {Math.floor(videoFile.duration / 60)}:{Math.floor(videoFile.duration % 60).toString().padStart(2, '0')}</p>
          )}
        </div>
      )}
    </div>
  );
}