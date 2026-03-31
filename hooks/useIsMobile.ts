import { useState, useEffect } from 'react';

/**
 * Detects touch/hover-less devices (mobile) using CSS media query.
 * Uses `(hover: none)` which distinguishes touch devices from pointer/mouse devices.
 * SSR-safe: defaults to false on server.
 */
export const useIsMobile = (): boolean => {
    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        setIsMobile(window.matchMedia('(hover: none)').matches);
        const mq = window.matchMedia('(hover: none)');
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    return isMobile;
};
