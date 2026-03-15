import { useState, useEffect } from 'react';

export const useDeviceIntelligence = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      if (typeof navigator === 'undefined') return false; // SSR Defense

      // 1. Modern API Interception (User-Agent Client Hints)
      // @ts-ignore - userAgentData is not yet in standard TS lib
      if ((navigator as any).userAgentData) {
        return (navigator as any).userAgentData.mobile;
      }

      // 2. Classic UA Sniffing (Fallback for Safari/Firefox)
      const ua = navigator.userAgent;
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    };

    setIsMobile(checkIsMobile());
  }, []);

  return { isMobile };
};
