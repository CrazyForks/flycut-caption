// 视频播放器组件

import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/utils/timeUtils';
import type { VideoPlayerState } from '@/types/video';

interface VideoPlayerProps {
  className?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onLoadedMetadata?: () => void;
}

export interface VideoPlayerRef {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ className, onTimeUpdate, onLoadedMetadata }, ref) => {
    const { state, dispatch } = useAppContext();
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      play: () => {
        videoRef.current?.play();
      },
      pause: () => {
        videoRef.current?.pause();
      },
      seek: (time: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
        }
      },
      setVolume: (volume: number) => {
        if (videoRef.current) {
          videoRef.current.volume = volume;
        }
      },
      setMuted: (muted: boolean) => {
        if (videoRef.current) {
          videoRef.current.muted = muted;
        }
      },
    }));

    // 更新播放状态
    const updatePlayerState = useCallback((updates: Partial<VideoPlayerState>) => {
      dispatch({
        type: 'SET_VIDEO_PLAYER_STATE',
        playerState: updates,
      });
    }, [dispatch]);

    // 播放/暂停切换
    const togglePlay = useCallback(async () => {
      if (!videoRef.current) return;

      try {
        if (state.videoPlayerState.isPlaying) {
          videoRef.current.pause();
        } else {
          await videoRef.current.play();
        }
      } catch (error) {
        console.error('播放控制失败:', error);
        console.error('播放控制错误详情:', { isPlaying: state.videoPlayerState.isPlaying, videoSrc: state.videoFile?.url });
      }
    }, [state.videoPlayerState.isPlaying]);

    // 音量切换
    const toggleMute = useCallback(() => {
      if (!videoRef.current) return;
      
      const newMuted = !state.videoPlayerState.muted;
      videoRef.current.muted = newMuted;
      updatePlayerState({ muted: newMuted });
    }, [state.videoPlayerState.muted, updatePlayerState]);

    // 重置播放
    const resetVideo = useCallback(() => {
      if (!videoRef.current) return;
      
      videoRef.current.currentTime = 0;
      updatePlayerState({ currentTime: 0 });
    }, [updatePlayerState]);

    // 进度条点击
    const handleProgressClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
      if (!videoRef.current || !progressRef.current) return;

      const rect = progressRef.current.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * state.videoPlayerState.duration;

      videoRef.current.currentTime = newTime;
      updatePlayerState({ currentTime: newTime });
    }, [state.videoPlayerState.duration, updatePlayerState]);

    // 音量滑块变化
    const handleVolumeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      if (!videoRef.current) return;
      
      const volume = parseFloat(event.target.value);
      videoRef.current.volume = volume;
      updatePlayerState({ volume, muted: volume === 0 });
    }, [updatePlayerState]);

    // 视频事件处理
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const handleLoadedMetadata = () => {
        updatePlayerState({
          duration: video.duration,
          volume: video.volume,
          muted: video.muted,
        });
        onLoadedMetadata?.();
      };

      const handleTimeUpdate = () => {
        const currentTime = video.currentTime;
        updatePlayerState({ currentTime });
        onTimeUpdate?.(currentTime);
        
        // 同步全局时间状态
        dispatch({
          type: 'SET_CURRENT_TIME',
          time: currentTime,
        });
      };

      const handlePlay = () => {
        updatePlayerState({ isPlaying: true });
      };

      const handlePause = () => {
        updatePlayerState({ isPlaying: false });
      };

      const handleVolumeChange = () => {
        updatePlayerState({
          volume: video.volume,
          muted: video.muted,
        });
      };

      const handleError = (error: Event) => {
        console.error('视频播放错误:', error);
        dispatch({
          type: 'SET_ERROR',
          error: '视频播放失败',
        });
      };

      // 添加事件监听
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('volumechange', handleVolumeChange);
      video.addEventListener('error', handleError);

      return () => {
        // 清理事件监听
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('volumechange', handleVolumeChange);
        video.removeEventListener('error', handleError);
      };
    }, [updatePlayerState, onTimeUpdate, onLoadedMetadata, dispatch]);

    // 外部时间同步
    useEffect(() => {
      if (videoRef.current && Math.abs(videoRef.current.currentTime - state.currentTime) > 0.1) {
        videoRef.current.currentTime = state.currentTime;
      }
    }, [state.currentTime]);

    if (!state.videoFile) {
      return (
        <div className={cn(
          'bg-muted rounded-lg flex items-center justify-center h-64',
          className
        )}>
          <p className="text-muted-foreground">请先上传视频文件</p>
        </div>
      );
    }

    return (
      <div className={cn('bg-black rounded-lg overflow-hidden', className)}>
        {/* 视频元素 */}
        <video
          ref={videoRef}
          src={state.videoFile.url}
          className="w-full h-auto"
          preload="metadata"
        />

        {/* 控制栏 */}
        <div className="bg-black/80 p-4 space-y-3">
          {/* 进度条 */}
          <div className="space-y-1">
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              className="w-full h-2 bg-gray-600 rounded cursor-pointer relative"
            >
              <div
                className="h-full bg-primary rounded transition-all duration-100"
                style={{
                  width: `${(state.videoPlayerState.currentTime / state.videoPlayerState.duration) * 100 || 0}%`,
                }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-white">
              <span>{formatTime(state.videoPlayerState.currentTime)}</span>
              <span>{formatTime(state.videoPlayerState.duration)}</span>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* 播放/暂停 */}
              <button
                onClick={togglePlay}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {state.videoPlayerState.isPlaying ? (
                  <Pause className="h-5 w-5 text-white" />
                ) : (
                  <Play className="h-5 w-5 text-white" />
                )}
              </button>

              {/* 重置 */}
              <button
                onClick={resetVideo}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="重置到开头"
              >
                <RotateCcw className="h-4 w-4 text-white" />
              </button>

              {/* 时间显示 */}
              <div className="text-sm text-white">
                {formatTime(state.videoPlayerState.currentTime)} / {formatTime(state.videoPlayerState.duration)}
              </div>
            </div>

            {/* 音量控制 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {state.videoPlayerState.muted || state.videoPlayerState.volume === 0 ? (
                  <VolumeX className="h-4 w-4 text-white" />
                ) : (
                  <Volume2 className="h-4 w-4 text-white" />
                )}
              </button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={state.videoPlayerState.muted ? 0 : state.videoPlayerState.volume}
                onChange={handleVolumeChange}
                className="w-20"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;