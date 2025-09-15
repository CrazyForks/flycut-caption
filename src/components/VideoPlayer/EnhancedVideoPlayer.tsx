// 增强的视频播放器 - 支持区间播放和预览

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/utils/timeUtils';
import { useChunks } from '@/stores/historyStore';
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
}

export function EnhancedVideoPlayer({
  className,
  videoUrl,
  onTimeUpdate,
  onPlay,
  onPause
}: EnhancedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const chunks = useChunks();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [previewMode, setPreviewMode] = useState(true); // 预览模式：跳过删除片段
  
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
    if (!videoRef.current) return;
    
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
  }, [previewMode, keptSegments, isPlaying, isTimeInKeptSegments, findNextKeptSegment, newTimelineTime, onTimeUpdate, onPause, localCurrentTime]);

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
      let remainingTime = time;
      targetTime = 0;
      
      for (const segment of keptSegments) {
        if (remainingTime <= segment.duration) {
          targetTime = segment.start + remainingTime;
          break;
        } else {
          remainingTime -= segment.duration;
        }
      }
      
      // 如果时间超出了所有保留片段，跳转到最后一个片段的结束
      if (remainingTime > 0 && keptSegments.length > 0) {
        const lastSegment = keptSegments[keptSegments.length - 1];
        targetTime = lastSegment.end;
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
      <div className="relative bg-black flex-1 flex items-center justify-center h-full w-full">
        <video
          ref={videoRef}
          src={videoUrl}
          className="max-h-full max-w-full object-contain"
          onClick={togglePlayPause}
        />
        
        {/* 播放覆盖层 */}
        {!isPlaying && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
            onClick={togglePlayPause}
          >
            <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
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
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              {/* 背景进度条 */}
              <div 
                className="h-full bg-primary/30 transition-all"
                style={{ 
                  width: `${(newTimelineTime / newTimelineDuration) * 100}%` 
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
                        className="absolute top-0 h-full bg-green-500/60"
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
                className="h-full bg-primary transition-all"
                style={{ 
                  width: `${(newTimelineTime / newTimelineDuration) * 100}%` 
                }}
              />
            </div>
            
            {/* 可拖拽的进度控制 */}
            <input
              type="range"
              min={0}
              max={previewMode ? newTimelineDuration : duration}
              value={previewMode ? newTimelineTime : localCurrentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          
          {/* 时间显示 */}
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTime(previewMode ? newTimelineTime : localCurrentTime)}</span>
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