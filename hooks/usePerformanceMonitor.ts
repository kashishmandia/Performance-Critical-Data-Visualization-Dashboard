'use client';

import { useState, useEffect, useRef } from 'react';
import { PerformanceMetrics } from '@/lib/types';
import { performanceMonitor, getMemoryUsage } from '@/lib/performanceUtils';

export function usePerformanceMonitor(enabled = true) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    dataProcessingTime: 0,
    frameCount: 0,
    lastFrameTime: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      const frameMetrics = performanceMonitor.getMetrics();
      const memory = getMemoryUsage();

      setMetrics({
        fps: frameMetrics.fps,
        memoryUsage: memory,
        renderTime: frameMetrics.renderTime,
        dataProcessingTime: 0, // Will be updated by data processing hooks
        frameCount: 0,
        lastFrameTime: frameMetrics.frameTime,
      });
    }, 1000); // Update every second

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled]);

  return metrics;
}

