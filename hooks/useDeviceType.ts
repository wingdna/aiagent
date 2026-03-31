import { useState, useEffect } from 'react';

export const useDeviceType = () => {
    const [isDesktop, setIsDesktop] = useState(true);

    useEffect(() => {
        const checkDevice = () => {
            if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
            
            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
            const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
            
            const isMobileDevice = mobileRegex.test(userAgent);
            
            setIsDesktop(!isMobileDevice);
        };

        checkDevice();
        
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    return { isDesktop };
};
