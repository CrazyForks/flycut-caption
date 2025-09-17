// 字幕覆盖层组件 - 使用 Canvas 渲染字幕（参考 WebAV EmbedSubtitlesClip）
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useChunks } from '@/stores/historyStore';
import type { SubtitleStyle } from '@/components/SubtitleSettings';

interface SubtitleOverlayProps {
  currentTime: number;
  style: SubtitleStyle;
  onStyleChange: (style: SubtitleStyle) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  className?: string;
}

export function SubtitleOverlay({
  currentTime,
  style,
  onStyleChange,
  containerRef,
  className
}: SubtitleOverlayProps) {
  const chunks = useChunks();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const subtitleContainerRef = useRef<HTMLDivElement>(null);
  
  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartOffset, setDragStartOffset] = useState(0);
  
  // Canvas 尺寸状态
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  
  // 获取当前时间对应的字幕 - 参考 WebAV 的时间匹配逻辑
  const currentSubtitle = useMemo(() => {
    if (!chunks || chunks.length === 0) return null;
    
    // 查找当前时间段的字幕，参考 WebAV 的 tick 方法
    return chunks.find(chunk => 
      !chunk.deleted && 
      currentTime >= chunk.timestamp[0] && 
      currentTime <= chunk.timestamp[1] &&
      chunk.text && chunk.text.trim() !== ''
    ) || null;
  }, [chunks, currentTime]);

  // Canvas 渲染函数 - 参考 WebAV 的 #renderTxt 方法
  const renderSubtitleToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentSubtitle) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    
    // 清空画布 - 对应 WebAV 的清空操作
    ctx.clearRect(0, 0, width, height);

    // 设置字体样式 - 对应 WebAV 的 fontFamily, fontSize, fontWeight, fontStyle
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
    ctx.textAlign = style.textAlign;
    ctx.textBaseline = 'bottom';

    // 设置字母间距 - 对应 WebAV 的 letterSpacing
    if (style.letterSpacing !== 0) {
      ctx.letterSpacing = `${style.letterSpacing}px`;
    }

    // 处理多行文本 - 参考 WebAV 支持换行符分割
    const text = currentSubtitle.text;
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    // 计算文本位置
    const centerX = width / 2;
    const bottomY = height - style.bottomOffset;
    const lineHeight = style.fontSize * style.lineHeight;
    const totalHeight = lines.length * lineHeight;
    
    // 从下往上绘制文本行
    lines.forEach((line, index) => {
      const y = bottomY - (lines.length - 1 - index) * lineHeight;
      
      // 绘制文字背景 - 对应 WebAV 的 textBgColor
      if (style.backgroundOpacity > 0) {
        const textMetrics = ctx.measureText(line);
        const textWidth = textMetrics.width;
        const bgPadding = style.backgroundPadding;
        
        ctx.fillStyle = `${style.backgroundColor}${Math.round(style.backgroundOpacity * 255).toString(16).padStart(2, '0')}`;
        
        let bgX = centerX - textWidth / 2 - bgPadding;
        if (style.textAlign === 'left') bgX = centerX - textWidth - bgPadding;
        if (style.textAlign === 'right') bgX = centerX - bgPadding;
        
        // 绘制圆角矩形背景
        ctx.beginPath();
        ctx.roundRect(
          bgX,
          y - style.fontSize - bgPadding,
          textWidth + bgPadding * 2,
          lineHeight + bgPadding,
          style.backgroundRadius
        );
        ctx.fill();
      }
      
      // 设置文字阴影 - 对应 WebAV 的 textShadow
      if (style.shadowBlur > 0) {
        ctx.shadowColor = style.shadowColor;
        ctx.shadowOffsetX = style.shadowOffsetX;
        ctx.shadowOffsetY = style.shadowOffsetY;
        ctx.shadowBlur = style.shadowBlur;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;
      }
      
      // 绘制文字描边 - 对应 WebAV 的 strokeStyle, lineWidth, lineCap, lineJoin
      if (style.borderWidth > 0) {
        ctx.strokeStyle = style.borderColor;
        ctx.lineWidth = style.borderWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeText(line, centerX, y);
      }
      
      // 绘制文字填充 - 对应 WebAV 的 color 和 fillStyle
      ctx.fillStyle = style.color;
      ctx.fillText(line, centerX, y);
    });
  }, [currentSubtitle, style, canvasSize]);

  // 监听容器尺寸变化，更新 Canvas 尺寸
  useEffect(() => {
    if (!containerRef.current) return;

    const updateCanvasSize = () => {
      const container = containerRef.current;
      if (!container) return;

      const { width, height } = container.getBoundingClientRect();
      setCanvasSize({ width, height });
    };

    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(containerRef.current);
    updateCanvasSize();

    return () => resizeObserver.disconnect();
  }, [containerRef]);

  // 当 Canvas 尺寸或字幕内容变化时重新渲染
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 设置 Canvas 物理尺寸
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // 渲染字幕
    renderSubtitleToCanvas();
  }, [canvasSize, renderSubtitleToCanvas]);

  // 处理拖拽开始
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    e.preventDefault();
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragStartOffset(style.bottomOffset);
    
    // 添加拖拽样式
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }, [style.bottomOffset]);

  // 处理拖拽移动
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const deltaY = dragStartY - e.clientY; // 向上为正
    const containerHeight = containerRect.height;
    
    // 计算新的底部偏移量
    let newOffset = dragStartOffset + deltaY;
    
    // 限制拖拽范围（20px 到容器高度的80%）
    newOffset = Math.max(20, Math.min(containerHeight * 0.8, newOffset));
    
    onStyleChange({ ...style, bottomOffset: newOffset });
  }, [isDragging, dragStartY, dragStartOffset, style, onStyleChange, containerRef]);

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [isDragging]);

  // 绑定全局拖拽事件
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // 如果字幕不可见，返回空 Canvas
  if (!style.visible) {
    return null;
  }

  return (
    <div className={cn('absolute inset-0 pointer-events-none', className)}>
      {/* Canvas 字幕渲染 - 完全参考 WebAV EmbedSubtitlesClip 的实现方式 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-auto"
        style={{
          cursor: isDragging ? 'ns-resize' : currentSubtitle ? 'ns-resize' : 'default',
          opacity: isDragging ? 0.8 : 1,
          transition: isDragging ? 'none' : 'opacity 0.2s ease',
        }}
        onMouseDown={currentSubtitle ? handleDragStart : undefined}
        title={currentSubtitle ? "拖拽调整字幕位置" : undefined}
      />
      
      {/* 拖拽提示线 */}
      {isDragging && currentSubtitle && (
        <div
          className="absolute left-0 right-0 border-t border-dashed border-primary/60 pointer-events-none"
          style={{ bottom: `${style.bottomOffset}px` }}
        />
      )}
      
      {/* 拖拽辅助区域 - 增强交互体验 */}
      {!isDragging && currentSubtitle && (
        <div
          className="absolute left-1/2 transform -translate-x-1/2 w-20 h-8 opacity-0 hover:opacity-20 bg-primary rounded cursor-ns-resize pointer-events-auto transition-opacity"
          style={{ bottom: `${style.bottomOffset - 16}px` }}
          onMouseDown={handleDragStart}
          title="点击拖拽调整字幕位置"
        />
      )}
    </div>
  );
}