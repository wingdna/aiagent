
import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { TacticalHUD } from '../shared/TacticalHUD';
import { SkeletonTacticalHUD } from '../skeletons/SkeletonTacticalHUD';
import { Agent, UserProfile } from '../../types';
import { NREProfile } from '../../hooks/useNRE';

interface DiscoverViewProps {
    agents: Agent[];
    activeAgentId: string | null;
    direction: 1 | -1; 
    setActiveAgentId: (id: string) => void;
    onEnterLounge: (agent: Agent) => void;
    onTagClick: (tag: string) => void;
    onLike: (id: string) => void;
    onBookmark: (id: string) => void;
    onShare: (agent: Agent) => void;
    userProfile: UserProfile;
    isForging: boolean;
    isSpeaking: boolean;
    isSystemCalculationMode?: boolean;
    nreProfile?: NREProfile;
    setNREProfile?: (p: NREProfile) => void;
}

const slideVariants: Variants = {
    initial: (dir: number) => ({
        y: dir > 0 ? '50%' : '-50%',
        opacity: 0,
        scale: 0.98
    }),
    animate: {
        y: 0,
        opacity: 1,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 250,
            damping: 25
        }
    },
    exit: (dir: number) => ({
        y: dir > 0 ? '-50%' : '50%',
        opacity: 0,
        scale: 1.02,
        transition: {
            duration: 0.3
        }
    })
};

export const DiscoverView: React.FC<DiscoverViewProps> = ({ 
    agents, 
    activeAgentId, 
    direction, 
    setActiveAgentId, 
    onEnterLounge, 
    onTagClick,
    onLike,
    onBookmark,
    onShare,
    userProfile,
    isForging, 
    isSpeaking,
    isSystemCalculationMode = false,
    nreProfile,
    setNREProfile
}) => {
    
    // V17.0: Skeleton Loading State
    // If no agents are loaded yet or actively fetching, show skeleton
    if (!agents || agents.length === 0) {
        return (
            <div className="relative h-screen w-full overflow-hidden bg-black">
                <SkeletonTacticalHUD />
                <div className="absolute bottom-10 left-0 right-0 text-center">
                    <span className="text-xs font-mono text-matrix-green animate-pulse">[ INITIALIZING_YOUAGENT_LINK... ]</span>
                </div>
            </div>
        );
    }

    const currentAgent = agents.find(a => a.id === activeAgentId) || agents[0];

    return (
        <div className="relative h-screen w-full overflow-hidden bg-black">
            <div className={`absolute inset-0 z-0 transition-all duration-1000 ${isSystemCalculationMode ? 'grayscale brightness-50' : ''}`}>
                <AnimatePresence mode='popLayout'>
                    {currentAgent && (
                        <motion.div 
                            key={`bg-${currentAgent.id}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1 }}
                            className="absolute inset-0"
                        >
                             <img 
                                src={currentAgent.video_poster} 
                                alt="bg" 
                                className="w-full h-full object-cover blur-[2px]" 
                             />
                             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="absolute inset-0 z-10">
                <AnimatePresence initial={false} custom={direction} mode='popLayout'>
                    {currentAgent && (
                        <motion.div
                            key={`content-${currentAgent.id}`}
                            custom={direction}
                            variants={slideVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="h-full w-full"
                        >
                            <TacticalHUD 
                                agent={currentAgent} 
                                onConnect={() => {
                                    if (currentAgent.connectivity?.try_url) {
                                        window.open(currentAgent.connectivity.try_url, '_blank');
                                    }
                                }} 
                                onEnterLounge={() => onEnterLounge(currentAgent)} 
                                onTagClick={onTagClick}
                                onLike={() => onLike(currentAgent.id)}
                                onBookmark={() => onBookmark(currentAgent.id)}
                                onShare={() => onShare(currentAgent)}
                                isLiked={userProfile.achievements.includes(`liked:${currentAgent.id}`)}
                                isBookmarked={userProfile.badges.includes(currentAgent.id)}
                                isForging={isForging}
                                isSpeaking={isSpeaking}
                                hideBackground={true}
                                nreProfile={nreProfile}
                                setNREProfile={setNREProfile}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
