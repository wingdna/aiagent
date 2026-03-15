import React from 'react';
import { SwarmPlan } from '../../types';
import { m } from 'framer-motion';
import { Zap, Hexagon, ArrowRight, DollarSign, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router';

interface SwarmPreviewProps {
    plan: SwarmPlan;
}

export const SwarmPreview: React.FC<SwarmPreviewProps> = ({ plan }) => {
    const navigate = useNavigate();

    return (
        <m.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-8 p-1 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 p-[1px]"
        >
            <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-6 border border-white/5 relative overflow-hidden">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                <div className="absolute top-0 right-0 p-4 opacity-50">
                    <BrainCircuit className="text-cyan-500 w-16 h-16 animate-pulse" />
                </div>

                {/* Header */}
                <div className="relative z-10 mb-6">
                    <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs tracking-widest mb-2">
                        <Hexagon size={12} className="animate-spin" />
                        [ SWARM_TACTICAL_SUGGESTION ]
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{plan.title}</h3>
                    <p className="text-gray-400 text-sm">{plan.description}</p>
                </div>

                {/* Agents Chain */}
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 mb-6">
                    {plan.agents.map((role, index) => (
                        <React.Fragment key={role.agent.id}>
                            {/* Connector */}
                            {index > 0 && (
                                <div className="hidden md:flex flex-col items-center justify-center text-cyan-500/50">
                                    <div className="w-8 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                                    <ArrowRight size={14} className="-mt-2" />
                                </div>
                            )}
                            
                            {/* Agent Node */}
                            <m.div 
                                whileHover={{ scale: 1.02 }}
                                className="flex-1 w-full md:w-auto bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-cyan-500/50 transition-colors"
                                onClick={() => navigate(`/agent/${role.agent.slug || role.agent.id}`)}
                            >
                                <img 
                                    src={role.agent.video_poster || role.agent.persona_img} 
                                    alt={role.agent.name}
                                    className="w-10 h-10 rounded-lg object-cover bg-gray-800"
                                />
                                <div>
                                    <div className="text-xs font-mono text-cyan-400 mb-0.5">{role.role}</div>
                                    <div className="font-bold text-sm text-gray-200">{role.agent.name}</div>
                                </div>
                            </m.div>

                            {/* Mobile Connector */}
                            {index < plan.agents.length - 1 && (
                                <div className="md:hidden text-cyan-500/50 rotate-90 my-[-10px]">
                                    <ArrowRight size={14} />
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Footer Stats */}
                <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-4 text-xs font-mono">
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <DollarSign size={12} className="text-green-400" />
                            EST. BUDGET: <span className="text-green-400">{plan.estimated_budget}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Zap size={12} className="text-yellow-400" />
                            COMPLEXITY: <span className="text-yellow-400">{(plan.complexity_score * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                    <button className="text-xs font-bold bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-lg border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors">
                        DEPLOY SWARM
                    </button>
                </div>
            </div>
        </m.div>
    );
};
