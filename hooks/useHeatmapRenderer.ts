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

interface UseHeatmapRendererOptions {
  width: number;
  height: number;
  showGrid?: boolean;
  showAxes?: boolean;
  zoomPan?: ZoomPanState;
}

export function useHeatmapRenderer(
  data: DataPoint[],
  options: UseHeatmapRendererOptions
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const renderRequestedRef = useRef(false);
  const lastRenderTimeRef = useRef(0);
  const { width, height, showGrid = true, showAxes = true, zoomPan } = options;

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

    // Draw heatmap with clipping
    if (renderData.data.length > 0) {
      ctx.save();
      const { width: chartWidth, height: chartHeight, padding } = dimensions;
      const gridSize = 50;
      const cellWidth = chartWidth / gridSize;
      const cellHeight = chartHeight / gridSize;

      // Set clipping to prevent overflow
      ctx.beginPath();
      ctx.rect(padding.left, padding.top, chartWidth, chartHeight);
      ctx.clip();

      // Calculate heatmap grid on-demand
      const xRange = renderData.bounds.maxX - renderData.bounds.minX;
      const yRange = renderData.bounds.maxY - renderData.bounds.minY;
      
      // Pre-calculate constants
      const scale = renderData.zoomPan.scale || 1;
      const translateX = renderData.zoomPan.translateX || 0;
      const translateY = renderData.zoomPan.translateY || 0;
      const centerX = 0.5;
      const centerY = 0.5;
      const invScale = 1 / scale;
      const translateXNorm = translateX / chartWidth;
      const translateYNorm = translateY / chartHeight;
      const invXRange = 1 / xRange;
      const invYRange = 1 / yRange;

      // Aggressive downsampling for heatmap
      const shouldDownsample = renderData.data.length > 3000;
      const downsampleFactor = shouldDownsample ? Math.ceil(renderData.data.length / 3000) : 1;

      const grid = new Map<string, number>();

      // Optimized loop with early exits
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
        
        const gridX = Math.floor(pannedX * gridSize);
        const gridY = Math.floor(pannedY * gridSize);
        
        // Skip cells outside bounds
        if (gridX < 0 || gridX >= gridSize || gridY < 0 || gridY >= gridSize) {
          continue;
        }
        
        const key = `${gridX},${gridY}`;
        grid.set(key, (grid.get(key) || 0) + 1);
      }

      // Find max count for normalization
      let maxCount = 0;
      for (const count of grid.values()) {
        maxCount = Math.max(maxCount, count);
      }

      // Improved color scheme: blue -> cyan -> yellow -> red
      const getHeatmapColor = (intensity: number): string => {
        if (intensity <= 0.33) {
          const t = intensity / 0.33;
          const r = 0;
          const g = Math.floor(t * 255);
          const b = 255;
          return `rgb(${r}, ${g}, ${b})`;
        } else if (intensity <= 0.66) {
          const t = (intensity - 0.33) / 0.33;
          const r = Math.floor(t * 255);
          const g = 255;
          const b = Math.floor((1 - t) * 255);
          return `rgb(${r}, ${g}, ${b})`;
        } else {
          const t = (intensity - 0.66) / 0.34;
          const r = 255;
          const g = Math.floor((1 - t) * 255);
          const b = 0;
          return `rgb(${r}, ${g}, ${b})`;
        }
      };

      // Draw cells
      for (const [key, count] of grid.entries()) {
        const [gridX, gridY] = key.split(',').map(Number);
        
        if (gridX < 0 || gridX >= gridSize || gridY < 0 || gridY >= gridSize) {
          continue;
        }

        const intensity = count / maxCount;
        const x = padding.left + gridX * cellWidth;
        const y = padding.top + gridY * cellHeight;

        ctx.fillStyle = getHeatmapColor(intensity);
        ctx.fillRect(x, y, cellWidth, cellHeight);
        
        if (intensity > 0.1) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, cellWidth, cellHeight);
        }
      }

      ctx.restore();
    }

    const renderTime = performance.now() - renderStart;
    performanceMonitor.update(renderTime);
    lastRenderTimeRef.current = performance.now();
    renderRequestedRef.current = false;
  }, [renderData, width, height, dimensions, bounds, showGrid, showAxes]);

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

