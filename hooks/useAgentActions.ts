/**
 * hooks/useAgentActions.ts
 * Social interaction handlers extracted from App.tsx:
 *   - handleLike, handleBookmark, handleShare
 *   - handleTagClick, handleAgentSelectFromGrid, handleCommanderActions
 *   - handleSecretClick (admin console unlock)
 *
 * Depends on profile/addXp/unlockAchievement from useProfile,
 * and setAgents/setFilterTag/setShowGrid from App state.
 */
import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Agent } from '../types';
import { dataService } from '../services/dataService';
import { XP_EVENTS } from '../services/rankService';
import { Telemetry } from '../services/telemetry';

interface UseAgentActionsOptions {
    profile: any;
    addXp: (amount: number) => void;
    unlockAchievement: (id: string, xp: number) => void;
    syncUserProgress: (profile: any) => void;
    setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
    setAlertMessage: (msg: string | null) => void;
    setFilterTag: (tag: string | null) => void;
    setShowGrid: (show: boolean) => void;
    setPreSelectedWorkflowNodes: (ids: string[]) => void;
}

export function useAgentActions({
    profile, addXp, unlockAchievement, syncUserProgress,
    setAgents, setAlertMessage, setFilterTag, setShowGrid,
    setPreSelectedWorkflowNodes,
}: UseAgentActionsOptions) {
    const navigate = useNavigate();
    const [isAdminVisible, setIsAdminVisible] = useState(false);
    const [adminClicks, setAdminClicks] = useState(0);
    const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleLike = useCallback(async (agentId: string) => {
        const likeAchievementId = `liked:${agentId}`;
        if (profile.achievements.includes(likeAchievementId)) return;
        Telemetry.track('agent_liked', { agentId });
        addXp(XP_EVENTS.CHAT_MESSAGE);
        unlockAchievement(likeAchievementId, 20);
        await dataService.incrementAgentStat(agentId, 'like');
    }, [profile, addXp, unlockAchievement]);

    const handleBookmark = useCallback((agentId: string) => {
        const isBookmarked = profile.badges.includes(agentId);
        let newBadges = [...profile.badges];
        if (isBookmarked) {
            newBadges = newBadges.filter((id: string) => id !== agentId);
        } else {
            newBadges.push(agentId);
            addXp(10);
            Telemetry.track('agent_bookmarked', { agentId });
        }
        syncUserProgress({ ...profile, badges: newBadges });
    }, [profile, syncUserProgress, addXp]);

    const handleShare = useCallback(async (agent: Agent) => {
        Telemetry.track('agent_shared', { agentId: agent.id });
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `YouAgent // ${agent.name}`,
                    text: agent.slogan,
                    url: window.location.href,
                });
                addXp(25);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                setAlertMessage('[ SIGNAL_COPIED_TO_CLIPBOARD ]');
                setTimeout(() => setAlertMessage(null), 3000);
            }
        } catch (_) {
            console.warn('[SHARE] System Interrupted');
        }
    }, [addXp, setAlertMessage]);

    const handleTagClick = useCallback((tag: string) => {
        setFilterTag(tag);
        setShowGrid(true);
        Telemetry.track('filter_tag_clicked', { tag });
    }, [setFilterTag, setShowGrid]);

    const handleAgentSelectFromGrid = useCallback((agent: Agent) => {
        setShowGrid(false);
        setFilterTag(null);
        setAgents(prev => {
            if (prev.find((a: Agent) => a.id === agent.id)) return prev;
            return [agent, ...prev];
        });
        dataService.saveRecentlyViewed(agent);
        navigate(`/agent/${agent.slug || agent.id}`);
        Telemetry.track('agent_selected_grid', { agentId: agent.id });
    }, [navigate, setAgents, setFilterTag, setShowGrid]);

    const handleCommanderActions = {
        onFilter: (tag: string) => handleTagClick(tag),
        onFlow: (ids: string[]) => {
            setPreSelectedWorkflowNodes(ids);
            navigate('/workflow');
        },
    };

    const handleSecretClick = useCallback(() => {
        setAdminClicks(prev => {
            const newVal = prev + 1;
            if (newVal >= 5) {
                setIsAdminVisible(true);
                Telemetry.track('admin_console_accessed');
                return 0;
            }
            return newVal;
        });
        if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = setTimeout(() => setAdminClicks(0), 3000);
    }, []);

    return {
        handleLike, handleBookmark, handleShare,
        handleTagClick, handleAgentSelectFromGrid,
        handleCommanderActions,
        handleSecretClick,
        isAdminVisible, setIsAdminVisible,
    };
}
