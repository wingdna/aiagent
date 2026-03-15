import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { Telemetry } from '../services/telemetry';

export function useTelemetryPageTrack() {
    const location = useLocation();
    useEffect(() => {
        Telemetry.trackPage(location.pathname);
        // SEO param cleanse
        const params = new URLSearchParams(window.location.search);
        if (params.has('showPreview') || params.has('showAssistant') || params.has('debug')) {
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [location.pathname]);
}
