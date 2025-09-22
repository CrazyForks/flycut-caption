import FlyCutCaption from './FlyCutCaption'

/**
 * App Component - Demo App using FlyCutCaption
 *
 * This is the main demo application that uses the FlyCutCaption component.
 * It demonstrates how to integrate the component with event handlers.
 */
function App() {
  return (
    <FlyCutCaption
      config={{
        theme: 'auto',
        language: 'zh-CN',
        asrLanguage: 'auto',
        enableDragDrop: true,
        enableExport: true,
        enableVideoProcessing: true,
        maxFileSize: 500,
        supportedFormats: ['mp4', 'webm', 'avi', 'mov', 'mp3', 'wav', 'ogg']
      }}
      onReady={() => {
        console.log('FlyCut Caption is ready')
      }}
      onFileSelected={(file) => {
        console.log('File selected:', file.name)
      }}
      onSubtitleGenerated={(subtitles) => {
        console.log('Subtitles generated:', subtitles.length)
      }}
      onSubtitleChanged={(subtitles) => {
        console.log('Subtitles changed:', subtitles.length)
      }}
      onVideoProcessed={(blob, filename) => {
        console.log('Video processed:', filename, blob.size, 'bytes')
      }}
      onExportComplete={(blob, filename) => {
        console.log('Export complete:', filename, blob.size, 'bytes')
      }}
      onError={(error) => {
        console.error('FlyCut Caption Error:', error)
      }}
      onProgress={(stage, progress) => {
        console.log(`Processing: ${stage} - ${progress}%`)
      }}
    />
  )
}

export default App