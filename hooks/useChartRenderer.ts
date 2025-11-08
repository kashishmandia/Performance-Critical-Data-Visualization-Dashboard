'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { DataPoint, ChartDimensions } from '@/lib/types';
import {
  calculateBounds,
  transformToScreenCoords,
  calculateChartDimensions,
  drawGrid,
  drawAxes,
  clearCanvas,
} from '@/lib/canvasUtils';
import { performanceMonitor } from '@/lib/performanceUtils';
import { ZoomPanState } from './useZoomPan';

interface UseChartRendererOptions {
  width: number;
  height: number;
  color?: string;
  showGrid?: boolean;
  showAxes?: boolean;
  zoomPan?: ZoomPanState;
}

export function useChartRenderer(
  data: DataPoint[],
  options: UseChartRendererOptions
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const renderRequestedRef = useRef(false);
  const lastRenderTimeRef = useRef(0);
  const { width, height, color = '#3b82f6', showGrid = true, showAxes = true, zoomPan } = options;

  const dimensions = useMemo<ChartDimensions>(
    () => calculateChartDimensions(width, height),
    [width, height]
  );

  const bounds = useMemo(() => calculateBounds(data), [data]);

  const renderData = useMemo(() => {
    if (data.length === 0) return null;
    return transformToScreenCoords(data, dimensions, bounds, zoomPan);
  }, [data, dimensions, bounds, zoomPan?.scale, zoomPan?.translateX, zoomPan?.translateY]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !renderData) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const renderStart = performance.now();

    // Clear and setup
    clearCanvas(ctx, width, height);

    // Draw grid
    if (showGrid) {
      drawGrid(ctx, dimensions, bounds);
    }

    // Draw axes
    if (showAxes) {
      drawAxes(ctx, dimensions, bounds);
    }

    // Draw line with clipping and polish
    const points = renderData.points;
    if (points.length > 0) {
      ctx.save();
      
      // Set clipping to prevent overflow
      const { width: chartWidth, height: chartHeight, padding } = dimensions;
      ctx.beginPath();
      ctx.rect(padding.left, padding.top, chartWidth, chartHeight);
      ctx.clip();

      // Create gradient for line
      const gradient = ctx.createLinearGradient(
        padding.left,
        padding.top,
        padding.left,
        height - padding.bottom
      );
      gradient.addColorStop(0, color + 'ff');
      gradient.addColorStop(1, color + 'cc');

      // Draw line with smooth rendering
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = color + '30';
      ctx.shadowBlur = 4;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      // Draw area fill under line (only for smaller datasets for performance)
      if (points.length < 5000) {
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.1;
        ctx.beginPath();
        ctx.moveTo(points[0].x, height - dimensions.padding.bottom);
        ctx.lineTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.lineTo(points[points.length - 1].x, height - dimensions.padding.bottom);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Draw points only for smaller datasets (performance optimization)
      if (points.length < 1000) {
        ctx.fillStyle = color;
        ctx.shadowBlur = 2;
        for (const point of points) {
          // Only draw if within bounds
          if (point.x >= padding.left && point.x <= width - padding.right &&
              point.y >= padding.top && point.y <= height - padding.bottom) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
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
    if (!canvas || width === 0 || height === 0) return; // Don't render if canvas not ready
    
    if (renderRequestedRef.current) return; // Already requested
    
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;
    const targetFrameTime = 1000 / 60; // 60fps = ~16.67ms per frame
    
    // Always render on first call (when lastRenderTimeRef is 0)
    if (lastRenderTimeRef.current === 0 || timeSinceLastRender >= targetFrameTime) {
      // Render immediately if enough time has passed or first render
      render();
    } else {
      // Schedule render for next frame
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
    
    // Reset render time to force immediate render after canvas setup
    lastRenderTimeRef.current = 0;
    // Render after canvas resize
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
