export interface DataPoint {
  timestamp: number;
  value: number;
  category: string;
  metadata?: Record<string, any>;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'scatter' | 'heatmap';
  dataKey: string;
  color: string;
  visible: boolean;
}

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  dataProcessingTime: number;
  frameCount: number;
  lastFrameTime: number;
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface FilterOptions {
  categories: string[];
  minValue?: number;
  maxValue?: number;
}

export interface AggregationPeriod {
  label: string;
  value: number; // milliseconds
}

export interface ChartDimensions {
  width: number;
  height: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface RenderData {
  points: Array<{ x: number; y: number; value: number; timestamp: number }>;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export interface WorkerMessage {
  type: 'process' | 'aggregate' | 'filter';
  data: DataPoint[];
  config?: {
    period?: number;
    filters?: FilterOptions;
  };
}

export interface WorkerResponse {
  type: 'processed' | 'aggregated' | 'filtered' | 'error';
  data?: DataPoint[] | RenderData;
  processingTime?: number;
  error?: string;
}

