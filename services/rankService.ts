
import { UserRank } from '../types';
import { IdentitySystem, LEVELS } from '../engine/identity';

// Re-export consts used by App
export { LEVELS };

export const XP_EVENTS = {
    NAVIGATE: 5,
    BET_PLACED: 50,
    WIN_BATTLE: 100,
    CHAT_MESSAGE: 10,
    CONFIG_KEY: 200,
    DISCOVER_SECRET: 500
};

export const ACHIEVEMENTS = [
    { id: 'FIRST_BLOOD', title: 'FIRST_BLOOD', description: 'Place your first bet in the Arena.', xp: 100 },
    { id: 'NEURAL_WHALE', title: 'NEURAL_WHALE', description: 'Accumulate over 5000 credits.', xp: 500 },
    { id: 'SYS_ADMIN', title: 'SYS_ADMIN', description: 'Access the hidden admin console.', xp: 300 },
    { id: 'DEEP_DIVE', title: 'DEEP_DIVE', description: 'Interact with 5 different agents.', xp: 150 }
];

// Bridge to Engine
export const getRankInfo = (xp: number): UserRank => {
    return IdentitySystem.calculateRank(xp);
};

export const calculateInfluence = (reputation: number): number => {
    return IdentitySystem.calculateInfluence(reputation);
};
