'use client';

import React, { useRef, useEffect } from 'react';
import { DataPoint } from '@/lib/types';
import { useChartRenderer } from '@/hooks/useChartRenderer';
import { useZoomPan } from '@/hooks/useZoomPan';

interface LineChartProps {
  data: DataPoint[];
  width: number;
  height: number;
  color?: string;
  showGrid?: boolean;
  showAxes?: boolean;
  zoomPan?: ReturnType<typeof useZoomPan>;
}

export default function LineChart({
  data,
  width,
  height,
  color = '#3b82f6',
  showGrid = true,
  showAxes = true,
  zoomPan: externalZoomPan,
}: LineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalZoomPan = useZoomPan({ minScale: 0.5, maxScale: 5, initialScale: 1 });
  const zoomPan = externalZoomPan || internalZoomPan;

  const { canvasRef } = useChartRenderer(data, {
    width,
    height,
    color,
    showGrid,
    showAxes,
    zoomPan: zoomPan.state,
  });

  // Mouse wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      zoomPan.handleWheel(e, x, y);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [canvasRef, zoomPan]);

  // Mouse drag pan
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && zoomPan.state.scale > 1) {
        zoomPan.startPan(e.clientX, e.clientY);
        canvas.style.cursor = 'grabbing';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (zoomPan.state.scale > 1) {
        canvas.style.cursor = 'grab';
      }
    };
    
    const handleMouseMovePan = (e: MouseEvent) => {
      zoomPan.updatePan(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      zoomPan.endPan();
      canvas.style.cursor = zoomPan.state.scale > 1 ? 'grab' : 'default';
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousemove', handleMouseMovePan);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousemove', handleMouseMovePan);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [canvasRef, zoomPan]);

  return (
    <div ref={containerRef} className="chart-container" style={{ width, height, position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: zoomPan.state.scale > 1 ? 'grab' : 'default',
        }}
      />
    </div>
  );
}

