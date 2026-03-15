
import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { UserProfile } from '../types';
import { dataService } from '../services/dataService';

const GUEST_KEY = 'YOUAGENT_GUEST_PROFILE';

const DEFAULT_PROFILE: UserProfile = {
    id: 'guest',
    username: 'GUEST_USER',
    xp: 100,
    balance: 1000,
    reputation: 100,
    achievements: [],
    badges: []
};

export const useProfile = () => {
    const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // 1. Initialize & Auth Listener
    useEffect(() => {
        const init = async () => {
            // Check Local Storage for Guest Data first
            const savedGuest = localStorage.getItem(GUEST_KEY);
            if (savedGuest) {
                try {
                    startTransition(() => setProfile(JSON.parse(savedGuest)));
                } catch (e) {
                    console.error("Guest profile corrupted, resetting.");
                }
            }

            // Check Supabase Session
            const sessionData = await dataService.getSession();
            startTransition(() => setSession(sessionData));
            
            if (sessionData?.user) {
                await fetchProfile(sessionData.user);
            } else {
                startTransition(() => setLoading(false));
            }
        };

        init();

        const { data: { subscription } } = (dataService.supabase!.auth as any).onAuthStateChange((_event: any, session: any) => {
            startTransition(() => setSession(session));
            if (session?.user) {
                fetchProfile(session.user);
            } else {
                // Revert to local guest or default
                const savedGuest = localStorage.getItem(GUEST_KEY);
                startTransition(() => setProfile(savedGuest ? JSON.parse(savedGuest) : DEFAULT_PROFILE));
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // 2. Fetch & Subscribe to Profile (Auto-create if missing)
    const fetchProfile = async (user: any) => {
        startTransition(() => setLoading(true));
        let userProfile = await dataService.getUserProfile(user.id);
        
        if (!userProfile) {
            const metaName = user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.user_name;
            const cleanName = metaName ? metaName.replace(/\s+/g, '_').toUpperCase().substring(0, 15) : `USER_${user.id.substr(0,4)}`;
            
            userProfile = { 
                ...DEFAULT_PROFILE, 
                id: user.id, 
                username: cleanName,
                xp: 100, 
                balance: 1500 
            };
            await dataService.updateUserProfile(userProfile);
        }
        
        startTransition(() => {
            setProfile(userProfile);
            setLoading(false);
        });

        const sub = dataService.subscribeToProfile(user.id, (newPayload) => {
            startTransition(() => setProfile(prev => ({ ...prev, ...newPayload })));
        });

        return () => { if(sub) sub.unsubscribe(); };
    };

    const logout = async () => {
        await dataService.signOut();
        const savedGuest = localStorage.getItem(GUEST_KEY);
        startTransition(() => setProfile(savedGuest ? JSON.parse(savedGuest) : DEFAULT_PROFILE));
    };

    // Optimistic Updates + Persist
    const syncTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const syncUserProgress = useCallback((newProfile: UserProfile) => {
        startTransition(() => setProfile(newProfile));
        
        if (session?.user) {
            if (syncTimeout.current) clearTimeout(syncTimeout.current);
            syncTimeout.current = setTimeout(() => {
                dataService.updateUserProfile(newProfile);
            }, 1000); 
        } else {
            // Persist Guest Data
            localStorage.setItem(GUEST_KEY, JSON.stringify(newProfile));
        }
    }, [session]);

    const addXp = (amount: number) => {
        syncUserProgress({ ...profile, xp: profile.xp + amount });
    };

    const updateBalance = (amount: number | ((prev: number) => number)) => {
        const newBalance = typeof amount === 'function' ? amount(profile.balance) : amount;
        syncUserProgress({ ...profile, balance: newBalance });
    };

    const unlockAchievement = (id: string, xpReward: number) => {
        if (!profile.achievements.includes(id)) {
            syncUserProgress({
                ...profile,
                achievements: [...profile.achievements, id],
                xp: profile.xp + xpReward
            });
            return true;
        }
        return false;
    };

    return {
        profile,
        session,
        isLoggedIn: !!session,
        avatarUrl: session?.user?.user_metadata?.avatar_url, 
        loading,
        logout,
        addXp,
        updateBalance,
        unlockAchievement,
        syncUserProgress
    };
};
