'use client';

import React, { useState, useCallback, useMemo, useTransition } from 'react';
import { useData } from './providers/DataProvider';
import { useTheme } from './providers/ThemeProvider';
import { useAuth } from './providers/AuthProvider';
import { useDataStream } from '@/hooks/useDataStream';
import LineChart from './charts/LineChart';
import BarChart from './charts/BarChart';
import ScatterPlot from './charts/ScatterPlot';
import Heatmap from './charts/Heatmap';
import FilterPanel from './controls/FilterPanel';
import TimeRangeSelector from './controls/TimeRangeSelector';
import ZoomPanControls from './controls/ZoomPanControls';
import DataTable from './ui/DataTable';
import PerformanceMonitor from './ui/PerformanceMonitor';
import { ChartConfig } from '@/lib/types';
import { useZoomPan } from '@/hooks/useZoomPan';

const CHART_TYPES: ChartConfig[] = [
  { type: 'line', dataKey: 'value', color: '#00ff00', visible: true },
  { type: 'bar', dataKey: 'value', color: '#00ff00', visible: true },
  { type: 'scatter', dataKey: 'value', color: '#00ff00', visible: true },
  { type: 'heatmap', dataKey: 'value', color: '#00ff00', visible: true },
];

export default function Dashboard() {
  const { data, aggregatedData, updateData } = useData();
  const { theme, toggleTheme, colors } = useTheme();
  const { user, logout } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [chartType, setChartType] = useState<'line' | 'bar' | 'scatter' | 'heatmap'>('line');
  const [streamEnabled, setStreamEnabled] = useState(true);
  const [dataPointCount, setDataPointCount] = useState(10000);
  const zoomPan = useZoomPan({ minScale: 0.5, maxScale: 5, initialScale: 1 });
  
  // Update chart colors based on theme
  const chartColors = useMemo(() => {
    const baseColor = theme === 'dark' ? '#00ff00' : '#006400';
    return {
      line: baseColor,
      bar: baseColor,
      scatter: baseColor,
      heatmap: baseColor,
    };
  }, [theme]);

  // Use data stream hook for real-time updates
  // Use a ref to track if we've initialized to prevent duplication
  const initialDataRef = React.useRef(data);
  const { data: streamData, reset: resetStream } = useDataStream(initialDataRef.current, {
    interval: 100,
    maxPoints: dataPointCount,
    enabled: streamEnabled,
  });

  // Throttle data updates to max 60fps (every ~16ms) to maintain performance
  const lastUpdateTimeRef = React.useRef(0);
  const pendingUpdateRef = React.useRef<NodeJS.Timeout | null>(null);
  
  React.useEffect(() => {
    if (streamData.length > 0 && streamData !== data) {
      // Check if data has actually changed to prevent unnecessary updates
      const hasChanged = streamData.length !== data.length || 
        streamData.some((point, i) => 
          !data[i] || 
          point.timestamp !== data[i].timestamp || 
          point.value !== data[i].value
        );
      
      if (hasChanged) {
        const now = performance.now();
        const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
        const targetUpdateInterval = 1000 / 60; // 60fps = ~16.67ms
        
        // Clear any pending update
        if (pendingUpdateRef.current) {
          clearTimeout(pendingUpdateRef.current);
        }
        
        if (timeSinceLastUpdate >= targetUpdateInterval) {
          // Update immediately if enough time has passed
          lastUpdateTimeRef.current = now;
          startTransition(() => {
            updateData(streamData);
          });
        } else {
          // Schedule update for next frame
          pendingUpdateRef.current = setTimeout(() => {
            lastUpdateTimeRef.current = performance.now();
            startTransition(() => {
              updateData(streamData);
            });
            pendingUpdateRef.current = null;
          }, targetUpdateInterval - timeSinceLastUpdate);
        }
      }
    }
    
    return () => {
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current);
      }
    };
  }, [streamData, data, updateData]);

  const chartData = useMemo(() => aggregatedData, [aggregatedData]);

  const handleChartTypeChange = useCallback(
    (type: 'line' | 'bar' | 'scatter' | 'heatmap') => {
      setChartType(type);
    },
    []
  );

  const handleStreamToggle = useCallback(() => {
    setStreamEnabled((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    resetStream();
  }, [resetStream]);

  const handleDataPointCountChange = useCallback((count: number) => {
    setDataPointCount(count);
  }, []);

  // Calculate chart dimensions responsively
  const chartWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth - 100, 1200) : 1200;
  const chartHeight = 400;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: colors.background,
        color: colors.text,
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      <div
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '2rem',
        }}
      >
        <header style={{ 
          marginBottom: '2rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              marginBottom: '0.5rem',
              color: colors.text,
              letterSpacing: '-0.02em',
            }}>
              Performance Dashboard
            </h1>
            <p style={{ 
              color: colors.textSecondary,
              fontSize: '16px',
              fontWeight: '400',
            }}>
              Real-time data visualization with 10,000+ data points at 60 FPS
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {user && (
              <span style={{ 
                color: colors.textSecondary, 
                fontSize: '14px',
                marginRight: '0.5rem',
              }}>
                {user.email}
              </span>
            )}
            <button
              onClick={toggleTheme}
              style={{
                padding: '0.75rem 1.5rem',
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: '16px',
                color: colors.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600',
                transition: 'all 0.2s',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.primary;
                e.currentTarget.style.color = colors.background;
                e.currentTarget.style.borderColor = colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.surface;
                e.currentTarget.style.color = colors.text;
                e.currentTarget.style.borderColor = colors.border;
              }}
            >
              {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button
              onClick={logout}
              style={{
                padding: '0.75rem 1.5rem',
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: '16px',
                color: colors.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600',
                transition: 'all 0.2s',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.primary;
                e.currentTarget.style.color = colors.background;
                e.currentTarget.style.borderColor = colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.surface;
                e.currentTarget.style.color = colors.text;
                e.currentTarget.style.borderColor = colors.border;
              }}
            >
              Logout
            </button>
          </div>
        </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '2rem',
          marginBottom: '2rem',
        }}
        className="dashboard-grid"
      >
        {/* Controls Sidebar */}
        <aside
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <PerformanceMonitor />

          <div
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
            }}>Controls</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={handleStreamToggle}
                style={{
                  padding: '0.875rem 1.25rem',
                  background: streamEnabled ? colors.primary : colors.border,
                  color: streamEnabled ? colors.background : colors.text,
                  border: 'none',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                }}
              >
                {streamEnabled ? '⏸ Pause Stream' : '▶ Resume Stream'}
              </button>
              <button
                onClick={handleReset}
                style={{
                  padding: '0.875rem 1.25rem',
                  background: colors.border,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '14px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.background;
                  e.currentTarget.style.color = colors.primary;
                  e.currentTarget.style.borderColor = colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.border;
                  e.currentTarget.style.color = colors.text;
                  e.currentTarget.style.borderColor = colors.border;
                }}
              >
                Reset Data
              </button>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.75rem', 
                fontWeight: '600', 
                color: colors.text,
                fontSize: '15px',
              }}>
                Data Points: {dataPointCount}
              </label>
              <input
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={dataPointCount}
                onChange={(e) => handleDataPointCountChange(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.75rem', 
                fontWeight: '600', 
                color: colors.text,
                fontSize: '15px',
              }}>
                Chart Type
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {CHART_TYPES.map((config) => (
                  <button
                    key={config.type}
                    onClick={() => handleChartTypeChange(config.type as any)}
                    style={{
                      padding: '0.75rem 1rem',
                      background: chartType === config.type ? chartColors[config.type] : colors.border,
                      color: chartType === config.type ? colors.background : colors.text,
                      border: `1px solid ${chartType === config.type ? chartColors[config.type] : colors.border}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      transition: 'all 0.2s',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                    onMouseEnter={(e) => {
                      if (chartType !== config.type) {
                        e.currentTarget.style.background = colors.surface;
                        e.currentTarget.style.borderColor = colors.primary;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (chartType !== config.type) {
                        e.currentTarget.style.background = colors.border;
                        e.currentTarget.style.borderColor = colors.border;
                      }
                    }}
                  >
                    {config.type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <FilterPanel />
          <TimeRangeSelector />
        </aside>

        {/* Main Content */}
        <main
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
          }}
        >
          {/* Chart Display */}
          <div
            style={{
              background: colors.surface,
              padding: '2rem',
              borderRadius: '24px',
              border: `1px solid ${colors.border}`,
              boxShadow: `0 4px 12px ${theme === 'dark' ? 'rgba(0, 255, 0, 0.08)' : 'rgba(0, 100, 0, 0.08)'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ 
                marginTop: 0, 
                marginBottom: 0, 
                textTransform: 'capitalize', 
                color: colors.text,
                fontSize: '24px',
                fontWeight: '700',
                letterSpacing: '-0.01em',
              }}>
                {chartType} Chart
              </h2>
              <ZoomPanControls
                onZoomIn={zoomPan.zoomIn}
                onZoomOut={zoomPan.zoomOut}
                onReset={zoomPan.reset}
                scale={zoomPan.state.scale}
              />
            </div>
            <div style={{ position: 'relative' }}>
              {chartType === 'line' && (
                <LineChart
                  data={chartData}
                  width={chartWidth}
                  height={chartHeight}
                  color={chartColors.line}
                  zoomPan={zoomPan}
                />
              )}
              {chartType === 'bar' && (
                <BarChart
                  data={chartData}
                  width={chartWidth}
                  height={chartHeight}
                  color={chartColors.bar}
                  zoomPan={zoomPan}
                />
              )}
              {chartType === 'scatter' && (
                <ScatterPlot
                  data={chartData}
                  width={chartWidth}
                  height={chartHeight}
                  color={chartColors.scatter}
                  zoomPan={zoomPan}
                />
              )}
              {chartType === 'heatmap' && (
                <Heatmap
                  data={chartData}
                  width={chartWidth}
                  height={chartHeight}
                  zoomPan={zoomPan}
                />
              )}
              {isPending && (
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: colors.primary,
                    color: colors.background,
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  Updating...
                </div>
              )}
            </div>
            <div style={{ marginTop: '1rem', color: colors.textSecondary, fontSize: '14px' }}>
              Displaying {chartData.length} data points
            </div>
          </div>

          {/* Data Table */}
          <DataTable />
        </main>
      </div>
      </div>
    </div>
  );
}

