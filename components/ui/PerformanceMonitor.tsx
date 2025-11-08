'use client';

import React from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useTheme } from '../providers/ThemeProvider';

export default function PerformanceMonitor() {
  const metrics = usePerformanceMonitor(true);
  const { colors } = useTheme();

  const getFpsColor = (fps: number) => {
    if (fps >= 55) return colors.primary; // lime green / deep green
    if (fps >= 30) return '#ffaa00'; // yellow/orange
    return '#ff4444'; // red
  };

  return (
    <div
      className="performance-monitor"
      style={{
        padding: '1.5rem',
        background: colors.surface,
        color: colors.text,
        borderRadius: '20px',
        border: `1px solid ${colors.border}`,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: '14px',
      }}
    >
      <h3 style={{ 
        marginTop: 0, 
        marginBottom: '1.25rem', 
        color: colors.primary,
        fontSize: '18px',
        fontWeight: '600',
      }}>
        Performance Metrics
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        <div>
          <div style={{ color: colors.textSecondary, marginBottom: '0.25rem' }}>FPS</div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: getFpsColor(metrics.fps),
            }}
          >
            {metrics.fps}
          </div>
        </div>
        <div>
          <div style={{ color: colors.textSecondary, marginBottom: '0.25rem' }}>Frame Time</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.text }}>
            {metrics.lastFrameTime.toFixed(2)}ms
          </div>
        </div>
        <div>
          <div style={{ color: colors.textSecondary, marginBottom: '0.25rem' }}>Memory Usage</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {metrics.memoryUsage} MB
          </div>
        </div>
        <div>
          <div style={{ color: colors.textSecondary, marginBottom: '0.25rem' }}>Render Time</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.text }}>
            {metrics.renderTime.toFixed(2)}ms
          </div>
        </div>
      </div>
      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${colors.border}` }}>
        <div style={{ color: colors.textSecondary, fontSize: '12px' }}>
          Target: 60 FPS | Current: {metrics.fps >= 55 ? '✓ Optimal' : metrics.fps >= 30 ? '⚠ Acceptable' : '✗ Poor'}
        </div>
      </div>
    </div>
  );
}

