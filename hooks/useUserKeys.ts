import { useState } from 'react';
import { UserKeys } from '../types';

export const useUserKeys = () => {
    const [rememberInSession, setRememberInSessionState] = useState<boolean>(() => {
        const saved = sessionStorage.getItem('YOUAGENT_REMEMBER_KEYS');
        return saved ? saved === 'true' : true;
    });

    const [keys, setKeys] = useState<UserKeys>(() => {
        const remember = sessionStorage.getItem('YOUAGENT_REMEMBER_KEYS');
        if (remember === 'false') return {};
        const saved = sessionStorage.getItem('YOUAGENT_KEYS');
        return saved ? JSON.parse(saved) : {};
    });

    const saveKey = (provider: keyof UserKeys, key: string) => {
        const newKeys = { ...keys, [provider]: key };
        setKeys(newKeys);
        if (rememberInSession) {
            sessionStorage.setItem('YOUAGENT_KEYS', JSON.stringify(newKeys));
        }
    };

    const setRememberInSession = (remember: boolean) => {
        setRememberInSessionState(remember);
        sessionStorage.setItem('YOUAGENT_REMEMBER_KEYS', remember ? 'true' : 'false');
        if (!remember) {
            sessionStorage.removeItem('YOUAGENT_KEYS');
            setKeys({});
        }
    };

    return { keys, saveKey, rememberInSession, setRememberInSession };
};
