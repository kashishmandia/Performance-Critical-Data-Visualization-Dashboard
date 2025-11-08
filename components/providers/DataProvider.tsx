'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { DataPoint, FilterOptions, TimeRange, AggregationPeriod } from '@/lib/types';
import { filterData, aggregateData } from '@/lib/dataGenerator';

interface DataContextValue {
  data: DataPoint[];
  filteredData: DataPoint[];
  aggregatedData: DataPoint[];
  filters: FilterOptions;
  timeRange: TimeRange | null;
  aggregationPeriod: AggregationPeriod | null;
  setFilters: (filters: FilterOptions) => void;
  setTimeRange: (range: TimeRange | null) => void;
  setAggregationPeriod: (period: AggregationPeriod | null) => void;
  updateData: (newData: DataPoint[]) => void;
  addDataPoint: (point: DataPoint) => void;
  reset: () => void;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
  initialData: DataPoint[];
}

export function DataProvider({ children, initialData }: DataProviderProps) {
  const [data, setData] = useState<DataPoint[]>(initialData);
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    minValue: undefined,
    maxValue: undefined,
  });
  const [timeRange, setTimeRange] = useState<TimeRange | null>(null);
  const [aggregationPeriod, setAggregationPeriod] = useState<AggregationPeriod | null>(null);

  const filteredData = useMemo(() => {
    let result = data;

    // Apply filters
    if (filters.categories.length > 0 || filters.minValue !== undefined || filters.maxValue !== undefined) {
      result = filterData(result, {
        categories: filters.categories.length > 0 ? filters.categories : undefined,
        minValue: filters.minValue,
        maxValue: filters.maxValue,
      });
    }

    // Apply time range
    if (timeRange) {
      result = filterData(result, {
        timeRange: {
          start: timeRange.start,
          end: timeRange.end,
        },
      });
    }

    return result;
  }, [data, filters, timeRange]);

  const aggregatedData = useMemo(() => {
    if (!aggregationPeriod) {
      return filteredData;
    }
    return aggregateData(filteredData, aggregationPeriod.value);
  }, [filteredData, aggregationPeriod]);

  const updateData = useCallback((newData: DataPoint[]) => {
    setData(newData);
  }, []);

  const addDataPoint = useCallback((point: DataPoint) => {
    setData((prev) => [...prev, point]);
  }, []);

  const reset = useCallback(() => {
    setData(initialData);
    setFilters({
      categories: [],
    });
    setTimeRange(null);
    setAggregationPeriod(null);
  }, [initialData]);

  const value = useMemo<DataContextValue>(
    () => ({
      data,
      filteredData,
      aggregatedData,
      filters,
      timeRange,
      aggregationPeriod,
      setFilters,
      setTimeRange,
      setAggregationPeriod,
      updateData,
      addDataPoint,
      reset,
    }),
    [
      data,
      filteredData,
      aggregatedData,
      filters,
      timeRange,
      aggregationPeriod,
      updateData,
      addDataPoint,
      reset,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

