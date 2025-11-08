'use client';

import { useRef, useCallback, useEffect } from 'react';
import { WorkerMessage, WorkerResponse } from '@/lib/types';

export function useWebWorker() {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Create worker
    workerRef.current = new Worker(new URL('/worker.js', window.location.origin));

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const postMessage = useCallback(
    (message: WorkerMessage): Promise<WorkerResponse> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not initialized'));
          return;
        }

        const handleMessage = (e: MessageEvent<WorkerResponse>) => {
          const response = e.data;
          if (response.type === 'error') {
            reject(new Error(response.error || 'Worker error'));
          } else {
            resolve(response);
          }
          workerRef.current?.removeEventListener('message', handleMessage);
        };

        workerRef.current.addEventListener('message', handleMessage);
        workerRef.current.postMessage(message);
      });
    },
    []
  );

  return { postMessage };
}

