'use client';

import React, { useMemo } from 'react';
import { useData } from '../providers/DataProvider';
import { useTheme } from '../providers/ThemeProvider';
import { useVirtualization } from '@/hooks/useVirtualization';
import { DataPoint } from '@/lib/types';

export default function DataTable() {
  const { aggregatedData } = useData();
  const { colors } = useTheme();

  const { containerRef, visibleItems, totalHeight, handleScroll } = useVirtualization<DataPoint>(
    aggregatedData,
    {
      itemHeight: 40,
      containerHeight: 400,
      overscan: 5,
    }
  );

  return (
    <div
      className="data-table"
      style={{
        border: `1px solid ${colors.border}`,
        borderRadius: '20px',
        overflow: 'hidden',
        background: colors.surface,
      }}
    >
      <div
        style={{
          padding: '1rem',
          background: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
          fontWeight: 'bold',
          color: colors.text,
        }}
      >
        Data Table ({aggregatedData.length} points)
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          height: '400px',
          overflowY: 'auto',
        }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div
            style={{
              position: 'sticky',
              top: 0,
              background: colors.surface,
              zIndex: 1,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              borderBottom: `2px solid ${colors.border}`,
            }}
          >
            <div style={{ padding: '0.75rem', fontWeight: 'bold', color: colors.text }}>Timestamp</div>
            <div style={{ padding: '0.75rem', fontWeight: 'bold', color: colors.text }}>Value</div>
            <div style={{ padding: '0.75rem', fontWeight: 'bold', color: colors.text }}>Category</div>
          </div>
          {visibleItems.map(({ item, offset, index }) => (
            <div
              key={`${item.timestamp}-${item.value}-${index}`}
              style={{
                position: 'absolute',
                top: offset + 40,
                left: 0,
                right: 0,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                borderBottom: `1px solid ${colors.border}`,
                background: index % 2 === 0 ? colors.surface : colors.background,
                color: colors.text,
              }}
            >
              <div style={{ padding: '0.75rem' }}>
                {new Date(item.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
              </div>
              <div style={{ padding: '0.75rem' }}>{item.value.toFixed(2)}</div>
              <div style={{ padding: '0.75rem' }}>{item.category}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

