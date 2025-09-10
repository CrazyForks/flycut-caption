// 时间处理工具函数

/**
 * 将秒数格式化为 HH:MM:SS 或 MM:SS 格式
 */
export function formatTime(seconds: number, includeHours = false): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (includeHours || hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 将时间字符串解析为秒数
 */
export function parseTime(timeString: string): number {
  const parts = timeString.split(':').map(Number);
  
  if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  
  return 0;
}

/**
 * 将秒数格式化为带毫秒的时间格式 (用于字幕)
 */
export function formatTimeWithMs(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '00:00.000';
  
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

/**
 * 计算时间范围的重叠部分
 */
export function getOverlap(
  range1: [number, number], 
  range2: [number, number]
): [number, number] | null {
  const [start1, end1] = range1;
  const [start2, end2] = range2;
  
  const start = Math.max(start1, start2);
  const end = Math.min(end1, end2);
  
  return start < end ? [start, end] : null;
}

/**
 * 检查时间点是否在时间范围内
 */
export function isTimeInRange(time: number, range: [number, number]): boolean {
  const [start, end] = range;
  return time >= start && time <= end;
}

/**
 * 合并相邻的时间段
 */
export function mergeTimeRanges(ranges: [number, number][]): [number, number][] {
  if (ranges.length === 0) return [];
  
  // 按开始时间排序
  const sorted = ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const lastMerged = merged[merged.length - 1];
    
    // 如果当前范围与上一个范围重叠或相邻，则合并
    if (current[0] <= lastMerged[1]) {
      lastMerged[1] = Math.max(lastMerged[1], current[1]);
    } else {
      merged.push(current);
    }
  }
  
  return merged;
}