// 文件上传组件

import React, { useCallback, useState, useRef } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from 'react-i18next';
import { 
  isVideoFile, 
  formatFileSize, 
  getVideoInfo, 
  createVideoURL, 
  validateFileType 
} from '@/utils/fileUtils';
import { readFileAsArrayBuffer } from '@/utils/fileUtils';
import type { VideoFile } from '@/types/video';
import { Upload, File, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  className?: string;
  onFileSelect?: (file: VideoFile, audioBuffer: ArrayBuffer) => void;
}

export function FileUpload({ className, onFileSelect }: FileUploadProps) {
  const { t } = useTranslation();
  const setVideoFile = useAppStore((state) => state.setVideoFile);
  const setAppError = useAppStore((state) => state.setError);
  const reset = useAppStore((state) => state.reset);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<VideoFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 支持的文件类型
  const SUPPORTED_TYPES = [
    'video/mp4',
    'video/webm', 
    'video/ogg',
    'video/avi',
    'video/mov',
    'video/quicktime',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/m4a',
  ];

  const handleFileProcessing = useCallback(async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      // 验证文件类型
      if (!validateFileType(file, SUPPORTED_TYPES)) {
        throw new Error(`${t('fileUpload.invalidFileType', { ns: 'components' })}: ${file.type}`);
      }

      // 读取文件为 ArrayBuffer (用于 ASR)
      const audioBuffer = await readFileAsArrayBuffer(file);

      let videoFile: VideoFile;

      if (isVideoFile(file)) {
        // 获取视频信息
        const videoInfo = await getVideoInfo(file);
        
        videoFile = {
          file,
          url: createVideoURL(file),
          duration: videoInfo.duration,
          size: file.size,
          type: file.type,
          name: file.name,
        };
      } else {
        // 音频文件，创建一个简化的 VideoFile 对象
        videoFile = {
          file,
          url: createVideoURL(file),
          duration: 0, // 音频时长需要通过其他方式获取
          size: file.size,
          type: file.type,
          name: file.name,
        };
      }

      setUploadedFile(videoFile);
      
      // 更新应用状态
      setVideoFile(videoFile);

      // 通知父组件
      if (onFileSelect) {
        onFileSelect(videoFile, audioBuffer);
      }

    } catch (err) {
      console.error('文件处理失败:', err);
      const errorMessage = err instanceof Error ? err.message : t('fileUploadFailed', { ns: 'messages' });
      setError(errorMessage);
      setAppError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [setVideoFile, setAppError, onFileSelect]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    handleFileProcessing(file);
  }, [handleFileProcessing]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files);
  }, [handleFileSelect]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    handleFileSelect(event.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    // 只有当鼠标真正离开容器时才取消拖拽状态
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const clearFile = useCallback(() => {
    setUploadedFile(null);
    setError(null);
    reset();
    
    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [reset]);

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_TYPES.join(',')}
        onChange={handleInputChange}
        className="hidden"
      />
      
      {!uploadedFile ? (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={cn(
            'flex flex-col items-center justify-center',
            'border-2 border-dashed rounded-lg p-12 cursor-pointer',
            'transition-colors duration-200',
            'hover:bg-muted/50',
            isDragging 
              ? 'border-primary bg-primary/10' 
              : 'border-muted-foreground/25',
            isProcessing && 'pointer-events-none opacity-50'
          )}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
              <p className="text-sm text-muted-foreground">{t('processingFile', { ns: 'messages' })}</p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-center mb-2">
                {t('fileUpload.dragDropText', { ns: 'components' })}
              </p>
              <p className="text-sm text-muted-foreground text-center">
                {t('fileUpload.supportedFormats', { ns: 'components' })}
                <br />
                MP4, WebM, AVI, MOV, MP3, WAV, OGG
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="flex-shrink-0">
                {error ? (
                  <AlertCircle className="h-8 w-8 text-destructive" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="font-medium truncate">{uploadedFile.name}</p>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{t('size', { ns: 'common' })}: {formatFileSize(uploadedFile.size)}</p>
                  {uploadedFile.duration > 0 && (
                    <p>{t('duration', { ns: 'common' })}: {Math.floor(uploadedFile.duration / 60)}:{Math.floor(uploadedFile.duration % 60).toString().padStart(2, '0')}</p>
                  )}
                  <p>{t('format', { ns: 'common' })}: {uploadedFile.type}</p>
                </div>
                
                {error && (
                  <p className="text-sm text-destructive mt-2">{error}</p>
                )}
              </div>
            </div>
            
            <button
              onClick={clearFile}
              className="flex-shrink-0 p-1 hover:bg-muted rounded-md transition-colors"
              title={t('delete', { ns: 'common' })}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {!error && (
            <div className="mt-4 text-center">
              <p className="text-sm text-green-600">
                ✅ {t('fileUploaded', { ns: 'messages' })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}