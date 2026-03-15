import React, { Suspense } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Trash, Plus, Save, Activity, Play } from 'lucide-react';
import { Agent } from '../../../types';
import { TerminalStream } from '../../shared/TerminalStream';

interface TacticalModePanelProps {
    agents: Agent[];
    executeWorkflow: () => void;
    chainState: {
        status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'ERROR';
        step: number;
        logs: string[];
        finalOutput: string | null;
    };
    workflowNodes: Agent[];
    workflowInput: string;
    setWorkflowInput: (v: string) => void;
    isSelectingForWorkflow: boolean;
    setIsSelectingForWorkflow: (v: boolean) => void;
    addNode: (agent: Agent) => void;
    removeNode: (index: number) => void;
    logsEndRef: React.RefObject<HTMLDivElement>;
}

export const TacticalModePanel: React.FC<TacticalModePanelProps> = ({
    agents,
    executeWorkflow,
    chainState,
    workflowNodes,
    workflowInput,
    setWorkflowInput,
    isSelectingForWorkflow,
    setIsSelectingForWorkflow,
    addNode,
    removeNode,
    logsEndRef
}) => {
    return (
        <div className="h-full flex flex-col pt-6 px-2 md:px-6 pb-6 overflow-hidden">
            {/* AGENT SELECTOR MODAL FOR WORKFLOW */}
            {isSelectingForWorkflow && (
                <div className="absolute inset-0 bg-black/90 z-50 p-8 flex flex-col animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-display font-bold text-white">ADD_NEURAL_NODE</h3>
                        <button onClick={() => setIsSelectingForWorkflow(false)}><X className="text-gray-500 hover:text-white" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto pb-10">
                        {agents.map(agent => (
                            <div key={agent.id} onClick={() => addNode(agent)} className="border border-gray-800 bg-gray-900/50 p-4 rounded hover:border-cyan-400 hover:bg-cyan-500/10 cursor-pointer flex items-center gap-4 transition-all">
                                <img src={agent.video_poster} alt="" className="w-12 h-12 rounded object-cover" />
                                <div>
                                    <div className="font-bold text-white text-sm">{agent.name}</div>
                                    <div className="text-[10px] text-gray-500">{agent.category}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
                {/* CANVAS */}
                <div className="flex-1 bg-gray-900/20 border border-gray-800 rounded-xl relative overflow-hidden flex flex-col">
                    <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/40 backdrop-blur">
                        <div className="text-xs font-mono text-gray-400">NEURAL_CHAIN_EDITOR</div>
                        <div className="text-[10px] text-gray-600">NODES: {workflowNodes.length}/5</div>
                    </div>

                    <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-center px-8 gap-4 custom-scrollbar">
                        {/* INPUT NODE */}
                        <div className="shrink-0 w-40 h-48 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center bg-black/50 relative">
                            <div className="text-xs font-mono text-gray-500 mb-2">INPUT_SOURCE</div>
                            <div className="text-xs font-bold text-white bg-gray-800 px-3 py-1 rounded">USER_PROMPT</div>
                            <div className="absolute -right-2 top-1/2 w-4 h-4 bg-gray-700 rounded-full border-4 border-black transform translate-x-1/2 -translate-y-1/2"></div>
                        </div>

                        {/* AGENT NODES */}
                        <AnimatePresence>
                            {workflowNodes.map((node, i) => (
                                <React.Fragment key={node.id + i}>
                                    <div className="shrink-0 text-gray-600"><ArrowRight /></div>
                                    <m.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        className={`shrink-0 w-48 h-64 border rounded-xl flex flex-col relative group overflow-hidden transition-all ${chainState.step === i + 1 ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'border-gray-700 bg-gray-900/40'}`}
                                    >
                                        <img src={node.video_poster} alt="" className="w-full h-24 object-cover opacity-50 group-hover:opacity-80 transition-opacity" />
                                        <div className="p-3 flex-1 flex flex-col">
                                            <div className="text-xs font-bold text-white mb-1">{node.name}</div>
                                            <div className="text-[9px] text-gray-500 uppercase mb-auto">{node.category}</div>
                                            <div className="flex justify-between items-center mt-2">
                                                <div className="text-[10px] font-mono text-gray-600">STEP {i + 1}</div>
                                                {chainState.status !== 'RUNNING' && (
                                                    <button onClick={() => removeNode(i)} className="text-red-500 hover:text-red-400 p-1"><Trash size={12} /></button>
                                                )}
                                            </div>
                                        </div>
                                        {chainState.step === i + 1 && (
                                            <div className="absolute inset-0 bg-cyan-500/10 animate-pulse pointer-events-none"></div>
                                        )}
                                    </m.div>
                                </React.Fragment>
                            ))}
                        </AnimatePresence>

                        {/* ADD BUTTON */}
                        <div className="shrink-0 text-gray-600"><ArrowRight /></div>
                        <button
                            onClick={() => setIsSelectingForWorkflow(true)}
                            disabled={chainState.status === 'RUNNING'}
                            className="shrink-0 w-40 h-48 border-2 border-dashed border-gray-700 hover:border-white hover:bg-white/5 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={24} className="text-gray-500 group-hover:text-white mb-2" />
                            <div className="text-xs font-mono text-gray-500 group-hover:text-white">ADD_NODE</div>
                        </button>
                    </div>
                </div>

                {/* BOTTOM CONTROLS */}
                <div className="h-1/3 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[200px]">
                    {/* INPUT */}
                    <div className="bg-black border border-gray-800 rounded-xl p-4 flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-mono text-gray-400">INITIAL_PAYLOAD</label>
                            <button className="text-[10px] flex items-center gap-1 text-gray-500 hover:text-white"><Save size={10} /> SAVE_RECIPE</button>
                        </div>
                        <textarea
                            value={workflowInput}
                            onChange={(e) => setWorkflowInput(e.target.value)}
                            disabled={chainState.status === 'RUNNING'}
                            className="flex-1 bg-gray-900/50 border border-gray-800 rounded p-3 text-xs font-mono text-gray-300 resize-none focus:border-cyan-400 focus:outline-none"
                        />
                    </div>

                    {/* EXECUTION & LOGS */}
                    <div className="bg-black border border-gray-800 rounded-xl p-4 flex flex-col relative">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-xs font-mono text-cyan-400 flex items-center gap-2"><TerminalStream text=">_ EXECUTION_LOG" /></div>
                            {chainState.status === 'RUNNING' && <Activity size={14} className="text-cyan-400 animate-spin" />}
                        </div>
                        <div className="flex-1 bg-gray-900/30 rounded p-3 overflow-y-auto custom-scrollbar font-mono text-[10px] text-gray-400 mb-3 border border-gray-800/50">
                            {chainState.logs.length === 0 && <span className="opacity-30">Waiting for execution...</span>}
                            {chainState.logs.map((log, i) => <div key={i} className="mb-1">{log}</div>)}
                            <div ref={logsEndRef} />
                        </div>
                        <button
                            onClick={executeWorkflow}
                            disabled={workflowNodes.length === 0 || !workflowInput || chainState.status === 'RUNNING'}
                            className="w-full py-3 bg-cyan-400 text-black font-display font-black tracking-widest text-xs rounded hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {chainState.status === 'RUNNING' ? 'PROCESSING_CHAIN...' : <><Play size={14} /> EXECUTE_TACTICAL_FLOW</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
