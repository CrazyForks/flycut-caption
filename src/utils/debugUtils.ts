// 调试工具函数

import type { VideoSegment } from '@/types/video';
import type { SubtitleTranscript } from '@/types/subtitle';

export function debugVideoSegments(
  transcript: SubtitleTranscript | null,
  selectedChunks: Set<string>,
  segments: VideoSegment[]
) {
  if (!transcript) return;

  console.group('🎬 视频片段调试信息');
  
  // 显示原始字幕块状态
  console.log('📝 原始字幕块状态:');
  transcript.chunks.forEach((chunk, i) => {
    const isSelected = selectedChunks.has(chunk.id);
    const status = isSelected ? '❌ 删除' : '✅ 保留';
    console.log(`  ${i + 1}. ${chunk.text} (${chunk.timestamp[0]}s - ${chunk.timestamp[1]}s) ${status}`);
  });

  // 显示生成的视频片段
  console.log('\n🎞️ 生成的视频片段:');
  segments.forEach((segment, i) => {
    const duration = segment.end - segment.start;
    const status = segment.keep ? '✅ 保留' : '❌ 删除';
    console.log(`  片段 ${i + 1}: ${segment.start}s - ${segment.end}s (${duration.toFixed(2)}s) ${status}`);
  });

  // 统计信息
  const totalOriginalDuration = transcript.duration || 0;
  const totalKeptDuration = segments
    .filter(seg => seg.keep)
    .reduce((sum, seg) => sum + (seg.end - seg.start), 0);
  const deletedDuration = totalOriginalDuration - totalKeptDuration;
  
  console.log('\n📊 统计信息:');
  console.log(`  原始总时长: ${totalOriginalDuration.toFixed(2)}s`);
  console.log(`  保留时长: ${totalKeptDuration.toFixed(2)}s`);
  console.log(`  删除时长: ${deletedDuration.toFixed(2)}s`);
  console.log(`  压缩比例: ${((totalKeptDuration / totalOriginalDuration) * 100).toFixed(1)}%`);

  console.groupEnd();
}