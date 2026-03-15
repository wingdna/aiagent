import { useState, useEffect } from 'react';

export const useDeviceType = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [isDesktop, setIsDesktop] = useState(true);

    useEffect(() => {
        const checkDevice = () => {
            if (typeof navigator === 'undefined') return;
            
            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
            // Strict mobile device detection (phones/tablets)
            // We explicitly exclude "Macintosh" (often iPads request desktop site) unless we want to treat them as desktop
            // But usually, "Mobile" string is the key.
            const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
            
            const isMobileDevice = mobileRegex.test(userAgent);
            
            setIsMobile(isMobileDevice);
            setIsDesktop(!isMobileDevice);
        };

        checkDevice();
        // We do NOT add a resize listener here because we want to detect the DEVICE, not the viewport size.
    }, []);

    return { isMobile, isDesktop };
};
