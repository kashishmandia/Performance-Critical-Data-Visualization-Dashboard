'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DataPoint } from '@/lib/types';
import { generateNewDataPoint } from '@/lib/dataGenerator';

interface UseDataStreamOptions {
  interval?: number; // milliseconds between updates
  maxPoints?: number; // maximum data points to keep
  enabled?: boolean;
}

export function useDataStream(
  initialData: DataPoint[],
  options: UseDataStreamOptions = {}
) {
  const { interval = 100, maxPoints = 10000, enabled = true } = options;
  const [data, setData] = useState<DataPoint[]>(initialData);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimestampRef = useRef<number>(
    initialData.length > 0
      ? Math.max(...initialData.map((d) => d.timestamp))
      : Date.now()
  );

  const addDataPoint = useCallback((newPoint: DataPoint) => {
    setData((prev) => {
      const updated = [...prev, newPoint];
      // Keep only the most recent maxPoints
      if (updated.length > maxPoints) {
        return updated.slice(-maxPoints);
      }
      return updated;
    });
    lastTimestampRef.current = newPoint.timestamp;
  }, [maxPoints]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const newPoint = generateNewDataPoint(lastTimestampRef.current);
      addDataPoint(newPoint);
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, addDataPoint]);

  const reset = useCallback(() => {
    setData(initialData);
    lastTimestampRef.current =
      initialData.length > 0
        ? Math.max(...initialData.map((d) => d.timestamp))
        : Date.now();
  }, [initialData]);

  return {
    data,
    addDataPoint,
    reset,
  };
}

