import React from 'react';
import { motion } from 'framer-motion';
import { Sliders, Cpu, Zap, Activity, Settings } from 'lucide-react';
import { NREProfile } from '../../hooks/useNRE';

interface ArchitectControlProps {
    profile: NREProfile;
    setProfile: (p: NREProfile) => void;
    embedded?: boolean; // V6.1: Allow embedding in the layout
}

export const ArchitectControl: React.FC<ArchitectControlProps> = ({ profile, setProfile, embedded = false }) => {
    const containerClasses = embedded 
        ? "w-full bg-gray-900/30 border border-white/10 rounded-xl p-4 backdrop-blur-sm"
        : "fixed bottom-24 right-4 z-50 w-64 bg-black/90 border border-yellow-500/50 rounded-xl p-4 shadow-[0_0_30px_rgba(234,179,8,0.2)] backdrop-blur-md";

    const content = (
        <>
            <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
                <Settings size={14} className="text-yellow-500" />
                <h3 className="text-[10px] font-display font-bold text-yellow-500 tracking-widest">ARCHITECT_CORE</h3>
            </div>

            <div className="space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[9px] font-mono text-gray-400 flex items-center gap-2"><Cpu size={10} /> LOGIC_WEIGHT</label>
                        <span className="text-[10px] font-bold text-yellow-500 font-mono">{Math.round(profile.technical_bias * 100)}%</span>
                    </div>
                    <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div 
                            className="absolute top-0 left-0 h-full bg-yellow-500" 
                            initial={{ width: 0 }}
                            animate={{ width: `${(profile.technical_bias / 2) * 100}%` }}
                        />
                        <input 
                            type="range" min="0" max="2" step="0.1" 
                            value={profile.technical_bias}
                            onChange={(e) => setProfile({...profile, technical_bias: parseFloat(e.target.value)})}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[9px] font-mono text-gray-400 flex items-center gap-2"><Zap size={10} /> CREATIVE_WEIGHT</label>
                        <span className="text-[10px] font-bold text-yellow-500 font-mono">{Math.round(profile.creative_bias * 100)}%</span>
                    </div>
                    <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div 
                            className="absolute top-0 left-0 h-full bg-yellow-500" 
                            initial={{ width: 0 }}
                            animate={{ width: `${(profile.creative_bias / 2) * 100}%` }}
                        />
                        <input 
                            type="range" min="0" max="2" step="0.1" 
                            value={profile.creative_bias}
                            onChange={(e) => setProfile({...profile, creative_bias: parseFloat(e.target.value)})}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                </div>
                
                <div className="pt-2 border-t border-white/5 text-[8px] text-gray-600 font-mono text-center tracking-wider">
                    // NRE_ALGORITHM_OVERRIDE_ENGAGED
                </div>
            </div>
        </>
    );

    if (embedded) {
        return <div className={containerClasses}>{content}</div>;
    }

    return (
        <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={containerClasses}
        >
            {content}
        </motion.div>
    );
};