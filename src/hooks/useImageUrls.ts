import { useCallback, useEffect, useRef } from 'react';

export function useImageUrls() {
  const urlMap = useRef(new Map<string, string>());
  
  const createUrl = useCallback((blob: Blob, timestamp: string) => {
    // Cleanup any existing URL for this timestamp
    const existingUrl = urlMap.current.get(timestamp);
    if (existingUrl) {
      URL.revokeObjectURL(existingUrl);
    }
    
    const url = URL.createObjectURL(blob);
    urlMap.current.set(timestamp, url);
    return url;
  }, []);
  
  const revokeUrl = useCallback((timestamp: string) => {
    const url = urlMap.current.get(timestamp);
    if (url) {
      URL.revokeObjectURL(url);
      urlMap.current.delete(timestamp);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    // Capture current value at effect execution time
    const currentMap = urlMap.current;
    return () => {
      currentMap.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Failed to revoke blob URL:', error);
        }
      });
      currentMap.clear();
    };
  }, []);

  return { createUrl, revokeUrl };
}
