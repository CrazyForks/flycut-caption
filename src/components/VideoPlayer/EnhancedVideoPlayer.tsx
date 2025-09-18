// 增强的视频播放器 - 支持区间播放和预览

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useSize } from 'ahooks';
import { cn } from '@/lib/utils';
import { formatTime } from '@/utils/timeUtils';
import { useChunks } from '@/stores/historyStore';
import { SubtitleOverlay } from './SubtitleOverlay';
import type { SubtitleStyle } from '@/components/SubtitleSettings';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Eye,
  EyeOff
} from 'lucide-react';

interface EnhancedVideoPlayerProps {
  className?: string;
  videoUrl?: string;
  onTimeUpdate?: (time: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  subtitleStyle?: SubtitleStyle;
  onSubtitleStyleChange?: (style: SubtitleStyle) => void;
}

export function EnhancedVideoPlayer({
  className,
  videoUrl,
  onTimeUpdate,
  onPlay,
  onPause,
  subtitleStyle,
  onSubtitleStyleChange
}: EnhancedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const chunks = useChunks();

  // 获取视频容器尺寸
  const containerSize = useSize(videoContainerRef);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [previewMode, setPreviewMode] = useState(true); // 预览模式：跳过删除片段
  
  // 拖拽相关状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [dragPercentage, setDragPercentage] = useState(0); // 拖拽时的位置百分比
  const [wasPlayingBeforeDrag, setWasPlayingBeforeDrag] = useState(false);

  // 视频尺寸状态
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  
  // 字幕相关状态 - 移除本地状态，使用外部传入的
  // const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>(defaultSubtitleStyle);
  // const [showSubtitleSettings, setShowSubtitleSettings] = useState(false);
  
  // 基于 chunks 数据计算保留的片段
  const keptSegments = useMemo(() => {
    return chunks
      .filter(chunk => !chunk.deleted)
      .map(chunk => ({
        id: chunk.id,
        start: chunk.timestamp[0],
        end: chunk.timestamp[1],
        duration: chunk.timestamp[1] - chunk.timestamp[0],
        text: chunk.text
      }))
      .sort((a, b) => a.start - b.start);
  }, [chunks]);

  // 删除的片段 - 暂时未使用，但保留以备将来可能的功能扩展
  // const deletedSegments = useMemo(() => {
  //   return chunks
  //     .filter(chunk => chunk.deleted)
  //     .map(chunk => ({
  //       id: chunk.id,
  //       start: chunk.timestamp[0],
  //       end: chunk.timestamp[1],
  //       duration: chunk.timestamp[1] - chunk.timestamp[0],
  //       text: chunk.text
  //     }))
  //     .sort((a, b) => a.start - b.start);
  // }, [chunks]);

  // 计算新时间轴时间（预览模式下的压缩时间）
  const newTimelineTime = useMemo(() => {
    if (!previewMode || keptSegments.length === 0) return localCurrentTime;
    
    let newTime = 0;
    for (const segment of keptSegments) {
      if (localCurrentTime >= segment.start && localCurrentTime <= segment.end) {
        // 当前时间在这个保留片段内
        newTime += localCurrentTime - segment.start;
        break;
      } else if (localCurrentTime > segment.end) {
        // 当前时间在这个片段之后
        newTime += segment.duration;
      } else {
        // 当前时间在这个片段之前
        break;
      }
    }
    return newTime;
  }, [localCurrentTime, previewMode, keptSegments]);

  // 新时间轴总时长
  const newTimelineDuration = useMemo(() => {
    if (!previewMode) return duration;
    return keptSegments.reduce((total, segment) => total + segment.duration, 0);
  }, [previewMode, duration, keptSegments]);

  // 检查当前时间是否在保留片段中
  const isTimeInKeptSegments = useCallback((time: number) => {
    return keptSegments.some(segment => 
      time >= segment.start && time <= segment.end
    );
  }, [keptSegments]);

  // 找到下一个保留片段
  const findNextKeptSegment = useCallback((currentTime: number) => {
    return keptSegments.find(segment => segment.start > currentTime);
  }, [keptSegments]);

  // 处理视频时间更新
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || isDragging) return; // 拖拽时忽略 timeupdate 事件
    
    const time = videoRef.current.currentTime;
    setLocalCurrentTime(time);
    
    // 在预览模式下，检查是否需要跳过删除的片段
    if (previewMode && keptSegments.length > 0 && isPlaying) {
      if (!isTimeInKeptSegments(time)) {
        // 当前时间在删除片段中，跳转到下一个保留片段
        const nextSegment = findNextKeptSegment(time);
        
        if (nextSegment) {
          videoRef.current.currentTime = nextSegment.start;
          return;
        } else {
          // 没有更多片段，暂停播放
          videoRef.current.pause();
          setIsPlaying(false);
          onPause?.();
          return;
        }
      }
    }
    
    // 通知外部组件时间更新（使用新时间轴或原始时间轴）
    const notifyTime = previewMode && keptSegments.length > 0 ? newTimelineTime : localCurrentTime;
    onTimeUpdate?.(notifyTime);
  }, [previewMode, keptSegments, isPlaying, isTimeInKeptSegments, findNextKeptSegment, newTimelineTime, onTimeUpdate, onPause, localCurrentTime, isDragging]);

  // 播放/暂停
  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      onPause?.();
    } else {
      videoRef.current.play();
      setIsPlaying(true);
      onPlay?.();
    }
  }, [isPlaying, onPlay, onPause]);

  // 跳转到指定时间
  const seekTo = useCallback((time: number) => {
    if (!videoRef.current) return;

    let targetTime = time;

    // 如果在预览模式且传入的是新时间轴时间，需要转换为原始时间
    if (previewMode && keptSegments.length > 0) {
      // 将新时间轴时间映射回原始时间
      let remainingTime = Math.max(0, time);
      targetTime = keptSegments[0]?.start || 0; // 默认到第一个片段开始
      
      for (const segment of keptSegments) {
        if (remainingTime <= segment.duration) {
          targetTime = segment.start + remainingTime;
          break;
        } else {
          remainingTime -= segment.duration;
        }
      }
      
      // 确保targetTime不超出视频总长度
      if (targetTime > duration) {
        targetTime = duration;
      }
    }

    videoRef.current.currentTime = targetTime;
    setLocalCurrentTime(targetTime);
  }, [previewMode, keptSegments]);

  // 快进/快退
  const skip = useCallback((seconds: number) => {
    if (!videoRef.current) return;
    
    const newTime = Math.max(0, Math.min(duration, localCurrentTime + seconds));
    seekTo(newTime);
  }, [localCurrentTime, duration, seekTo]);

  // 音量控制
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  }, [isMuted]);

  const changeVolume = useCallback((newVolume: number) => {
    if (!videoRef.current) return;
    
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    videoRef.current.volume = clampedVolume;
    setVolume(clampedVolume);
    
    if (clampedVolume === 0) {
      setIsMuted(true);
      videoRef.current.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
  }, [isMuted]);

  // 切换预览模式
  const togglePreviewMode = useCallback(() => {
    setPreviewMode(prev => !prev);
  }, []);

  // 拖拽事件处理
  const handleProgressMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const targetDuration = previewMode ? newTimelineDuration : duration;
    const newTime = percentage * targetDuration;
    
    // 记录拖拽前的播放状态
    setWasPlayingBeforeDrag(isPlaying);
    setIsDragging(true);
    setDragTime(newTime);
    setDragPercentage(percentage);
    
    // 暂停视频以便实时预览
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    
    // 立即设置视频时间
    let videoTime = newTime;
    if (previewMode && keptSegments.length > 0) {
      // 将新时间轴时间映射回原始时间
      let remainingTime = Math.max(0, newTime);
      videoTime = keptSegments[0]?.start || 0; // 默认到第一个片段开始
      
      for (const segment of keptSegments) {
        if (remainingTime <= segment.duration) {
          videoTime = segment.start + remainingTime;
          break;
        } else {
          remainingTime -= segment.duration;
        }
      }
      
      // 确保videoTime不超出视频总长度
      if (videoTime > duration) {
        videoTime = duration;
      }
    }
    
    videoRef.current.currentTime = videoTime;
    setLocalCurrentTime(videoTime);
  }, [previewMode, newTimelineDuration, duration, isPlaying, keptSegments]);

  const handleProgressMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !progressBarRef.current || !videoRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, moveX / rect.width));
    const targetDuration = previewMode ? newTimelineDuration : duration;
    const newTime = percentage * targetDuration;
    
    setDragTime(newTime);
    setDragPercentage(percentage);
    
    // 拖拽时直接设置视频时间，跳过 seekTo 中的时间转换逻辑
    let videoTime = newTime;
    if (previewMode && keptSegments.length > 0) {
      // 将新时间轴时间映射回原始时间
      let remainingTime = Math.max(0, newTime);
      videoTime = keptSegments[0]?.start || 0; // 默认到第一个片段开始
      
      for (const segment of keptSegments) {
        if (remainingTime <= segment.duration) {
          videoTime = segment.start + remainingTime;
          break;
        } else {
          remainingTime -= segment.duration;
        }
      }
      
      // 确保videoTime不超出视频总长度
      if (videoTime > duration) {
        videoTime = duration;
      }
    }
    
    videoRef.current.currentTime = videoTime;
    setLocalCurrentTime(videoTime);
  }, [isDragging, previewMode, newTimelineDuration, duration, keptSegments]);

  const handleProgressMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // 确保最终时间状态正确
    if (videoRef.current) {
      const finalTime = videoRef.current.currentTime;
      setLocalCurrentTime(finalTime);
      
      // 通知外部组件时间更新
      const notifyTime = previewMode && keptSegments.length > 0 ? 
        (dragTime || 0) : finalTime;
      onTimeUpdate?.(notifyTime);
    }
    
    // 如果拖拽前在播放，恢复播放状态
    if (wasPlayingBeforeDrag && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      onPlay?.();
    }
  }, [isDragging, wasPlayingBeforeDrag, onPlay, previewMode, keptSegments, dragTime, onTimeUpdate]);

  // 绑定全局拖拽事件
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleProgressMouseMove);
      document.addEventListener('mouseup', handleProgressMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleProgressMouseMove);
        document.removeEventListener('mouseup', handleProgressMouseUp);
      };
    }
  }, [isDragging, handleProgressMouseMove, handleProgressMouseUp]);

  // 全屏
  const toggleFullscreen = useCallback(() => {
    if (!videoRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  }, []);

  // 绑定视频事件
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setVideoDimensions({
        width: video.videoWidth,
        height: video.videoHeight
      });
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [handleTimeUpdate, onPlay, onPause]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(e.shiftKey ? -10 : -5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(e.shiftKey ? 10 : 5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(volume + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(volume - 0.1);
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, skip, changeVolume, volume, toggleMute, toggleFullscreen]);

  if (!videoUrl) {
    return (
      <div className={cn('bg-muted rounded-lg flex items-center justify-center p-12', className)}>
        <div className="text-center">
          <div className="w-16 h-16 bg-muted-foreground/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">请先上传视频文件</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-card rounded-lg overflow-hidden h-full flex flex-col', className)}>
      {/* 视频区域 */}
      <div 
        ref={videoContainerRef}
        className="relative bg-background flex-1 flex items-center justify-center overflow-hidden w-full"
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="max-h-full max-w-full object-contain"
          onClick={togglePlayPause}
        />
        
        {/* 字幕覆盖层 */}
        {subtitleStyle && containerSize && (
          <SubtitleOverlay
            currentTime={previewMode ? newTimelineTime : localCurrentTime}
            style={subtitleStyle}
            onStyleChange={onSubtitleStyleChange || (() => {})}
            containerDimensions={{
              width: containerSize.width || 0,
              height: containerSize.height || 0
            }}
            videoDimensions={videoDimensions}
          />
        )}

        {/* 预览模式指示器 */}
        {previewMode && keptSegments.length > 0 && (
          <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
            预览模式
          </div>
        )}
      </div>

      {/* 控制栏 */}
      <div className="p-4 space-y-4">
        {/* 进度条 */}
        <div className="space-y-2">
          <div className="relative">
            <div 
              ref={progressBarRef}
              className={cn(
                "group w-full h-3 bg-muted rounded-full overflow-hidden cursor-pointer select-none",
                isDragging && "cursor-grabbing"
              )}
              onMouseDown={handleProgressMouseDown}
            >
              {/* 背景进度条 */}
              <div 
                className={cn(
                  "h-full bg-primary/30 transition-all",
                  isDragging && "transition-none"
                )}
                style={{ 
                  width: `${((isDragging ? dragTime : (previewMode ? newTimelineTime : localCurrentTime)) / (previewMode ? newTimelineDuration : duration)) * 100}%` 
                }}
              />
              
              {/* 保留片段显示（在预览模式下） */}
              {previewMode && keptSegments.length > 0 && (
                <>
                  {keptSegments.map((segment, index) => {
                    // 计算在新时间轴上的位置
                    let segmentStartInNewTimeline = 0;
                    for (let i = 0; i < index; i++) {
                      segmentStartInNewTimeline += keptSegments[i].duration;
                    }
                    
                    return (
                      <div
                        key={segment.id}
                        className="absolute top-0 h-full bg-green-500/60 pointer-events-none"
                        style={{
                          left: `${(segmentStartInNewTimeline / newTimelineDuration) * 100}%`,
                          width: `${(segment.duration / newTimelineDuration) * 100}%`,
                        }}
                      />
                    );
                  })}
                </>
              )}
              
              {/* 当前进度 */}
              <div 
                className={cn(
                  "h-full bg-primary transition-all",
                  isDragging && "transition-none"
                )}
                style={{ 
                  width: isDragging 
                    ? `${dragPercentage * 100}%` // 拖拽时直接使用百分比
                    : `${((previewMode ? newTimelineTime : localCurrentTime) / (previewMode ? newTimelineDuration : duration)) * 100}%`
                }}
              />
              
              {/* 拖拽手柄 */}
              <div
                className={cn(
                  "absolute top-1/2 w-4 h-4 bg-primary rounded-full -translate-y-1/2 -translate-x-1/2 border-2 border-background shadow-lg transition-all transform pointer-events-none",
                  isDragging ? "scale-125 transition-none" : "hover:scale-110 opacity-0 group-hover:opacity-100"
                )}
                style={{
                  left: isDragging 
                    ? `${dragPercentage * 100}%` // 拖拽时直接使用鼠标位置百分比
                    : `${((previewMode ? newTimelineTime : localCurrentTime) / (previewMode ? newTimelineDuration : duration)) * 100}%`,
                  opacity: isDragging ? 1 : undefined
                }}
              />
            </div>
            
            {/* 悬停时显示时间提示 */}
            {isDragging && (
              <div
                className="absolute -top-10 bg-background border rounded px-2 py-1 text-xs font-mono shadow-lg pointer-events-none"
                style={{
                  left: `${dragPercentage * 100}%`, // 使用百分比位置
                  transform: 'translateX(-50%)'
                }}
              >
                {formatTime(dragTime)}
              </div>
            )}
          </div>
          
          {/* 时间显示 */}
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {formatTime(isDragging ? dragTime : (previewMode ? newTimelineTime : localCurrentTime))}
              {isDragging && <span className="ml-1 text-primary">●</span>}
            </span>
            <span>{formatTime(previewMode ? newTimelineDuration : duration)}</span>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => skip(-10)}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              title="后退 10 秒"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            
            <button
              onClick={togglePlayPause}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              title={isPlaying ? '暂停' : '播放'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => skip(10)}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              title="前进 10 秒"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* 预览模式切换 */}
            <button
              onClick={togglePreviewMode}
              className={cn(
                'p-2 rounded-md transition-colors',
                previewMode ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
              title={previewMode ? '退出预览模式' : '进入预览模式'}
            >
              {previewMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            {/* 音量控制 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-muted rounded-md transition-colors"
                title={isMuted ? '取消静音' : '静音'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={isMuted ? 0 : volume}
                onChange={(e) => changeVolume(Number(e.target.value))}
                className="w-20"
              />
            </div>

            {/* 全屏 */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              title="全屏"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 预览模式信息 */}
        {previewMode && keptSegments.length > 0 && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
            <div className="flex justify-between">
              <span>预览模式：自动跳过删除片段</span>
              <span>
                节省时间: {formatTime(duration - newTimelineDuration)} 
                ({((newTimelineDuration / duration) * 100).toFixed(1)}% 保留)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}