'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { DataPoint, ChartDimensions } from '@/lib/types';
import {
  calculateBounds,
  calculateChartDimensions,
  drawGrid,
  drawAxes,
  clearCanvas,
} from '@/lib/canvasUtils';
import { performanceMonitor } from '@/lib/performanceUtils';
import { ZoomPanState } from './useZoomPan';

interface UseBarChartRendererOptions {
  width: number;
  height: number;
  color?: string;
  showGrid?: boolean;
  showAxes?: boolean;
  zoomPan?: ZoomPanState;
}

export function useBarChartRenderer(
  data: DataPoint[],
  options: UseBarChartRendererOptions
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const renderRequestedRef = useRef(false);
  const lastRenderTimeRef = useRef(0);
  const { width, height, color = '#10b981', showGrid = true, showAxes = true, zoomPan } = options;

  const dimensions = useMemo<ChartDimensions>(
    () => calculateChartDimensions(width, height),
    [width, height]
  );

  const bounds = useMemo(() => calculateBounds(data), [data]);

  const renderData = useMemo(() => {
    if (data.length === 0) return null;
    return { data, bounds, zoomPan: zoomPan || { scale: 1, translateX: 0, translateY: 0 } };
  }, [data, bounds, zoomPan?.scale, zoomPan?.translateX, zoomPan?.translateY]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !renderData) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const renderStart = performance.now();

    clearCanvas(ctx, width, height);

    if (showGrid) {
      drawGrid(ctx, dimensions, bounds);
    }

    if (showAxes) {
      drawAxes(ctx, dimensions, bounds);
    }

    // Draw bars with clipping and polish
    if (renderData.data.length > 0) {
      ctx.save();
      const { width: chartWidth, height: chartHeight, padding } = dimensions;
      const barWidth = Math.max(1, chartWidth / renderData.data.length);
      const xRange = renderData.bounds.maxX - renderData.bounds.minX;
      const yRange = renderData.bounds.maxY - renderData.bounds.minY;

      // Set clipping to prevent overflow
      ctx.beginPath();
      ctx.rect(padding.left, padding.top, chartWidth, chartHeight);
      ctx.clip();

      // Create gradient for bars
      const gradient = ctx.createLinearGradient(
        padding.left,
        padding.top,
        padding.left,
        height - padding.bottom
      );
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + 'dd');

      ctx.fillStyle = gradient;
      ctx.strokeStyle = color + '80';
      ctx.lineWidth = 0.5;

      const barSpacing = 0.1;
      const effectiveBarWidth = barWidth * (1 - barSpacing);

      // Apply zoom/pan transformation
      const scale = renderData.zoomPan.scale || 1;
      const translateX = renderData.zoomPan.translateX || 0;
      const translateY = renderData.zoomPan.translateY || 0;

      const xAxisY = height - padding.bottom;

      // Pre-calculate constants
      const centerX = 0.5;
      const centerY = 0.5;
      const invScale = 1 / scale;
      const translateXNorm = translateX / chartWidth;
      const translateYNorm = translateY / chartHeight;
      const invXRange = 1 / xRange;
      const invYRange = 1 / yRange;

      // Downsample for large datasets
      const shouldDownsample = renderData.data.length > 5000;
      const downsampleFactor = shouldDownsample ? Math.ceil(renderData.data.length / 5000) : 1;

      const barsToDraw: Array<{ x: number; y: number; w: number; h: number }> = [];

      for (let i = 0; i < renderData.data.length; i += downsampleFactor) {
        const point = renderData.data[i];
        
        const normalizedX = (point.timestamp - renderData.bounds.minX) * invXRange;
        const normalizedY = (point.value - renderData.bounds.minY) * invYRange;
        
        const zoomedX = centerX + (normalizedX - centerX) * invScale;
        const zoomedY = centerY + (normalizedY - centerY) * invScale;
        
        const pannedX = zoomedX - translateXNorm;
        const pannedY = zoomedY - translateYNorm;
        
        const x = padding.left + pannedX * chartWidth;
        
        if (x < padding.left || x > width - padding.right) {
          continue;
        }
        
        const valueScreenY = padding.top + (1 - pannedY) * chartHeight;
        
        if (valueScreenY >= xAxisY) {
          continue;
        }
        
        const barTopY = Math.max(valueScreenY, padding.top);
        const barHeight = xAxisY - barTopY;
        
        if (barHeight <= 0) {
          continue;
        }
        
        const barY = xAxisY - barHeight;
        const barX = x - effectiveBarWidth / 2;
        
        barsToDraw.push({ x: barX, y: barY, w: effectiveBarWidth, h: barHeight });
      }

      // Batch draw all bars
      for (const bar of barsToDraw) {
        ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
        ctx.strokeRect(bar.x, bar.y, bar.w, bar.h);
      }

      ctx.restore();
    }

    const renderTime = performance.now() - renderStart;
    performanceMonitor.update(renderTime);
    lastRenderTimeRef.current = performance.now();
    renderRequestedRef.current = false;
  }, [renderData, width, height, dimensions, bounds, color, showGrid, showAxes]);

  // Request render function - throttles to 60fps
  const requestRender = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0 || height === 0) return;
    
    if (renderRequestedRef.current) return;
    
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;
    const targetFrameTime = 1000 / 60;
    
    if (lastRenderTimeRef.current === 0 || timeSinceLastRender >= targetFrameTime) {
      render();
    } else {
      renderRequestedRef.current = true;
      if (animationFrameRef.current === null) {
        animationFrameRef.current = requestAnimationFrame(() => {
          render();
          animationFrameRef.current = null;
        });
      }
    }
  }, [render, width, height]);

  // Request render when data or zoomPan changes
  useEffect(() => {
    requestRender();
  }, [requestRender, renderData, zoomPan?.scale, zoomPan?.translateX, zoomPan?.translateY]);

  // Update canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    
    lastRenderTimeRef.current = 0;
    requestRender();
  }, [width, height, requestRender]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  return {
    canvasRef,
    render: requestRender,
  };
}

