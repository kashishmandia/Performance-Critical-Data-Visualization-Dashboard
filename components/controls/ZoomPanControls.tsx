'use client';

import React from 'react';
import { useTheme } from '../providers/ThemeProvider';

interface ZoomPanControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onPanStart?: () => void;
  scale: number;
}

export default function ZoomPanControls({
  onZoomIn,
  onZoomOut,
  onReset,
  scale,
}: ZoomPanControlsProps) {
  const { colors } = useTheme();
  
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        padding: '0.875rem 1.25rem',
        background: colors.surface,
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
      }}
    >
      <span
        style={{
          fontSize: '12px',
          color: colors.textSecondary,
          fontWeight: '500',
          marginRight: '0.5rem',
        }}
      >
        Zoom & Pan:
      </span>
      <button
        onClick={onZoomOut}
        style={{
          padding: '0.625rem 0.875rem',
          background: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          color: colors.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '40px',
          transition: 'all 0.2s',
        }}
        title="Zoom Out"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = colors.primary;
          e.currentTarget.style.color = colors.background;
          e.currentTarget.style.borderColor = colors.primary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = colors.background;
          e.currentTarget.style.color = colors.text;
          e.currentTarget.style.borderColor = colors.border;
        }}
      >
        −
      </button>
      <span
        style={{
          fontSize: '12px',
          color: colors.text,
          fontWeight: '600',
          minWidth: '50px',
          textAlign: 'center',
        }}
      >
        {Math.round(scale * 100)}%
      </span>
      <button
        onClick={onZoomIn}
        style={{
          padding: '0.625rem 0.875rem',
          background: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          color: colors.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '40px',
          transition: 'all 0.2s',
        }}
        title="Zoom In"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = colors.primary;
          e.currentTarget.style.color = colors.background;
          e.currentTarget.style.borderColor = colors.primary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = colors.background;
          e.currentTarget.style.color = colors.text;
          e.currentTarget.style.borderColor = colors.border;
        }}
      >
        +
      </button>
      <button
        onClick={onReset}
        style={{
          padding: '0.625rem 1.25rem',
          background: colors.primary,
          border: `1px solid ${colors.primary}`,
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '600',
          color: colors.background,
          marginLeft: '0.5rem',
          transition: 'all 0.2s',
        }}
        title="Reset Zoom & Pan"
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        Reset
      </button>
      <div
        style={{
          marginLeft: '1rem',
          paddingLeft: '1rem',
          borderLeft: `1px solid ${colors.border}`,
          fontSize: '11px',
          color: colors.textSecondary,
        }}
      >
        <div>🖱️ Scroll: Zoom</div>
        <div>🖱️ Drag: Pan</div>
      </div>
    </div>
  );
}

