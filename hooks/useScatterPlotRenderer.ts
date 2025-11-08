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

interface UseScatterPlotRendererOptions {
  width: number;
  height: number;
  color?: string;
  showGrid?: boolean;
  showAxes?: boolean;
  pointSize?: number;
  zoomPan?: ZoomPanState;
}

export function useScatterPlotRenderer(
  data: DataPoint[],
  options: UseScatterPlotRendererOptions
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const renderRequestedRef = useRef(false);
  const lastRenderTimeRef = useRef(0);
  const { width, height, color = '#f59e0b', showGrid = true, showAxes = true, pointSize = 3, zoomPan } = options;

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

    // Draw scatter points with clipping
    if (renderData.data.length > 0) {
      ctx.save();
      const { width: chartWidth, height: chartHeight, padding } = dimensions;
      const xRange = renderData.bounds.maxX - renderData.bounds.minX;
      const yRange = renderData.bounds.maxY - renderData.bounds.minY;

      // Set clipping to prevent overflow
      ctx.beginPath();
      ctx.rect(padding.left, padding.top, chartWidth, chartHeight);
      ctx.clip();

      // Optimize: only draw points within visible area
      const minX = padding.left;
      const maxX = width - padding.right;
      const minY = padding.top;
      const maxY = height - padding.bottom;

      // Apply zoom/pan transformation
      const scale = renderData.zoomPan.scale || 1;
      const translateX = renderData.zoomPan.translateX || 0;
      const translateY = renderData.zoomPan.translateY || 0;

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

      // Set shadow and fill style once
      ctx.shadowColor = color + '40';
      ctx.shadowBlur = 3;
      ctx.fillStyle = color;

      // Batch draw points
      ctx.beginPath();
      let hasPoints = false;

      for (let i = 0; i < renderData.data.length; i += downsampleFactor) {
        const point = renderData.data[i];
        
        const normalizedX = (point.timestamp - renderData.bounds.minX) * invXRange;
        const normalizedY = (point.value - renderData.bounds.minY) * invYRange;
        
        const zoomedX = centerX + (normalizedX - centerX) * invScale;
        const zoomedY = centerY + (normalizedY - centerY) * invScale;
        
        const pannedX = zoomedX - translateXNorm;
        const pannedY = zoomedY - translateYNorm;
        
        // Skip points outside normalized range
        if (pannedX < 0 || pannedX > 1 || pannedY < 0 || pannedY > 1) {
          continue;
        }
        
        const x = padding.left + pannedX * chartWidth;
        const y = padding.top + chartHeight - pannedY * chartHeight;

        // Skip points outside visible area
        if (x < minX - pointSize || x > maxX + pointSize || 
            y < minY - pointSize || y > maxY + pointSize) {
          continue;
        }

        ctx.moveTo(x + pointSize, y);
        ctx.arc(x, y, pointSize, 0, Math.PI * 2);
        hasPoints = true;
      }

      // Draw all points at once
      if (hasPoints) {
        ctx.fill();
      }

      ctx.restore();
    }

    const renderTime = performance.now() - renderStart;
    performanceMonitor.update(renderTime);
    lastRenderTimeRef.current = performance.now();
    renderRequestedRef.current = false;
  }, [renderData, width, height, dimensions, bounds, color, showGrid, showAxes, pointSize]);

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

