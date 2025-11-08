'use client';

import { useState, useCallback, useRef } from 'react';

export interface ZoomPanState {
  scale: number;
  translateX: number;
  translateY: number;
}

interface UseZoomPanOptions {
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
}

export function useZoomPan(options: UseZoomPanOptions = {}) {
  const {
    minScale = 0.1,
    maxScale = 10,
    initialScale = 1,
  } = options;

  const [state, setState] = useState<ZoomPanState>({
    scale: initialScale,
    translateX: 0,
    translateY: 0,
  });

  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef<{ x: number; y: number } | null>(null);

  const zoom = useCallback(
    (delta: number, centerX?: number, centerY?: number) => {
      setState((prev) => {
        const newScale = Math.max(
          minScale,
          Math.min(maxScale, prev.scale * (1 + delta))
        );

        // Zoom towards mouse position if provided
        if (centerX !== undefined && centerY !== undefined && prev.scale !== 1) {
          const scaleChange = newScale / prev.scale;
          // Adjust translation to zoom towards the point
          const newTranslateX =
            centerX - (centerX - prev.translateX) * scaleChange;
          const newTranslateY =
            centerY - (centerY - prev.translateY) * scaleChange;

          return {
            scale: newScale,
            translateX: newTranslateX,
            translateY: newTranslateY,
          };
        } else if (centerX !== undefined && centerY !== undefined) {
          // First zoom - set initial translation
          return {
            scale: newScale,
            translateX: centerX,
            translateY: centerY,
          };
        }

        return {
          ...prev,
          scale: newScale,
        };
      });
    },
    [minScale, maxScale]
  );

  const zoomIn = useCallback(() => {
    zoom(0.2);
  }, [zoom]);

  const zoomOut = useCallback(() => {
    zoom(-0.2);
  }, [zoom]);

  const pan = useCallback((deltaX: number, deltaY: number) => {
    setState((prev) => ({
      ...prev,
      translateX: prev.translateX + deltaX,
      translateY: prev.translateY + deltaY,
    }));
  }, []);

  const startPan = useCallback((x: number, y: number) => {
    isPanningRef.current = true;
    lastPanPointRef.current = { x, y };
  }, []);

  const updatePan = useCallback((x: number, y: number) => {
    if (!isPanningRef.current || !lastPanPointRef.current) return;

    const deltaX = x - lastPanPointRef.current.x;
    const deltaY = y - lastPanPointRef.current.y;

    pan(deltaX, deltaY);
    lastPanPointRef.current = { x, y };
  }, [pan]);

  const endPan = useCallback(() => {
    isPanningRef.current = false;
    lastPanPointRef.current = null;
  }, []);

  const reset = useCallback(() => {
    setState({
      scale: initialScale,
      translateX: 0,
      translateY: 0,
    });
  }, [initialScale]);

  const handleWheel = useCallback(
    (e: WheelEvent, centerX: number, centerY: number) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      zoom(delta, centerX, centerY);
    },
    [zoom]
  );

  return {
    state,
    zoom,
    zoomIn,
    zoomOut,
    pan,
    startPan,
    updatePan,
    endPan,
    reset,
    handleWheel,
  };
}

