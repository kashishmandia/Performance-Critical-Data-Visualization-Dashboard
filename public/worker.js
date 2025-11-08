// Web Worker for data processing
// This runs in a separate thread to avoid blocking the main thread

self.onmessage = function (e) {
  const { type, data, config } = e.data;

  const startTime = performance.now();

  try {
    let result;
    let processingTime;

    switch (type) {
      case 'process':
        // Process and transform data
        result = processData(data);
        processingTime = performance.now() - startTime;
        self.postMessage({
          type: 'processed',
          data: result,
          processingTime,
        });
        break;

      case 'aggregate':
        // Aggregate data by time period
        result = aggregateData(data, config.period);
        processingTime = performance.now() - startTime;
        self.postMessage({
          type: 'aggregated',
          data: result,
          processingTime,
        });
        break;

      case 'filter':
        // Filter data based on criteria
        result = filterData(data, config.filters);
        processingTime = performance.now() - startTime;
        self.postMessage({
          type: 'filtered',
          data: result,
          processingTime,
        });
        break;

      default:
        self.postMessage({
          type: 'error',
          error: 'Unknown message type',
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message,
    });
  }
};

function processData(data) {
  // Transform data points for rendering
  return data.map((point) => ({
    ...point,
    processed: true,
    normalizedValue: (point.value - getMinValue(data)) / (getMaxValue(data) - getMinValue(data)),
  }));
}

function aggregateData(data, periodMs) {
  if (!periodMs || periodMs === 0) return data;

  const buckets = new Map();
  
  for (const point of data) {
    const bucketTime = Math.floor(point.timestamp / periodMs) * periodMs;
    if (!buckets.has(bucketTime)) {
      buckets.set(bucketTime, []);
    }
    buckets.get(bucketTime).push(point);
  }

  const aggregated = [];
  for (const [bucketTime, points] of buckets.entries()) {
    const avgValue = points.reduce((sum, p) => sum + p.value, 0) / points.length;
    aggregated.push({
      timestamp: bucketTime,
      value: Math.round(avgValue * 100) / 100,
      category: points[0].category,
      metadata: { count: points.length },
    });
  }

  return aggregated.sort((a, b) => a.timestamp - b.timestamp);
}

function filterData(data, filters) {
  if (!filters) return data;

  return data.filter((point) => {
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(point.category)) {
        return false;
      }
    }
    if (filters.minValue !== undefined && point.value < filters.minValue) {
      return false;
    }
    if (filters.maxValue !== undefined && point.value > filters.maxValue) {
      return false;
    }
    return true;
  });
}

function getMinValue(data) {
  return Math.min(...data.map((p) => p.value));
}

function getMaxValue(data) {
  return Math.max(...data.map((p) => p.value));
}

