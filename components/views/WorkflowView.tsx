
import React, { useState } from 'react';
import { Briefcase, Layers, ArrowRight, Play, CheckCircle, AlertTriangle } from 'lucide-react';
import { Agent } from '../../types';
import { useUserKeys } from '../../hooks/useUserKeys';
import { useExecutionProxy } from '../../src/hooks/useExecutionProxy';
import { OpenAIStrategy } from '../../src/lib/execution/OpenAIStrategy';
import { TerminalStream } from '../shared/TerminalStream';
import { motion } from 'framer-motion';

export const WorkflowEngine: React.FC<{ agents: Agent[] }> = ({ agents }) => {
    // State
    const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
    const [inputPrompt, setInputPrompt] = useState('Analyze the sentiment of this text: "The new cyber-implants are revolutionizing the market but the ethical concerns are mounting."');
    
    const { keys } = useUserKeys();
    const strategy = React.useMemo(() => new OpenAIStrategy(), []);
    const { executePrompt, connect } = useExecutionProxy(strategy, { model: 'gpt-4o-mini' });

    const [chainState, setChainState] = useState({
        status: 'IDLE' as 'IDLE' | 'RUNNING' | 'COMPLETED' | 'ERROR',
        step: 0,
        logs: [] as string[],
        finalOutput: null as string | null
    });

    // Handlers
    const toggleAgent = (agent: Agent) => {
        if (selectedAgents.find(a => a.id === agent.id)) {
            setSelectedAgents(prev => prev.filter(a => a.id !== agent.id));
        } else {
            if (selectedAgents.length < 3) setSelectedAgents(prev => [...prev, agent]);
        }
    };

    const handleRunChain = async () => {
        if (selectedAgents.length === 0 || !inputPrompt) return;
        if (!keys.openai) {
            setChainState({ status: 'ERROR', step: 0, logs: ['[ERROR] Missing OPENAI key.'], finalOutput: null });
            return;
        }

        connect(keys.openai, strategy.providerId);
        setChainState({ status: 'RUNNING', step: 0, logs: [], finalOutput: null });

        let currentInput = inputPrompt;

        try {
            for (let i = 0; i < selectedAgents.length; i++) {
                const agent = selectedAgents[i];
                setChainState(prev => ({
                    ...prev,
                    step: i + 1,
                    logs: [...prev.logs, `[STEP ${i + 1}] Invoking ${agent.name}...`]
                }));

                let output = '';
                const systemPrompt = `You are part of a workflow chain. Role: ${agent.category}. Process the input.`;
                await executePrompt(currentInput, { systemPrompt, model: 'gpt-4o-mini' }, (chunk) => {
                    output += chunk;
                });
                currentInput = output;

                setChainState(prev => ({
                    ...prev,
                    logs: [...prev.logs, `[STEP ${i + 1}] Output generated (${output.length} chars).`]
                }));
            }

            setChainState(prev => ({
                ...prev,
                status: 'COMPLETED',
                finalOutput: currentInput,
                logs: [...prev.logs, `[SUCCESS] Chain execution complete.`]
            }));
        } catch (e: any) {
            setChainState(prev => ({
                ...prev,
                status: 'ERROR',
                logs: [...prev.logs, `[ERROR] Workflow failed.`]
            }));
        }
    };

    return (
        <div className="h-full w-full bg-black flex flex-col pt-20 px-6 pb-6 overflow-hidden">
            <h2 className="text-4xl font-display font-bold text-white mb-6 flex items-center gap-4">
                <Layers className="text-blue-500" /> CHAIN_REACTION_ENGINE
            </h2>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 h-full overflow-hidden">
                
                {/* 1. NODE SELECTOR */}
                <div className="col-span-12 md:col-span-3 bg-gray-900/30 border border-gray-800 rounded-xl p-4 flex flex-col h-full overflow-hidden">
                    <h3 className="text-xs font-mono text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                        AVAILABLE NODES <span className="px-2 py-0.5 bg-gray-800 rounded text-white">{selectedAgents.length}/3</span>
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {agents.map(agent => {
                            const isSelected = selectedAgents.find(a => a.id === agent.id);
                            const index = selectedAgents.findIndex(a => a.id === agent.id);
                            return (
                                <div 
                                    key={agent.id} 
                                    onClick={() => chainState.status !== 'RUNNING' && toggleAgent(agent)}
                                    className={`p-3 border rounded cursor-pointer transition-all group relative ${isSelected ? 'border-blue-500 bg-blue-900/20' : 'border-gray-800 bg-black hover:border-gray-600'}`}
                                >
                                    {isSelected && <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold text-black">{index + 1}</div>}
                                    <div className="font-bold text-white text-sm mb-1">{agent.name}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">{agent.category}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. CHAIN VISUALIZER & EXECUTOR */}
                <div className="col-span-12 md:col-span-9 flex flex-col h-full gap-6">
                    
                    {/* Visual Pipeline */}
                    <div className="h-48 bg-black/50 border border-gray-800 rounded-xl p-6 relative flex items-center justify-start gap-4 overflow-x-auto">
                        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
                        
                        {/* Input Node */}
                        <div className="shrink-0 w-32 h-32 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center relative bg-gray-900/20">
                            <div className="text-center">
                                <div className="text-xs font-mono text-gray-500 mb-1">INPUT</div>
                                <div className="text-xs font-bold text-white">USER_DATA</div>
                            </div>
                            {chainState.status === 'RUNNING' && chainState.step === 0 && (
                                <motion.div layoutId="packet" className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_10px_white]" />
                            )}
                        </div>

                        {/* Arrows & Nodes */}
                        {selectedAgents.map((agent, i) => (
                            <React.Fragment key={agent.id}>
                                <div className="shrink-0 flex items-center justify-center w-12 text-gray-600">
                                    <ArrowRight />
                                </div>
                                <div className={`shrink-0 w-32 h-32 border border-gray-700 rounded-lg flex flex-col items-center justify-center relative transition-all ${chainState.step === i + 1 ? 'border-blue-500 bg-blue-900/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'bg-gray-900/40'}`}>
                                    <img src={agent.video_poster} className="w-8 h-8 rounded-full mb-2 object-cover opacity-80" />
                                    <div className="text-[10px] font-bold text-white text-center px-2 truncate w-full">{agent.name}</div>
                                    <div className="text-[8px] text-gray-500 uppercase">{agent.category}</div>
                                    {chainState.step === i + 1 && (
                                        <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    )}
                                    {chainState.status === 'RUNNING' && chainState.step === i + 1 && (
                                         <motion.div layoutId="packet" className="absolute w-full h-full border-2 border-blue-500 rounded-lg" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} />
                                    )}
                                </div>
                            </React.Fragment>
                        ))}

                        {/* Final Output Node */}
                        {selectedAgents.length > 0 && (
                            <>
                                <div className="shrink-0 flex items-center justify-center w-12 text-gray-600"><ArrowRight /></div>
                                <div className={`shrink-0 w-32 h-32 border-2 border-green-500/50 rounded-lg flex items-center justify-center relative bg-green-900/10 ${chainState.status === 'COMPLETED' ? 'shadow-[0_0_20px_rgba(34,197,94,0.3)] bg-green-900/30' : ''}`}>
                                     <div className="text-center">
                                        <div className="text-xs font-mono text-green-500 mb-1">OUTPUT</div>
                                        <div className="text-xs font-bold text-white">RESULT</div>
                                    </div>
                                    {chainState.status === 'COMPLETED' && <CheckCircle className="absolute -top-2 -right-2 text-green-500 bg-black rounded-full" size={20} />}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Input & Output Terminals */}
                    <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
                        {/* Input Area */}
                        <div className="bg-gray-900/20 border border-gray-800 rounded-xl p-4 flex flex-col">
                            <h4 className="text-xs text-gray-400 font-mono mb-2 uppercase">Initial Payload</h4>
                            <textarea 
                                value={inputPrompt} 
                                onChange={(e) => setInputPrompt(e.target.value)}
                                className="flex-1 bg-black border border-gray-800 rounded p-3 text-xs font-mono text-gray-300 resize-none focus:border-blue-500 focus:outline-none"
                                disabled={chainState.status === 'RUNNING'}
                            />
                            <button 
                                onClick={handleRunChain} 
                                disabled={selectedAgents.length === 0 || !inputPrompt || chainState.status === 'RUNNING'}
                                className="mt-3 w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold tracking-widest text-xs rounded transition-all flex items-center justify-center gap-2"
                            >
                                {chainState.status === 'RUNNING' ? <Briefcase className="animate-spin" size={14} /> : <Play size={14} />}
                                START_CHAIN_REACTION
                            </button>
                        </div>

                        {/* Master Output */}
                        <div className="bg-black border border-gray-800 rounded-xl p-4 flex flex-col relative overflow-hidden">
                            <h4 className="text-xs text-green-500 font-mono mb-2 uppercase flex items-center gap-2"><TerminalStream text={">_ MASTER_OUTPUT"} /></h4>
                            <div className="flex-1 overflow-y-auto bg-gray-900/30 rounded p-3 relative">
                                <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-10"></div>
                                {chainState.status === 'IDLE' && <div className="text-gray-600 text-xs font-mono text-center mt-10">Waiting for chain execution...</div>}
                                {chainState.logs.map((log, i) => (
                                    <div key={i} className="text-[10px] font-mono text-gray-500 mb-1">{log}</div>
                                ))}
                                {chainState.finalOutput && (
                                    <div className="mt-4 pt-4 border-t border-gray-700">
                                        <TerminalStream text={chainState.finalOutput} color="#4ade80" />
                                    </div>
                                )}
                                {chainState.status === 'ERROR' && (
                                     <div className="mt-4 p-2 border border-red-500 bg-red-900/20 text-red-500 text-xs font-mono flex items-center gap-2">
                                         <AlertTriangle size={14} /> CHAIN_FAILURE: Check Keys or Rate Limits.
                                     </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
