import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, Zap, Shield, Globe, Key, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Agent } from '../../types';

interface TacticalLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    agent: Agent;
    data?: any;
}

const TacticalLinkModal: React.FC<TacticalLinkModalProps> = ({ isOpen, onClose, agent, data }) => {
    const [apiKey, setApiKey] = useState('');
    const [status, setStatus] = useState<'idle' | 'stabilizing' | 'established' | 'error'>('idle');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleInitialize = async () => {
        setStatus('stabilizing');
        setError('');
        try {
            // Handshake logic: Proxying through /api/hybrid to avoid CORS
            const response = await fetch('/api/hybrid/ping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    key: apiKey,
                    url: agent.connectivity?.api_base_url || agent.connectivity?.try_url
                })
            });
            
            if (response.ok) {
                setStatus('established');
            } else {
                throw new Error('Handshake failed');
            }
        } catch (e) {
            setStatus('error');
            setError('Connection failed. Verify your Neural Key.');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <m.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div 
                            className="bg-[#0a0a0a] border border-cyan-500/30 w-full max-w-lg rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.2)] pointer-events-auto relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-gradient-to-r from-cyan-950/30 to-transparent">
                                <div>
                                    <h3 className="text-xl font-display text-white mb-1 flex items-center gap-2">
                                        <Zap size={18} className="text-cyan-400" />
                                        {status === 'established' ? 'LINK_ESTABLISHED' : 'NEURAL_LINK_INITIALIZATION'}
                                    </h3>
                                    <p className="text-xs font-mono text-cyan-500/70 uppercase tracking-wider">
                                        SECURE_CHANNEL_ID: {agent.id.substring(0, 8).toUpperCase()}
                                    </p>
                                </div>
                                <button 
                                    onClick={onClose}
                                    className="text-gray-500 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8 space-y-6">
                                {status === 'idle' && (
                                    <div className="space-y-4">
                                        <label className="block text-xs font-mono text-cyan-400 uppercase tracking-widest">INPUT_NEURAL_KEY</label>
                                        <input
                                            type="password"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            className="w-full bg-black border border-cyan-500/30 rounded-xl p-4 text-white font-mono focus:border-cyan-400 focus:outline-none"
                                            placeholder="sk-..."
                                        />
                                        <button
                                            onClick={handleInitialize}
                                            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
                                        >
                                            INITIALIZE_LINK
                                        </button>
                                        {error && <p className="text-red-500 text-xs font-mono flex items-center gap-2"><AlertCircle size={12} /> {error}</p>}
                                    </div>
                                )}

                                {status === 'stabilizing' && (
                                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                                        <Loader2 size={48} className="text-cyan-500 animate-spin" />
                                        <p className="text-cyan-400 font-mono text-sm animate-pulse">[NEURAL_LINK_STABILIZING...]</p>
                                    </div>
                                )}

                                {status === 'established' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 text-green-400 font-mono text-sm">
                                            <CheckCircle size={20} />
                                            [LINK_ESTABLISHED]
                                        </div>
                                        <div className="h-64 bg-black rounded-xl border border-white/10 p-4 font-mono text-xs text-gray-400 overflow-y-auto">
                                            {`> Initializing console for ${agent.name}...`}
                                            <br />
                                            {`> Connection established.`}
                                            <br />
                                            {`> Intel: ${data ? JSON.stringify(data) : 'No intel available'}`}
                                            <br />
                                            {`> Ready for commands.`}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-black/40 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Globe size={12} />
                                    <span>PROTOCOL: HTTPS_SECURE</span>
                                </div>
                                <span>LATENCY: &lt;12ms</span>
                            </div>
                        </div>
                    </m.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default TacticalLinkModal;
