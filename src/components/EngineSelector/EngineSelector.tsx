// 视频处理引擎选择器组件

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { VideoEngineType, EngineCapabilities } from '@/types/videoEngine';
import { VideoEngineFactory } from '@/services/videoEngines/VideoEngineFactory';
import { 
  Settings, 
  Check, 
  AlertCircle, 
  Info,
  Cpu,
  Zap,
  Globe,
  Wrench
} from 'lucide-react';

interface EngineSelectorProps {
  currentEngine?: VideoEngineType;
  onEngineChange?: (engine: VideoEngineType) => void;
  disabled?: boolean;
  className?: string;
}

export function EngineSelector({ 
  currentEngine, 
  onEngineChange, 
  disabled = false,
  className 
}: EngineSelectorProps) {
  const [capabilities, setCapabilities] = useState<Record<VideoEngineType, EngineCapabilities>>({} as Record<VideoEngineType, EngineCapabilities>);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkEngineCapabilities();
  }, []);

  const checkEngineCapabilities = async () => {
    setIsLoading(true);
    try {
      const caps = await VideoEngineFactory.checkAllEngines();
      setCapabilities(caps);
    } catch (error) {
      console.error('检查引擎能力失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEngineSelect = (engine: VideoEngineType) => {
    if (!disabled && capabilities[engine]?.supported) {
      onEngineChange?.(engine);
    }
  };

  const getEngineIcon = (engine: VideoEngineType) => {
    switch (engine) {
      case 'webav':
        return <Zap className="h-4 w-4" />;
      case 'ffmpeg':
        return <Cpu className="h-4 w-4" />;
      case 'webcodecs':
        return <Globe className="h-4 w-4" />;
      default:
        return <Wrench className="h-4 w-4" />;
    }
  };

  const getEngineDisplayName = (engine: VideoEngineType) => {
    switch (engine) {
      case 'webav':
        return 'WebAV';
      case 'ffmpeg':
        return 'FFmpeg.wasm';
      case 'webcodecs':
        return 'WebCodecs';
      default:
        return engine;
    }
  };

  const getEngineDescription = (engine: VideoEngineType) => {
    switch (engine) {
      case 'webav':
        return '轻量级，启动快，适合简单裁剪';
      case 'ffmpeg':
        return '功能强大，支持复杂操作和多种格式';
      case 'webcodecs':
        return '原生浏览器API，高性能';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className={cn('bg-card border rounded-lg p-4', className)}>
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">检查引擎可用性...</span>
        </div>
      </div>
    );
  }

  const supportedEngines = Object.entries(capabilities).filter(([_, caps]) => caps.supported);
  const unsupportedEngines = Object.entries(capabilities).filter(([_, caps]) => !caps.supported);

  return (
    <div className={cn('bg-card border rounded-lg overflow-hidden', className)}>
      {/* 头部 */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">视频处理引擎</h3>
          </div>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showDetails ? '隐藏详情' : '查看详情'}
          </button>
        </div>
        
        {currentEngine && (
          <div className="mt-2 text-sm text-muted-foreground">
            当前使用: <span className="font-medium text-foreground">
              {getEngineDisplayName(currentEngine)}
            </span>
          </div>
        )}
      </div>

      {/* 引擎列表 */}
      <div className="p-4 space-y-3">
        {supportedEngines.map(([engine, caps]) => (
          <div
            key={engine}
            className={cn(
              'flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer',
              currentEngine === engine
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-muted/50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => handleEngineSelect(engine as VideoEngineType)}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getEngineIcon(engine as VideoEngineType)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  {getEngineDisplayName(engine as VideoEngineType)}
                </span>
                {currentEngine === engine && (
                  <Check className="h-4 w-4 text-primary" />
                )}
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  可用
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground mt-1">
                {getEngineDescription(engine as VideoEngineType)}
              </p>
              
              {showDetails && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-muted-foreground">
                    支持格式: {caps.formats.join(', ')}
                  </div>
                  {caps.maxFileSize && (
                    <div className="text-xs text-muted-foreground">
                      最大文件: {Math.round(caps.maxFileSize / (1024 * 1024))}MB
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(caps.features).map(([feature, supported]) => 
                      supported && (
                        <span 
                          key={feature}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          {feature}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* 不可用的引擎 */}
        {unsupportedEngines.length > 0 && showDetails && (
          <div className="space-y-3 pt-3 border-t">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
              <AlertCircle className="h-4 w-4" />
              <span>不可用的引擎</span>
            </h4>
            
            {unsupportedEngines.map(([engine, caps]) => (
              <div
                key={engine}
                className="flex items-start space-x-3 p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
              >
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-red-900 dark:text-red-100">
                    {getEngineDisplayName(engine as VideoEngineType)}
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {caps.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 信息提示 */}
      <div className="border-t bg-muted/30 p-4">
        <div className="flex items-start space-x-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p>不同引擎有不同的特点和适用场景：</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• WebAV: 启动快，内存占用少，适合简单裁剪</li>
              <li>• FFmpeg: 功能最强大，支持所有格式和高级功能</li>
              <li>• WebCodecs: 使用浏览器原生API，性能最佳（实验性）</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}