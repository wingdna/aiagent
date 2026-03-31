
import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, X, Activity, Chrome, Github, Command, Lock } from 'lucide-react';
import { dataService, Provider } from '../../services/dataService';

interface LoginModalProps {
    onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
    const [scanState, setScanState] = useState<'IDLE' | 'SCANNING' | 'REDIRECTING' | 'ERROR'>('IDLE');
    const [errorMsg, setErrorMsg] = useState('');

    const handleOAuth = async (provider: Provider) => {
        setScanState('SCANNING');
        setErrorMsg('');

        // 1. Simulate Scanning Phase
        await new Promise(r => setTimeout(r, 800));
        setScanState('REDIRECTING');

        // 2. Trigger OAuth
        const { error } = await dataService.signInWithOAuth(provider);

        if (error) {
            setScanState('ERROR');
            setErrorMsg(error.message);
            setTimeout(() => setScanState('IDLE'), 3000);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <m.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-black border border-cyan-500/30 shadow-[0_0_50px_rgba(34,211,238,0.15)] relative overflow-hidden clip-angle"
            >
                {/* Header */}
                <div className="bg-cyan-500/10 p-4 border-b border-cyan-500/30 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-cyan-400 font-display font-bold tracking-widest text-sm">
                        <Terminal size={16} />
                        YOUAGENT_AUTHENTICATION
                    </div>
                    <button onClick={onClose} className="text-cyan-400/50 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Main Content */}
                <div className="p-8 relative">
                    
                    {/* Scanning / Redirecting Overlay */}
                    <AnimatePresence>
                        {scanState !== 'IDLE' && scanState !== 'ERROR' && (
                            <m.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/95 z-20 flex flex-col items-center justify-center pointer-events-none"
                            >
                                <div className="relative w-24 h-24 mb-6">
                                    <div className="absolute inset-0 border-t-2 border-b-2 border-cyan-400 rounded-full animate-spin"></div>
                                    <div className="absolute inset-2 border-l-2 border-r-2 border-cyan-500/50 rounded-full animate-spin-slow reverse"></div>
                                    <Lock size={32} className="absolute inset-0 m-auto text-cyan-400 animate-pulse" />
                                </div>
                                <div className="text-cyan-400 font-mono text-xs tracking-[0.2em] animate-pulse">
                                    {scanState === 'SCANNING' ? 'ENCRYPTING_SIGNAL...' : 'ESTABLISHING_UPLINK...'}
                                </div>
                            </m.div>
                        )}
                    </AnimatePresence>

                    <div className="text-center mb-8">
                        <h2 className="text-white font-display font-bold text-xl tracking-wider mb-2">SELECT_NODE</h2>
                        <p className="text-gray-500 font-mono text-[10px] uppercase">Secure connection required for neural access</p>
                    </div>

                    {errorMsg && (
                        <div className="mb-4 p-3 bg-red-900/20 border border-red-500 text-red-500 text-xs font-mono flex items-center gap-2">
                            <Activity className="animate-pulse" size={14} /> {errorMsg}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* GOOGLE NODE */}
                        <button 
                            onClick={() => handleOAuth('google')}
                            className="w-full group relative flex items-center gap-4 p-4 border border-gray-800 bg-gray-900/30 hover:border-[#4285F4] hover:bg-[#4285F4]/10 transition-all duration-300 overflow-hidden"
                        >
                            {/* Removed scanline effect */}
                            <Chrome size={20} className="text-gray-400 group-hover:text-[#4285F4] transition-colors" />
                            <div className="flex flex-col items-start">
                                <span className="font-mono text-xs font-bold text-gray-300 group-hover:text-white tracking-widest">AUTHENTICATE_VIA_GOOGLE</span>
                                <span className="font-mono text-[8px] text-gray-600 group-hover:text-[#4285F4]">NODE_G // 12ms LATENCY</span>
                            </div>
                            <div className="ml-auto w-2 h-2 bg-gray-800 group-hover:bg-[#4285F4] rounded-full transition-colors"></div>
                        </button>

                        {/* GITHUB NODE */}
                        <button 
                            onClick={() => handleOAuth('github')}
                            className="w-full group relative flex items-center gap-4 p-4 border border-gray-800 bg-gray-900/30 hover:border-white hover:bg-white/10 transition-all duration-300 overflow-hidden"
                        >
                            {/* Removed scanline effect */}
                            <Github size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                            <div className="flex flex-col items-start">
                                <span className="font-mono text-xs font-bold text-gray-300 group-hover:text-white tracking-widest">AUTHENTICATE_VIA_GITHUB</span>
                                <span className="font-mono text-[8px] text-gray-600 group-hover:text-gray-400">NODE_OCT // 08ms LATENCY</span>
                            </div>
                            <div className="ml-auto w-2 h-2 bg-gray-800 group-hover:bg-white rounded-full transition-colors"></div>
                        </button>

                        {/* APPLE NODE (Using Command Icon) */}
                        <button 
                            onClick={() => handleOAuth('apple')}
                            className="w-full group relative flex items-center gap-4 p-4 border border-gray-800 bg-gray-900/30 hover:border-[#A3AAAE] hover:bg-[#A3AAAE]/10 transition-all duration-300 overflow-hidden"
                        >
                            {/* Removed scanline effect */}
                            <Command size={20} className="text-gray-400 group-hover:text-[#A3AAAE] transition-colors" />
                            <div className="flex flex-col items-start">
                                <span className="font-mono text-xs font-bold text-gray-300 group-hover:text-white tracking-widest">AUTHENTICATE_VIA_APPLE</span>
                                <span className="font-mono text-[8px] text-gray-600 group-hover:text-[#A3AAAE]">NODE_APL // 15ms LATENCY</span>
                            </div>
                            <div className="ml-auto w-2 h-2 bg-gray-800 group-hover:bg-[#A3AAAE] rounded-full transition-colors"></div>
                        </button>
                    </div>

                    <div className="mt-8 text-center flex items-center justify-center gap-2">
                        <Shield size={12} className="text-cyan-400/50" />
                        <span className="text-[9px] font-mono text-gray-600">ENCRYPTED GATEWAY // OAUTH 2.0 PROTOCOL</span>
                    </div>
                </div>
                
                {/* Footer Decor */}
                <div className="bg-black p-1 border-t border-gray-800 flex justify-between px-2">
                    <div className="flex gap-1">
                        <div className="w-1 h-1 bg-cyan-400 animate-pulse"></div>
                        <div className="w-1 h-1 bg-cyan-400 animate-pulse delay-75"></div>
                        <div className="w-1 h-1 bg-cyan-400 animate-pulse delay-150"></div>
                    </div>
                </div>
            </m.div>
        </div>
    );
};
