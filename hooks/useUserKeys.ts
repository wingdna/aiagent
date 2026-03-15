import { useState, useEffect, startTransition } from 'react';
import { UserKeys } from '../types';

export const useUserKeys = () => {
    // 1. 初始化时，服务端必须返回 null/默认值，绝不能执行 sessionStorage.getItem
    const [rememberInSession, setRememberInSessionState] = useState<boolean>(true);
    const [keys, setKeys] = useState<UserKeys>({});
    const [isClient, setIsClient] = useState(false);

    // 2. 只有在组件挂载到浏览器后，才同步真实数据
    useEffect(() => {
        startTransition(() => setIsClient(true));
        try {
            const savedRemember = sessionStorage.getItem('YOUAGENT_REMEMBER_KEYS');
            const remember = savedRemember ? savedRemember === 'true' : true;
            startTransition(() => setRememberInSessionState(remember));

            if (remember) {
                const savedKeys = sessionStorage.getItem('YOUAGENT_KEYS');
                if (savedKeys) {
                    startTransition(() => setKeys(JSON.parse(savedKeys)));
                }
            }
        } catch (e) {
            console.warn("Storage access failed", e);
        }

        const handleKeysUpdated = () => {
            try {
                const remember = sessionStorage.getItem('YOUAGENT_REMEMBER_KEYS');
                if (remember === 'false') {
                    startTransition(() => setKeys({}));
                    return;
                }
                const saved = sessionStorage.getItem('YOUAGENT_KEYS');
                if (saved) {
                    startTransition(() => setKeys(JSON.parse(saved)));
                } else {
                    startTransition(() => setKeys({}));
                }
            } catch (e) {
                console.warn("Storage access failed", e);
            }
        };

        window.addEventListener('youagent_keys_updated', handleKeysUpdated);
        return () => window.removeEventListener('youagent_keys_updated', handleKeysUpdated);
    }, []);

    // 3. 提供一个带同步的 setter
    const saveKey = (provider: keyof UserKeys, key: string) => {
        const newKeys = { ...keys, [provider]: key };
        startTransition(() => setKeys(newKeys));
        if (typeof window !== 'undefined') {
            if (rememberInSession) {
                sessionStorage.setItem('YOUAGENT_KEYS', JSON.stringify(newKeys));
            }
            window.dispatchEvent(new Event('youagent_keys_updated'));
        }
    };

    const setRememberInSession = (remember: boolean) => {
        startTransition(() => setRememberInSessionState(remember));
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('YOUAGENT_REMEMBER_KEYS', remember ? 'true' : 'false');
            if (!remember) {
                sessionStorage.removeItem('YOUAGENT_KEYS');
                startTransition(() => setKeys({}));
            }
            window.dispatchEvent(new Event('youagent_keys_updated'));
        }
    };

    return { keys, saveKey, rememberInSession, setRememberInSession, isClient };
};
