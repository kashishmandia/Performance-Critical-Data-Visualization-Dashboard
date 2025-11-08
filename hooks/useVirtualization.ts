'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface VirtualizationOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Number of items to render outside visible area
}

export function useVirtualization<T>(
  items: T[],
  options: VirtualizationOptions
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / itemHeight) - overscan
  );
  const endIndex = Math.min(
    items.length - 1,
    startIndex + visibleCount + overscan * 2
  );

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      offset: (startIndex + index) * itemHeight,
    }));
  }, [items, startIndex, endIndex, itemHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll as any);
    return () => {
      container.removeEventListener('scroll', handleScroll as any);
    };
  }, [handleScroll]);

  return {
    containerRef,
    visibleItems,
    totalHeight,
    startIndex,
    endIndex,
    scrollTop,
    handleScroll,
  };
}

