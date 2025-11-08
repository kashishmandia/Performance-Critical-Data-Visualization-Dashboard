import { DataPoint } from './types';

/**
 * Generates realistic time-series data for testing
 */
export function generateInitialDataset(count: number = 10000): DataPoint[] {
  const data: DataPoint[] = [];
  const now = Date.now();
  const categories = ['temperature', 'humidity', 'pressure', 'voltage', 'current'];
  
  // Generate data points over the last hour
  const startTime = now - 3600000; // 1 hour ago
  const interval = 3600000 / count; // Evenly distributed
  
  for (let i = 0; i < count; i++) {
    const timestamp = startTime + i * interval;
    const category = categories[i % categories.length];
    
    // Generate realistic values with some noise
    let baseValue: number;
    switch (category) {
      case 'temperature':
        baseValue = 20 + 10 * Math.sin((i / count) * Math.PI * 2) + Math.random() * 2;
        break;
      case 'humidity':
        baseValue = 50 + 20 * Math.cos((i / count) * Math.PI * 3) + Math.random() * 5;
        break;
      case 'pressure':
        baseValue = 1013 + 10 * Math.sin((i / count) * Math.PI * 4) + Math.random() * 1;
        break;
      case 'voltage':
        baseValue = 220 + 10 * Math.sin((i / count) * Math.PI * 5) + Math.random() * 2;
        break;
      case 'current':
        baseValue = 5 + 2 * Math.cos((i / count) * Math.PI * 6) + Math.random() * 0.5;
        break;
      default:
        baseValue = 100 + Math.random() * 50;
    }
    
    data.push({
      timestamp,
      value: Math.round(baseValue * 100) / 100,
      category,
      metadata: {
        sensorId: `sensor-${i % 10}`,
        quality: Math.random() > 0.1 ? 'good' : 'degraded',
      },
    });
  }
  
  return data;
}

/**
 * Generates a new data point for real-time updates
 */
export function generateNewDataPoint(lastTimestamp: number): DataPoint {
  const categories = ['temperature', 'humidity', 'pressure', 'voltage', 'current'];
  const category = categories[Math.floor(Math.random() * categories.length)];
  
  let baseValue: number;
  switch (category) {
    case 'temperature':
      baseValue = 20 + 10 * Math.sin(Date.now() / 10000) + (Math.random() - 0.5) * 2;
      break;
    case 'humidity':
      baseValue = 50 + 20 * Math.cos(Date.now() / 15000) + (Math.random() - 0.5) * 5;
      break;
    case 'pressure':
      baseValue = 1013 + 10 * Math.sin(Date.now() / 20000) + (Math.random() - 0.5) * 1;
      break;
    case 'voltage':
      baseValue = 220 + 10 * Math.sin(Date.now() / 25000) + (Math.random() - 0.5) * 2;
      break;
    case 'current':
      baseValue = 5 + 2 * Math.cos(Date.now() / 30000) + (Math.random() - 0.5) * 0.5;
      break;
    default:
      baseValue = 100 + Math.random() * 50;
  }
  
  return {
    timestamp: Math.max(lastTimestamp + 100, Date.now()),
    value: Math.round(baseValue * 100) / 100,
    category,
    metadata: {
      sensorId: `sensor-${Math.floor(Math.random() * 10)}`,
      quality: Math.random() > 0.1 ? 'good' : 'degraded',
    },
  };
}

/**
 * Aggregates data points by time period
 */
export function aggregateData(
  data: DataPoint[],
  periodMs: number
): DataPoint[] {
  if (data.length === 0) return [];
  
  const aggregated: DataPoint[] = [];
  const buckets = new Map<number, DataPoint[]>();
  
  // Group data points into time buckets
  for (const point of data) {
    const bucketTime = Math.floor(point.timestamp / periodMs) * periodMs;
    if (!buckets.has(bucketTime)) {
      buckets.set(bucketTime, []);
    }
    buckets.get(bucketTime)!.push(point);
  }
  
  // Calculate average for each bucket
  for (const [bucketTime, points] of buckets.entries()) {
    const avgValue = points.reduce((sum, p) => sum + p.value, 0) / points.length;
    const categories = [...new Set(points.map(p => p.category))];
    
    aggregated.push({
      timestamp: bucketTime,
      value: Math.round(avgValue * 100) / 100,
      category: categories.join(','),
      metadata: {
        count: points.length,
        categories: categories.length,
      },
    });
  }
  
  return aggregated.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Filters data points based on criteria
 */
export function filterData(
  data: DataPoint[],
  filters: {
    categories?: string[];
    minValue?: number;
    maxValue?: number;
    timeRange?: { start: number; end: number };
  }
): DataPoint[] {
  return data.filter((point) => {
    if (filters.categories && !filters.categories.includes(point.category)) {
      return false;
    }
    if (filters.minValue !== undefined && point.value < filters.minValue) {
      return false;
    }
    if (filters.maxValue !== undefined && point.value > filters.maxValue) {
      return false;
    }
    if (filters.timeRange) {
      if (
        point.timestamp < filters.timeRange.start ||
        point.timestamp > filters.timeRange.end
      ) {
        return false;
      }
    }
    return true;
  });
}

