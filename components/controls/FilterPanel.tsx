'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../providers/DataProvider';
import { useTheme } from '../providers/ThemeProvider';

export default function FilterPanel() {
  const { data, filters, setFilters } = useData();
  const { colors } = useTheme();
  const [localFilters, setLocalFilters] = useState(filters);

  // Sync local filters with context filters when they change externally
  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const categories = useMemo(() => {
    const unique = new Set(data.map((d) => d.category));
    return Array.from(unique).sort();
  }, [data]);

  const valueRange = useMemo(() => {
    if (data.length === 0) return { min: 0, max: 100 };
    const values = data.map((d) => d.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [data]);

  const handleCategoryChange = useCallback(
    (category: string, checked: boolean) => {
      setLocalFilters((prev) => {
        const newCategories = checked
          ? [...prev.categories, category]
          : prev.categories.filter((c) => c !== category);
        return { ...prev, categories: newCategories };
      });
    },
    []
  );

  const handleApply = useCallback(() => {
    setFilters(localFilters);
  }, [localFilters, setFilters]);

  const handleReset = useCallback(() => {
    const reset = {
      categories: [],
      minValue: undefined,
      maxValue: undefined,
    };
    setLocalFilters(reset);
    setFilters(reset);
  }, [setFilters]);

  return (
    <div 
      className="filter-panel" 
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
      }}>Filters</h3>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.75rem', 
          fontWeight: '600', 
          color: colors.text,
          fontSize: '15px',
        }}>
          Categories
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {categories.map((category) => (
            <label key={category} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.text }}>
              <input
                type="checkbox"
                checked={localFilters.categories.includes(category)}
                onChange={(e) => handleCategoryChange(category, e.target.checked)}
                style={{ accentColor: colors.primary }}
              />
              <span>{category}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '1rem', overflow: 'hidden' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.75rem', 
          fontWeight: '600', 
          color: colors.text,
          fontSize: '15px',
        }}>
          Value Range
        </label>
        <div style={{ marginBottom: '0.5rem', fontSize: '12px', color: colors.textSecondary }}>
          Current range: {valueRange.min.toFixed(2)} - {valueRange.max.toFixed(2)}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: '1 1 auto', minWidth: 0 }}>
            <label style={{ fontSize: '12px', color: colors.textSecondary }}>Min Value</label>
            <input
              type="number"
              placeholder={valueRange.min.toFixed(2)}
              value={localFilters.minValue !== undefined ? localFilters.minValue : ''}
              onChange={(e) => {
                const value = e.target.value;
                setLocalFilters((prev) => ({
                  ...prev,
                  minValue: value === '' ? undefined : Number(value),
                }));
              }}
              min={valueRange.min}
              max={valueRange.max}
              step="0.01"
              style={{ 
                padding: '0.625rem 0.75rem', 
                borderRadius: '12px', 
                border: `1px solid ${colors.border}`, 
                width: '100%',
                maxWidth: '140px',
                background: colors.background,
                color: colors.text,
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <span style={{ marginTop: '1.5rem', color: colors.text, flexShrink: 0 }}>-</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: '1 1 auto', minWidth: 0 }}>
            <label style={{ fontSize: '12px', color: colors.textSecondary }}>Max Value</label>
            <input
              type="number"
              placeholder={valueRange.max.toFixed(2)}
              value={localFilters.maxValue !== undefined ? localFilters.maxValue : ''}
              onChange={(e) => {
                const value = e.target.value;
                setLocalFilters((prev) => ({
                  ...prev,
                  maxValue: value === '' ? undefined : Number(value),
                }));
              }}
              min={valueRange.min}
              max={valueRange.max}
              step="0.01"
              style={{ 
                padding: '0.625rem 0.75rem', 
                borderRadius: '12px', 
                border: `1px solid ${colors.border}`, 
                width: '100%',
                maxWidth: '140px',
                background: colors.background,
                color: colors.text,
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
        {(localFilters.minValue !== undefined || localFilters.maxValue !== undefined) && (
          <div style={{ marginTop: '0.5rem', fontSize: '12px', color: colors.primary }}>
            Filter: {localFilters.minValue !== undefined ? localFilters.minValue.toFixed(2) : 'any'} - {localFilters.maxValue !== undefined ? localFilters.maxValue.toFixed(2) : 'any'}
          </div>
        )}
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
          Apply
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

