/**
 * Performance monitoring utilities
 */

export interface FrameMetrics {
  fps: number;
  frameTime: number;
  renderTime: number;
}

class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fpsHistory: number[] = [];
  private frameTimeHistory: number[] = [];
  private readonly historySize = 60; // Keep last 60 frames

  update(renderTime: number): FrameMetrics {
    const now = performance.now();
    const frameTime = now - this.lastTime;
    this.lastTime = now;
    this.frameCount++;

    // Calculate FPS (smoothed over last second)
    const fps = 1000 / frameTime;
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > this.historySize) {
      this.fpsHistory.shift();
    }

    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > this.historySize) {
      this.frameTimeHistory.shift();
    }

    // Calculate average FPS
    const avgFps =
      this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

    return {
      fps: Math.round(avgFps),
      frameTime: Math.round(frameTime * 100) / 100,
      renderTime: Math.round(renderTime * 100) / 100,
    };
  }

  reset(): void {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fpsHistory = [];
    this.frameTimeHistory = [];
  }

  getMetrics(): FrameMetrics {
    const avgFps =
      this.fpsHistory.length > 0
        ? this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
        : 0;
    const avgFrameTime =
      this.frameTimeHistory.length > 0
        ? this.frameTimeHistory.reduce((a, b) => a + b, 0) /
          this.frameTimeHistory.length
        : 0;

    return {
      fps: Math.round(avgFps),
      frameTime: Math.round(avgFrameTime * 100) / 100,
      renderTime: 0,
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Get memory usage (if available)
 */
export function getMemoryUsage(): number {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return Math.round(memory.usedJSHeapSize / 1048576); // Convert to MB
  }
  return 0;
}

/**
 * Measure execution time of a function
 */
export function measureTime<T>(fn: () => T): { result: T; time: number } {
  const start = performance.now();
  const result = fn();
  const time = performance.now() - start;
  return { result, time };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function (this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

