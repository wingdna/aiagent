import React from 'react';
import { Key } from 'lucide-react';

import { UserKeys } from '../../types';

interface KeyVaultModalProps {
    onClose: () => void;
    keys: UserKeys;
    saveKey: (provider: keyof UserKeys, value: string) => void;
    rememberInSession: boolean;
    setRememberInSession: (v: boolean) => void;
}

const PROVIDERS = ['google', 'openai', 'anthropic', 'deepseek', 'siliconflow'] as const;

export const KeyVaultModal: React.FC<KeyVaultModalProps> = ({
    onClose,
    keys,
    saveKey,
    rememberInSession,
    setRememberInSession,
}) => (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur">
        <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                <Key size={20} className="text-yellow-500" /> GLOBAL KEY VAULT
            </h3>
            <div className="text-[10px] text-gray-400 font-mono mb-4 leading-relaxed">
                Keys are stored only in your browser&apos;s session memory for security. They are never sent to our servers except for proxying.
            </div>
            <label className="flex items-center gap-2 text-[10px] text-gray-300 font-mono mb-4 select-none">
                <input
                    type="checkbox"
                    checked={Boolean(rememberInSession)}
                    onChange={(e) => setRememberInSession(Boolean(e.target.checked))}
                    className="accent-yellow-500"
                />
                REMEMBER FOR THIS SESSION
            </label>
            <div className="space-y-4 mb-6">
                {PROVIDERS.map(p => (
                    <div key={p}>
                        <label className="text-[10px] text-gray-500 font-mono block mb-1 uppercase">{p}_API_KEY</label>
                        <input
                            type="password"
                            value={keys[p] || ''}
                            onChange={(e) => saveKey(p, e.target.value)}
                            className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs font-mono focus:border-yellow-500 focus:outline-none"
                        />
                    </div>
                ))}
            </div>
            <div className="flex justify-end">
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-yellow-500 text-black font-bold text-xs rounded hover:bg-yellow-400 transition-colors"
                >
                    SECURE &amp; CLOSE
                </button>
            </div>
        </div>
    </div>
);

export default KeyVaultModal;
