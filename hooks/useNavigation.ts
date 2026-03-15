import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Agent } from '../types';

// Helper to detect scrollable capability
const getScrollableParent = (node: HTMLElement | null): HTMLElement | null => {
    if (!node || node === document.body) return null;

    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    const isScrollable = overflowY === 'auto' || overflowY === 'scroll';
    
    // It is effectively scrollable if it has overflow enabled AND content exceeds height
    if (isScrollable && node.scrollHeight > node.clientHeight) {
        return node;
    }
    
    return getScrollableParent(node.parentElement);
};

export const useNavigation = (
    sortedAgents: Agent[],
    activeAgentId: string | null,
    setActiveAgentId: (id: string) => void,
    onNavigate?: () => void
) => {
    const navigateTo = useNavigate();
    const location = useLocation();
    const [isTransit, setIsTransit] = useState(false);
    const [showGlitch, setShowGlitch] = useState(false);
    const [direction, setDirection] = useState<1 | -1>(1); // 1 = Next (Down), -1 = Prev (Up)
    const [navWarning, setNavWarning] = useState<'NEXT' | 'PREV' | 'BOUNCE_NEXT' | 'BOUNCE_PREV' | null>(null);
    
    // --- ATOMIC STATE REFS ---
    const stateRef = useRef({ 
        sortedAgents, 
        activeAgentId, 
        pathname: location.pathname,
        isTransit 
    });

    const lastNavTime = useRef(0);
    const COOLDOWN_MS = 600; // 500ms + 100ms buffer for animation clearance

    // Sync Refs
    useEffect(() => {
        stateRef.current = { 
            sortedAgents, 
            activeAgentId, 
            pathname: location.pathname,
            isTransit 
        };
    }, [sortedAgents, activeAgentId, location.pathname, isTransit]);

    // --- NAVIGATION LOGIC ---
    const navigate = useCallback((dir: 1 | -1) => {
        const now = Date.now();
        
        // 1. HARD COOLDOWN LOCK
        if (now - lastNavTime.current < COOLDOWN_MS) return;
        
        const { sortedAgents, activeAgentId, pathname, isTransit } = stateRef.current;

        // 2. LOGIC GATES
        if (isTransit || sortedAgents.length === 0) return;
        
        // Only allow navigation on discover view (root or /agent/...)
        const isDiscover = pathname === '/' || pathname.startsWith('/agent/');
        const isLounge = pathname.endsWith('/lounge');
        
        if (!isDiscover || isLounge) return;

        // 3. RESOLVE POINTERS
        const currentIndex = sortedAgents.findIndex(a => a.id === activeAgentId);
        const safeCurrentIndex = currentIndex === -1 ? 0 : currentIndex;
        
        // 4. CALCULATE TARGET
        const nextIndex = (safeCurrentIndex + dir + sortedAgents.length) % sortedAgents.length;
        const nextAgent = sortedAgents[nextIndex];

        // 5. EXECUTE SLIDE
        lastNavTime.current = now;
        setDirection(dir); // Expose direction to UI for animation
        setIsTransit(true);
        setShowGlitch(true);
        setNavWarning(null);
        setTimeout(() => setShowGlitch(false), 200);

        // Trigger Callback (XP Gain)
        if (onNavigate) onNavigate();

        // Immediate State Update (No simulated latency, purely animation driven)
        setActiveAgentId(nextAgent.id);
        
        const identifier = nextAgent.slug || nextAgent.id;
        navigateTo(`/agent/${identifier}`);

        // Release Lock after animation
        setTimeout(() => setIsTransit(false), COOLDOWN_MS);

    }, [setActiveAgentId, navigateTo, onNavigate]);

    // --- GLOBAL EVENT LISTENERS ---
    useEffect(() => {
        let touchStartY = 0;
        const WHEEL_THRESHOLD = 20;
        const TOUCH_THRESHOLD = 40;
        
        let lastWheelTime = 0;
        let swipeState: 'NONE' | 'BOUNCED_TOP' | 'BOUNCED_BOTTOM' = 'NONE';
        let resetTimeout: NodeJS.Timeout;

        const handleWheel = (e: WheelEvent) => {
            if ((e.target as HTMLElement).closest('.scroll-trap')) return;
            
            const { pathname } = stateRef.current;
            const isDiscover = pathname === '/' || (pathname.startsWith('/agent/') && !pathname.endsWith('/lounge'));
            if (!isDiscover) return;

            const scrollable = getScrollableParent(e.target as HTMLElement);
            let isAtTop = true;
            let isAtBottom = true;

            if (scrollable) {
                const { scrollTop, scrollHeight, clientHeight } = scrollable;
                isAtTop = scrollTop <= 5;
                isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 5;

                // Scrolling UP (deltaY < 0) and NOT at top -> Allow native scroll
                if (e.deltaY < 0 && !isAtTop) return;
                
                // Scrolling DOWN (deltaY > 0) and NOT at bottom -> Allow native scroll
                if (e.deltaY > 0 && !isAtBottom) return;
            }

            // Prevent native scroll only if we are taking over navigation
            e.preventDefault();
            
            if (Math.abs(e.deltaY) > WHEEL_THRESHOLD) {
                const now = Date.now();
                const timeSinceLastWheel = now - lastWheelTime;
                lastWheelTime = now;
                
                const dir = e.deltaY > 0 ? 1 : -1;
                
                if (timeSinceLastWheel > 250) {
                    if (dir === 1 && isAtBottom) {
                        if (swipeState === 'BOUNCED_BOTTOM') {
                            swipeState = 'NONE';
                            setNavWarning(null);
                            navigate(1);
                        } else {
                            swipeState = 'BOUNCED_BOTTOM';
                            setNavWarning('BOUNCE_NEXT');
                            clearTimeout(resetTimeout);
                            resetTimeout = setTimeout(() => { swipeState = 'NONE'; setNavWarning(null); }, 2000);
                        }
                    } else if (dir === -1 && isAtTop) {
                        if (swipeState === 'BOUNCED_TOP') {
                            swipeState = 'NONE';
                            setNavWarning(null);
                            navigate(-1);
                        } else {
                            swipeState = 'BOUNCED_TOP';
                            setNavWarning('BOUNCE_PREV');
                            clearTimeout(resetTimeout);
                            resetTimeout = setTimeout(() => { swipeState = 'NONE'; setNavWarning(null); }, 2000);
                        }
                    }
                } else {
                    // Continuous scroll
                    if (dir === 1 && isAtBottom && swipeState !== 'BOUNCED_BOTTOM') {
                        swipeState = 'BOUNCED_BOTTOM';
                        setNavWarning('BOUNCE_NEXT');
                        clearTimeout(resetTimeout);
                        resetTimeout = setTimeout(() => { swipeState = 'NONE'; setNavWarning(null); }, 2000);
                    } else if (dir === -1 && isAtTop && swipeState !== 'BOUNCED_TOP') {
                        swipeState = 'BOUNCED_TOP';
                        setNavWarning('BOUNCE_PREV');
                        clearTimeout(resetTimeout);
                        resetTimeout = setTimeout(() => { swipeState = 'NONE'; setNavWarning(null); }, 2000);
                    }
                }
            }
        };

        const handleTouchStart = (e: TouchEvent) => {
            if ((e.target as HTMLElement).closest('.scroll-trap')) return;
            touchStartY = e.touches[0].clientY;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if ((e.target as HTMLElement).closest('.scroll-trap')) return;
            const touchEndY = e.changedTouches[0].clientY;
            const diff = touchStartY - touchEndY; // diff > 0 means Swipe UP (Scroll Down)
            
            const { pathname } = stateRef.current;
            const isDiscover = pathname === '/' || (pathname.startsWith('/agent/') && !pathname.endsWith('/lounge'));
            if (!isDiscover) return;

            const scrollable = getScrollableParent(e.target as HTMLElement);
            let isAtTop = true;
            let isAtBottom = true;

            if (scrollable) {
                const { scrollTop, scrollHeight, clientHeight } = scrollable;
                isAtTop = scrollTop <= 5;
                isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 5;

                // Swipe DOWN (diff < 0) and NOT at top -> Allow native scroll
                if (diff < 0 && !isAtTop) return;

                // Swipe UP (diff > 0) and NOT at bottom -> Allow native scroll
                if (diff > 0 && !isAtBottom) return;
            }

            if (Math.abs(diff) > TOUCH_THRESHOLD) {
                const dir = diff > 0 ? 1 : -1;
                if (dir === 1 && isAtBottom) {
                    if (swipeState === 'BOUNCED_BOTTOM') {
                        swipeState = 'NONE';
                        setNavWarning(null);
                        navigate(1);
                    } else {
                        swipeState = 'BOUNCED_BOTTOM';
                        setNavWarning('BOUNCE_NEXT');
                        clearTimeout(resetTimeout);
                        resetTimeout = setTimeout(() => { swipeState = 'NONE'; setNavWarning(null); }, 2000);
                    }
                } else if (dir === -1 && isAtTop) {
                    if (swipeState === 'BOUNCED_TOP') {
                        swipeState = 'NONE';
                        setNavWarning(null);
                        navigate(-1);
                    } else {
                        swipeState = 'BOUNCED_TOP';
                        setNavWarning('BOUNCE_PREV');
                        clearTimeout(resetTimeout);
                        resetTimeout = setTimeout(() => { swipeState = 'NONE'; setNavWarning(null); }, 2000);
                    }
                }
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
             if ((e.target as HTMLElement).tagName === 'INPUT') return;
             // Optional: Add same scroll check logic for keys if needed, 
             // but Arrow keys usually scroll native first anyway.
             if (e.key === 'ArrowDown') navigate(1);
             if (e.key === 'ArrowUp') navigate(-1);
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchend', handleTouchEnd, { passive: false });
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('keydown', handleKeyDown);
            clearTimeout(resetTimeout);
        };
    }, [navigate]);

    return { isTransit, direction, showGlitch, navWarning };
};