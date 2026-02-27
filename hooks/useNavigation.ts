import { useState, useEffect, useRef, useCallback } from 'react';
import { Agent } from '../types';
import { UIState, useUIStore } from '../src/stores/useUIStore';

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
    const currentView = useUIStore((s: UIState) => s.currentView);
    const setCurrentView = useUIStore((s: UIState) => s.setCurrentView);
    const [isTransit, setIsTransit] = useState(false);
    const [showGlitch, setShowGlitch] = useState(false);
    const [direction, setDirection] = useState<1 | -1>(1); // 1 = Next (Down), -1 = Prev (Up)
    
    // --- ATOMIC STATE REFS ---
    const stateRef = useRef({ 
        sortedAgents, 
        activeAgentId, 
        currentView,
        isTransit 
    });

    const lastNavTime = useRef(0);
    const COOLDOWN_MS = 600; // 500ms + 100ms buffer for animation clearance

    // Sync Refs
    useEffect(() => {
        stateRef.current = { 
            sortedAgents, 
            activeAgentId, 
            currentView,
            isTransit 
        };
    }, [sortedAgents, activeAgentId, currentView, isTransit]);

    // --- NAVIGATION LOGIC ---
    const navigate = useCallback((dir: 1 | -1) => {
        const now = Date.now();
        
        // 1. HARD COOLDOWN LOCK
        if (now - lastNavTime.current < COOLDOWN_MS) return;
        
        const { sortedAgents, activeAgentId, currentView, isTransit } = stateRef.current;

        // 2. LOGIC GATES
        if (isTransit || sortedAgents.length === 0) return;
        if (currentView === 'battle' || currentView === 'workflow') return;

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
        setTimeout(() => setShowGlitch(false), 200);
        
        console.log(`[SLIDE_ENGINE] Vector: ${dir > 0 ? 'DOWN' : 'UP'} | Target: ${nextAgent.id}`);

        // Trigger Callback (XP Gain)
        if (onNavigate) onNavigate();

        // Immediate State Update (No simulated latency, purely animation driven)
        setActiveAgentId(nextAgent.id);
        
        if (currentView === 'lounge') {
            setCurrentView('discover');
        }

        // Release Lock after animation
        setTimeout(() => setIsTransit(false), COOLDOWN_MS);

    }, [setActiveAgentId, setCurrentView, onNavigate]);

    // --- GLOBAL EVENT LISTENERS ---
    useEffect(() => {
        let touchStartY = 0;
        const WHEEL_THRESHOLD = 20;
        const TOUCH_THRESHOLD = 40;

        const handleWheel = (e: WheelEvent) => {
            if ((e.target as HTMLElement).closest('.scroll-trap')) return;
            if (stateRef.current.currentView !== 'discover') return;

            const scrollable = getScrollableParent(e.target as HTMLElement);

            if (scrollable) {
                const { scrollTop, scrollHeight, clientHeight } = scrollable;
                const isAtTop = scrollTop <= 0;
                const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight;

                // Scrolling UP (deltaY < 0) and NOT at top -> Allow native scroll
                if (e.deltaY < 0 && !isAtTop) return;
                
                // Scrolling DOWN (deltaY > 0) and NOT at bottom -> Allow native scroll
                if (e.deltaY > 0 && !isAtBottom) return;
            }

            // Prevent native scroll only if we are taking over navigation
            e.preventDefault();
            
            if (Math.abs(e.deltaY) > WHEEL_THRESHOLD) {
                navigate(e.deltaY > 0 ? 1 : -1);
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
            
            const scrollable = getScrollableParent(e.target as HTMLElement);
            if (scrollable) {
                const { scrollTop, scrollHeight, clientHeight } = scrollable;
                const isAtTop = scrollTop <= 0;
                const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight;

                // Swipe DOWN (diff < 0) and NOT at top -> Allow native scroll
                if (diff < 0 && !isAtTop) return;

                // Swipe UP (diff > 0) and NOT at bottom -> Allow native scroll
                if (diff > 0 && !isAtBottom) return;
            }

            if (Math.abs(diff) > TOUCH_THRESHOLD) {
                navigate(diff > 0 ? 1 : -1);
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
        };
    }, [navigate]);

    return { isTransit, direction, showGlitch };
};