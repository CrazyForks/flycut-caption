interface CreateFileWriterOptions {
  filename: string;
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
}

export async function createFileWriter(
  options: CreateFileWriterOptions,
): Promise<FileSystemWritableFileStream> {
  if (!('showSaveFilePicker' in window) || !window.showSaveFilePicker) {
    throw new Error('File System Access API not supported');
  }
  
  const fileHandle = await window.showSaveFilePicker({
    suggestedName: options.filename,
    types: options.types,
  });
  return fileHandle.createWritable();
}

export async function saveFile(
  blob: Blob, 
  filename: string, 
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>
): Promise<void> {
  try {
    if ('showSaveFilePicker' in window && window.showSaveFilePicker) {
      const writable = await createFileWriter({ filename, types });
      await writable.write(blob);
      await writable.close();
    } else {
      // 降级到传统下载方式
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
  } catch (error) {
    console.error('保存文件失败:', error);
    // 如果用户取消了文件选择或其他错误，降级到传统下载
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}