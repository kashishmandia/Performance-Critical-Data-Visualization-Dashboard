import { DataPoint, ChartDimensions, RenderData } from './types';

/**
 * Calculate chart dimensions with padding
 */
export function calculateChartDimensions(
  containerWidth: number,
  containerHeight: number,
  padding = { top: 20, right: 20, bottom: 40, left: 60 }
): ChartDimensions {
  return {
    width: containerWidth,
    height: containerHeight,
    padding,
  };
}

/**
 * Transform data points to screen coordinates with zoom/pan support
 */
export function transformToScreenCoords(
  data: DataPoint[],
  dimensions: ChartDimensions,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  zoomPan?: { scale: number; translateX: number; translateY: number }
): RenderData {
  const { width, height, padding } = dimensions;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xRange = bounds.maxX - bounds.minX;
  const yRange = bounds.maxY - bounds.minY;

  // Apply zoom/pan transformation
  const scale = zoomPan?.scale || 1;
  const translateX = zoomPan?.translateX || 0;
  const translateY = zoomPan?.translateY || 0;

  // For large datasets (>5000 points), downsample for better performance
  // We'll use every Nth point based on dataset size
  const shouldDownsample = data.length > 5000;
  const downsampleFactor = shouldDownsample ? Math.ceil(data.length / 5000) : 1;
  
  // Pre-calculate constants for better performance
  const centerX = 0.5;
  const centerY = 0.5;
  const invScale = 1 / scale;
  const translateXNorm = translateX / chartWidth;
  const translateYNorm = translateY / chartHeight;
  const xScale = chartWidth;
  const yScale = chartHeight;

  const points: Array<{ x: number; y: number; value: number; timestamp: number }> = [];
  points.length = shouldDownsample ? Math.ceil(data.length / downsampleFactor) : data.length;
  let pointIndex = 0;

  for (let i = 0; i < data.length; i += downsampleFactor) {
    const point = data[i];
    
    // Normalize to 0-1 range
    const normalizedX = (point.timestamp - bounds.minX) / xRange;
    const normalizedY = (point.value - bounds.minY) / yRange;

    // Apply zoom (scale around center) - optimized calculation
    const zoomedX = centerX + (normalizedX - centerX) * invScale;
    const zoomedY = centerY + (normalizedY - centerY) * invScale;

    // Apply pan (translate)
    const pannedX = zoomedX - translateXNorm;
    const pannedY = zoomedY - translateYNorm;

    // Convert to screen coordinates
    const x = padding.left + pannedX * xScale;
    const y = padding.top + chartHeight - pannedY * yScale;

    points[pointIndex++] = {
      x: Math.round(x),
      y: Math.round(y),
      value: point.value,
      timestamp: point.timestamp,
    };
  }

  return {
    points,
    bounds,
  };
}

/**
 * Calculate bounds from data points
 */
export function calculateBounds(data: DataPoint[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  if (data.length === 0) {
    return {
      minX: 0,
      maxX: 1000,
      minY: 0,
      maxY: 100,
    };
  }

  let minX = data[0].timestamp;
  let maxX = data[0].timestamp;
  let minY = data[0].value;
  let maxY = data[0].value;

  for (const point of data) {
    minX = Math.min(minX, point.timestamp);
    maxX = Math.max(maxX, point.timestamp);
    minY = Math.min(minY, point.value);
    maxY = Math.max(maxY, point.value);
  }

  // Add padding to bounds
  const xPadding = (maxX - minX) * 0.05;
  const yPadding = (maxY - minY) * 0.1;

  return {
    minX: minX - xPadding,
    maxX: maxX + xPadding,
    minY: Math.max(0, minY - yPadding),
    maxY: maxY + yPadding,
  };
}

/**
 * Draw grid lines on canvas with improved styling
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  dimensions: ChartDimensions,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  gridLines = { x: 10, y: 10 }
): void {
  const { width, height, padding } = dimensions;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const theme = getTheme();

  // Draw chart area background based on theme
  if (theme === 'dark') {
    // Deep grey background for dark mode
    ctx.fillStyle = '#1f1f1f';
  } else {
    // Light background for light mode
    ctx.fillStyle = '#fafbfc';
  }
  ctx.fillRect(padding.left, padding.top, chartWidth, chartHeight);

  // Major grid lines (darker)
  if (theme === 'dark') {
    ctx.strokeStyle = '#2a2a2a';
  } else {
    ctx.strokeStyle = '#e5e7eb';
  }
  ctx.lineWidth = 1;
  ctx.setLineDash([]);

  // Vertical grid lines
  for (let i = 0; i <= gridLines.x; i++) {
    const x = padding.left + (i / gridLines.x) * chartWidth;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();
  }

  // Horizontal grid lines
  for (let i = 0; i <= gridLines.y; i++) {
    const y = padding.top + (i / gridLines.y) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  // Minor grid lines (lighter, dashed)
  if (theme === 'dark') {
    ctx.strokeStyle = '#252525';
  } else {
    ctx.strokeStyle = '#f3f4f6';
  }
  ctx.lineWidth = 0.5;
  ctx.setLineDash([2, 2]);

  // Vertical minor lines
  for (let i = 0; i < gridLines.x * 2; i++) {
    if (i % 2 === 0) continue; // Skip major lines
    const x = padding.left + (i / (gridLines.x * 2)) * chartWidth;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();
  }

  // Horizontal minor lines
  for (let i = 0; i < gridLines.y * 2; i++) {
    if (i % 2 === 0) continue; // Skip major lines
    const y = padding.top + (i / (gridLines.y * 2)) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  ctx.setLineDash([]); // Reset line dash
}

/**
 * Draw axes with labels - polished version
 */
export function drawAxes(
  ctx: CanvasRenderingContext2D,
  dimensions: ChartDimensions,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  xLabel = 'Time',
  yLabel = 'Value'
): void {
  const { width, height, padding } = dimensions;

  const theme = getTheme();

  // Draw axes with better styling
  if (theme === 'dark') {
    ctx.strokeStyle = '#4a4a4a';
    ctx.fillStyle = '#a0a0a0';
  } else {
    ctx.strokeStyle = '#374151';
    ctx.fillStyle = '#6b7280';
  }
  ctx.lineWidth = 2;
  ctx.font = '11px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  
  // X-axis with arrow
  ctx.beginPath();
  ctx.moveTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.lineTo(width - padding.right - 5, height - padding.bottom - 3);
  ctx.moveTo(width - padding.right, height - padding.bottom);
  ctx.lineTo(width - padding.right - 5, height - padding.bottom + 3);
  ctx.stroke();

  // Y-axis with arrow
  ctx.beginPath();
  ctx.moveTo(padding.left, height - padding.bottom);
  ctx.lineTo(padding.left, padding.top);
  ctx.lineTo(padding.left - 3, padding.top + 5);
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left + 3, padding.top + 5);
  ctx.stroke();

  // X-axis label
  ctx.save();
  if (theme === 'dark') {
    ctx.fillStyle = '#ffffff';
  } else {
    ctx.fillStyle = '#374151';
  }
  ctx.font = 'bold 12px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.translate(width / 2, height - padding.bottom + 20);
  ctx.fillText(xLabel, 0, 0);
  ctx.restore();

  // Y-axis label
  ctx.save();
  if (theme === 'dark') {
    ctx.fillStyle = '#ffffff';
  } else {
    ctx.fillStyle = '#374151';
  }
  ctx.font = 'bold 12px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(12, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();

  // Y-axis tick marks and labels
  if (theme === 'dark') {
    ctx.strokeStyle = '#4a4a4a';
    ctx.fillStyle = '#a0a0a0';
  } else {
    ctx.strokeStyle = '#9ca3af';
    ctx.fillStyle = '#6b7280';
  }
  ctx.lineWidth = 1;
  ctx.font = '10px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const chartHeight = height - padding.top - padding.bottom;
  const yRange = bounds.maxY - bounds.minY;

  for (let i = 0; i <= 5; i++) {
    const value = bounds.minY + (i / 5) * yRange;
    const y = padding.top + chartHeight - (i / 5) * chartHeight;
    
    // Draw tick mark
    ctx.beginPath();
    ctx.moveTo(padding.left - 5, y);
    ctx.lineTo(padding.left, y);
    ctx.stroke();
    
    // Format number based on magnitude
    let formattedValue: string;
    if (Math.abs(value) >= 1000) {
      formattedValue = (value / 1000).toFixed(1) + 'k';
    } else if (Math.abs(value) >= 1) {
      formattedValue = value.toFixed(1);
    } else {
      formattedValue = value.toFixed(2);
    }
    
    ctx.fillText(formattedValue, padding.left - 8, y);
  }

  // X-axis tick marks and labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const chartWidth = width - padding.left - padding.right;
  const xRange = bounds.maxX - bounds.minX;

  for (let i = 0; i <= 5; i++) {
    const timestamp = bounds.minX + (i / 5) * xRange;
    const x = padding.left + (i / 5) * chartWidth;
    
    // Draw tick mark
    ctx.beginPath();
    ctx.moveTo(x, height - padding.bottom);
    ctx.lineTo(x, height - padding.bottom + 5);
    ctx.stroke();
    
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    ctx.fillText(timeStr, x, height - padding.bottom + 8);
  }
  
  // Reset fill style for theme
  if (theme === 'dark') {
    ctx.fillStyle = '#a0a0a0';
  } else {
    ctx.fillStyle = '#6b7280';
  }
}

// Cache theme to avoid DOM queries on every frame
let cachedTheme: 'dark' | 'light' = 'dark';
let themeCheckTime = 0;
const THEME_CHECK_INTERVAL = 100; // Check theme every 100ms instead of every frame

function getTheme(): 'dark' | 'light' {
  const now = performance.now();
  // Only check theme periodically, not on every frame
  if (now - themeCheckTime > THEME_CHECK_INTERVAL) {
    cachedTheme = typeof document !== 'undefined' 
      ? (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark'
      : 'dark';
    themeCheckTime = now;
  }
  return cachedTheme;
}

/**
 * Clear canvas with polished background
 */
export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height);
  
  const theme = getTheme();
  
  if (theme === 'dark') {
    // Deep grey background for dark mode
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1a1a1a');
    gradient.addColorStop(1, '#151515');
    ctx.fillStyle = gradient;
  } else {
    // White background with subtle gradient for light mode
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#fafbfc');
    ctx.fillStyle = gradient;
  }
  
  ctx.fillRect(0, 0, width, height);
}

/**
 * Set up clipping region for chart area
 */
export function setChartClip(
  ctx: CanvasRenderingContext2D,
  dimensions: ChartDimensions
): void {
  const { width, height, padding } = dimensions;
  ctx.beginPath();
  ctx.rect(padding.left, padding.top, width - padding.left - padding.right, height - padding.top - padding.bottom);
  ctx.clip();
}

/**
 * Reset clipping region
 */
export function resetClip(ctx: CanvasRenderingContext2D): void {
  ctx.restore();
  ctx.save();
}

/**
 * Get point at mouse position (for interaction)
 */
export function getPointAtPosition(
  x: number,
  y: number,
  renderData: RenderData,
  dimensions: ChartDimensions,
  threshold = 5
): { x: number; y: number; value: number; timestamp: number } | null {
  for (const point of renderData.points) {
    const dx = x - point.x;
    const dy = y - point.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= threshold) {
      return point;
    }
  }
  return null;
}

