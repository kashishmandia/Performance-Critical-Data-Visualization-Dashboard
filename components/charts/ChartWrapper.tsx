'use client';

import React, { useRef, useEffect, ReactNode } from 'react';
import { useZoomPan } from '@/hooks/useZoomPan';
import ZoomPanControls from '../controls/ZoomPanControls';

interface ChartWrapperProps {
  children: (zoomPan: ReturnType<typeof useZoomPan>) => ReactNode;
  showControls?: boolean;
}

export default function ChartWrapper({ children, showControls = true }: ChartWrapperProps) {
  const zoomPan = useZoomPan({ minScale: 0.5, maxScale: 5, initialScale: 1 });

  return (
    <div style={{ position: 'relative' }}>
      {showControls && (
        <div style={{ marginBottom: '1rem' }}>
          <ZoomPanControls
            onZoomIn={zoomPan.zoomIn}
            onZoomOut={zoomPan.zoomOut}
            onReset={zoomPan.reset}
            scale={zoomPan.state.scale}
          />
        </div>
      )}
      {children(zoomPan)}
    </div>
  );
}

