// 国际化相关类型定义

export type SupportedLanguage = 'zh' | 'en';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

// 翻译键类型定义
export interface TranslationKeys {
  common: {
    // 按钮
    upload: string;
    download: string;
    export: string;
    import: string;
    save: string;
    cancel: string;
    confirm: string;
    delete: string;
    edit: string;
    preview: string;
    reset: string;
    retry: string;
    loading: string;
    processing: string;
    complete: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    
    // 通用词汇
    file: string;
    video: string;
    audio: string;
    subtitle: string;
    language: string;
    settings: string;
    quality: string;
    format: string;
    duration: string;
    size: string;
    name: string;
    time: string;
    progress: string;
    status: string;
    
    // 状态文本
    ready: string;
    waiting: string;
    failed: string;
    pending: string;
  };
  
  app: {
    title: string;
    subtitle: string;
    
    // 菜单
    fileMenu: string;
    subtitleMenu: string;
    videoMenu: string;
    
    // 菜单项
    reuploadVideo: string;
    exportSubtitle: string;
    processAndExportVideo: string;
    viewInMessageCenter: string;
    
    // 文件上传
    uploadTitle: string;
    uploadDescription: string;
    
    // 状态提示
    videoStatus: string;
    errorOccurred: string;
    processingVideo: string;
    
    // 阶段标题
    subtitleEditor: string;
    subtitleEditorDescription: string;
    recognitionLanguage: string;
    subtitleSettings: string;
    subtitleSettingsDescription: string;
    waitingForVideo: string;
    
    // 导出相关
    noActiveSubtitles: string;
    noVideoToProcess: string;
    videoProcessingFailed: string;
    videoProcessing: string;
  };
  
  components: {
    fileUpload: {
      dragDropText: string;
      clickToSelect: string;
      supportedFormats: string;
      maxFileSize: string;
      selectFile: string;
      invalidFileType: string;
      fileTooLarge: string;
    };
    
    videoPlayer: {
      play: string;
      pause: string;
      mute: string;
      unmute: string;
      fullscreen: string;
      exitFullscreen: string;
      currentTime: string;
      duration: string;
      volume: string;
      playbackRate: string;
      subtitleStyle: string;
    };
    
    asrPanel: {
      selectLanguage: string;
      autoDetect: string;
      startRecognition: string;
      stopRecognition: string;
      recognizing: string;
      recognitionComplete: string;
      recognitionFailed: string;
      modelLoading: string;
      modelLoaded: string;
      deviceType: string;
      cpuMode: string;
      gpuMode: string;
    };
    
    subtitleEditor: {
      timeRange: string;
      content: string;
      selectAll: string;
      deselectAll: string;
      deleteSelected: string;
      noSubtitles: string;
      loadingSubtitles: string;
      subtitleDeleted: string;
      undoDelete: string;
    };
    
    exportDialog: {
      title: string;
      subtitleExport: string;
      videoExport: string;
      format: string;
      quality: string;
      low: string;
      medium: string;
      high: string;
      preserveAudio: string;
      subtitleProcessing: string;
      noSubtitles: string;
      burnInSubtitles: string;
      exportButton: string;
    };
    
    subtitleSettings: {
      fontSize: string;
      fontColor: string;
      backgroundColor: string;
      position: string;
      opacity: string;
      outline: string;
      shadow: string;
      fontFamily: string;
      fontWeight: string;
      textAlign: string;
      lineHeight: string;
      letterSpacing: string;
      preset: string;
      custom: string;
    };
  };
  
  messages: {
    // 成功消息
    fileUploaded: string;
    subtitleExported: string;
    videoExported: string;
    settingsSaved: string;
    
    // 错误消息
    fileUploadFailed: string;
    subtitleExportFailed: string;
    videoExportFailed: string;
    recognitionFailed: string;
    modelLoadFailed: string;
    processingFailed: string;
    unknownError: string;
    workerNotAvailable: string;
    engineNotAvailable: string;
    
    // 进度消息
    analyzingVideo: string;
    loadingModel: string;
    recognizingAudio: string;
    processingVideo: string;
    encodingVideo: string;
    savingFile: string;
    
    // 警告消息
    noActiveChunks: string;
    modelNotReady: string;
    processorNotInitialized: string;
    unsupportedEngine: string;
    noAvailableEngine: string;
  };
}

// 声明模块类型扩展，为 i18next 提供类型支持
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: TranslationKeys;
    returnNull: false;
  }
}