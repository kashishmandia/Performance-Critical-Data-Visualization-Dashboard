'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../providers/DataProvider';
import { useTheme } from '../providers/ThemeProvider';
import { TimeRange, AggregationPeriod } from '@/lib/types';

const AGGREGATION_PERIODS: AggregationPeriod[] = [
  { label: 'Raw', value: 0 },
  { label: '1 minute', value: 60000 },
  { label: '5 minutes', value: 300000 },
  { label: '1 hour', value: 3600000 },
];

export default function TimeRangeSelector() {
  const { data, timeRange, aggregationPeriod, setTimeRange, setAggregationPeriod } = useData();
  const { colors } = useTheme();
  const [localRange, setLocalRange] = useState<TimeRange | null>(timeRange);

  const timeBounds = useMemo(() => {
    if (data.length === 0) return { min: Date.now() - 3600000, max: Date.now() };
    const timestamps = data.map((d) => d.timestamp);
    return {
      min: Math.min(...timestamps),
      max: Math.max(...timestamps),
    };
  }, [data]);

  const handleApply = useCallback(() => {
    setTimeRange(localRange);
  }, [localRange, setTimeRange]);

  const handleReset = useCallback(() => {
    setLocalRange(null);
    setTimeRange(null);
  }, [setTimeRange]);

  const handleAggregationChange = useCallback(
    (period: AggregationPeriod) => {
      setAggregationPeriod(period.value === 0 ? null : period);
    },
    [setAggregationPeriod]
  );

  return (
    <div 
      className="time-range-selector" 
      style={{ 
        padding: '1.5rem', 
        background: colors.surface, 
        borderRadius: '20px',
        border: `1px solid ${colors.border}`,
      }}
    >
      <h3 style={{ 
        marginTop: 0, 
        marginBottom: '1.25rem', 
        color: colors.text,
        fontSize: '18px',
        fontWeight: '600',
      }}>Time Range & Aggregation</h3>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.75rem', 
          fontWeight: '600', 
          color: colors.text,
          fontSize: '15px',
        }}>
          Time Range
        </label>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="datetime-local"
            value={
              localRange
                ? new Date(localRange.start).toISOString().slice(0, 16)
                : new Date(timeBounds.min).toISOString().slice(0, 16)
            }
            onChange={(e) =>
              setLocalRange((prev) => ({
                start: new Date(e.target.value).getTime(),
                end: prev?.end ?? timeBounds.max,
              }))
            }
            style={{ 
              padding: '0.625rem 0.75rem', 
              borderRadius: '12px', 
              border: `1px solid ${colors.border}`,
              background: colors.background,
              color: colors.text,
              fontSize: '14px',
            }}
          />
          <span style={{ color: colors.text }}>-</span>
          <input
            type="datetime-local"
            value={
              localRange
                ? new Date(localRange.end).toISOString().slice(0, 16)
                : new Date(timeBounds.max).toISOString().slice(0, 16)
            }
            onChange={(e) =>
              setLocalRange((prev) => ({
                start: prev?.start ?? timeBounds.min,
                end: new Date(e.target.value).getTime(),
              }))
            }
            style={{ 
              padding: '0.625rem 0.75rem', 
              borderRadius: '12px', 
              border: `1px solid ${colors.border}`,
              background: colors.background,
              color: colors.text,
              fontSize: '14px',
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.75rem', 
          fontWeight: '600', 
          color: colors.text,
          fontSize: '15px',
        }}>
          Aggregation Period
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {AGGREGATION_PERIODS.map((period) => {
            const isSelected = (aggregationPeriod?.value === period.value) ||
              (aggregationPeriod === null && period.value === 0);
            return (
              <button
                key={period.label}
                onClick={() => handleAggregationChange(period)}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: isSelected ? colors.primary : colors.border,
                  color: isSelected ? colors.background : colors.text,
                  border: `1px solid ${isSelected ? colors.primary : colors.border}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = colors.surface;
                    e.currentTarget.style.borderColor = colors.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = colors.border;
                    e.currentTarget.style.borderColor = colors.border;
                  }
                }}
              >
                {period.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={handleApply}
          style={{
            padding: '0.75rem 1.5rem',
            background: colors.primary,
            color: colors.background,
            border: `1px solid ${colors.primary}`,
            borderRadius: '14px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s',
            fontSize: '14px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          Apply Range
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: '0.75rem 1.5rem',
            background: colors.border,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            borderRadius: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '14px',
            fontWeight: '500',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.surface;
            e.currentTarget.style.borderColor = colors.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.border;
            e.currentTarget.style.borderColor = colors.border;
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

