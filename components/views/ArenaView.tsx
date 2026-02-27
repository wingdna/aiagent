
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Coins, Crosshair, RefreshCw, Plus, X, Users, Network, Play, Save, ArrowRight, Trash, Activity } from 'lucide-react';
import { Agent, Challenge } from '../../types';
import { CombatEngine } from '../../engine/combat';
import { useUserKeys } from '../../hooks/useUserKeys';
import { useExecutionProxy } from '../../src/hooks/useExecutionProxy';
import { OpenAIStrategy } from '../../src/lib/execution/OpenAIStrategy';
import { ArenaSlot } from './ArenaSlot';
import { TerminalStream } from '../shared/TerminalStream';

// --- TYPES & CONSTANTS ---
type ArenaMode = 'SOLO' | 'SQUAD' | 'TACTICAL';
type BattleState = 'IDLE' | 'FIGHTING' | 'FINISHED';
type Outcome = string; 

interface ArenaViewProps {
  agents: Agent[];
  lastViewedId: string | null;
  balance: number;
  onUpdateBalance: React.Dispatch<React.SetStateAction<number>>;
}

const SQUAD_ROLES = ['VANGUARD', 'TACTICIAN', 'ANCHOR'];
const SLOT_LABELS = ['A', 'B', 'C', 'D'];
const WAGER_PER_BET = 100;

export const ArenaView: React.FC<ArenaViewProps> = ({ agents, lastViewedId, balance, onUpdateBalance }) => {
    // --- STATE: ARENA ---
    const [mode, setMode] = useState<ArenaMode>('SOLO');
    const [soloSlotCount, setSoloSlotCount] = useState(2); // 2 to 4
    const [slots, setSlots] = useState<(Agent | null)[]>(Array(6).fill(null)); 
    const [slotLogs, setSlotLogs] = useState<string[][]>(Array(6).fill([])); 
    const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
    const [battleState, setBattleState] = useState<BattleState>('IDLE');
    const [selectedOutcomes, setSelectedOutcomes] = useState<Outcome[]>([]);
    const [globalLogs, setGlobalLogs] = useState<string[]>([]);
    const [winnerOutcome, setWinnerOutcome] = useState<Outcome | null>(null);

    // --- STATE: TACTICAL (WORKFLOW) ---
    const [workflowNodes, setWorkflowNodes] = useState<Agent[]>([]);
    const [workflowInput, setWorkflowInput] = useState('Analyze the neural patterns of the previous sector.');
    const [isSelectingForWorkflow, setIsSelectingForWorkflow] = useState(false);

    // --- SHARED HOOKS ---
    const { keys, saveKey } = useUserKeys();
    const strategy = useMemo(() => new OpenAIStrategy(), []);
    const { executePrompt, connect, isStreaming: isExecuting } = useExecutionProxy(strategy, { model: 'gpt-4o-mini' });

    const [chainState, setChainState] = useState({
        status: 'IDLE' as 'IDLE' | 'RUNNING' | 'COMPLETED' | 'ERROR',
        step: 0,
        logs: [] as string[],
        finalOutput: null as string | null
    });
    const logsEndRef = useRef<HTMLDivElement>(null);

    // --- EFFECTS ---
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [globalLogs, chainState.logs]);

    // Auto-match for Solo (Initial 1v1)
    useEffect(() => {
        if (mode === 'SOLO' && battleState === 'IDLE' && lastViewedId && agents.length > 0 && !slots[0]) {
            const challenger = agents.find(a => a.id === lastViewedId);
            if (challenger) {
                const candidates = agents.filter(a => 
                    a.id !== challenger.id && 
                    a.category === challenger.category &&
                    Math.abs((a.stats?.elo || 1200) - (challenger.stats?.elo || 1200)) < 400
                );
                const opponent = candidates.length > 0 
                    ? candidates[Math.floor(Math.random() * candidates.length)] 
                    : agents.find(a => a.id !== challenger.id);
                
                const newSlots = [...slots];
                newSlots[0] = challenger;
                newSlots[1] = opponent || null;
                setSlots(newSlots);
            }
        }
    }, [mode, lastViewedId, agents]);

    // --- LOGIC: ODDS CALCULATOR ---
    const oddsMap = useMemo(() => {
        const map: Record<string, number> = {};
        if (mode === 'SOLO') {
            const activeAgents = slots.slice(0, soloSlotCount);
            const participants = activeAgents.filter(Boolean) as Agent[];
            if (participants.length < 2) {
                for(let i=0; i<soloSlotCount; i++) map[i.toString()] = 1.0;
            } else {
                activeAgents.forEach((agent, idx) => {
                    if (agent) map[idx.toString()] = CombatEngine.calculateOdds(agent.id, participants);
                    else map[idx.toString()] = 1.0;
                });
            }
        } else if (mode === 'SQUAD') {
            const teamAlpha = slots.slice(0, 3).filter(Boolean) as Agent[];
            const teamOmega = slots.slice(3, 6).filter(Boolean) as Agent[];
            if (teamAlpha.length === 0 || teamOmega.length === 0) {
                map['ALPHA'] = 1.0; map['OMEGA'] = 1.0;
            } else {
                const scoreAlpha = teamAlpha.reduce((sum, a) => sum + (a.stats?.elo || 1200), 0);
                const scoreOmega = teamOmega.reduce((sum, a) => sum + (a.stats?.elo || 1200), 0);
                const total = scoreAlpha + scoreOmega;
                map['ALPHA'] = parseFloat((1 / (scoreAlpha / total) * 0.9).toFixed(2));
                map['OMEGA'] = parseFloat((1 / (scoreOmega / total) * 0.9).toFixed(2));
            }
        }
        return map;
    }, [slots, mode, soloSlotCount]);

    // --- HANDLERS: ARENA ---
    const handleModeSwitch = (newMode: ArenaMode) => {
        if (battleState === 'FIGHTING' || chainState.status === 'RUNNING') return;
        setMode(newMode);
        setSlots(Array(6).fill(null)); 
        setSlotLogs(Array(6).fill([]));
        setBattleState('IDLE');
        setSelectedOutcomes([]);
        setGlobalLogs([]);
        setWinnerOutcome(null);
        setActiveSlotIndex(null);
    };

    const handleSlotUpdate = (index: number, agent: Agent | null) => {
        if (battleState === 'FIGHTING') return;
        const newSlots = [...slots];
        if (mode === 'SOLO' && agent && newSlots[0] && index !== 0) {
             if (agent.category !== newSlots[0].category) return;
        }
        newSlots[index] = agent;
        setSlots(newSlots);
        setWinnerOutcome(null);
    };

    const handleLogUpdate = (index: number, msg: string) => {
        setSlotLogs(prev => {
            const next = [...prev];
            const currentLogs = next[index] || [];
            // Keep only last 10 logs to prevent DOM overflow
            next[index] = [...currentLogs, msg].slice(-10);
            return next;
        });
    };

    const toggleBet = (outcome: string) => {
        if (battleState !== 'IDLE') return;
        setSelectedOutcomes(prev => {
            if (prev.includes(outcome)) return prev.filter(o => o !== outcome);
            return [...prev, outcome];
        });
    };

    const adjustSoloCount = (delta: number) => {
        if (battleState === 'FIGHTING') return;
        const newCount = Math.max(2, Math.min(4, soloSlotCount + delta));
        setSoloSlotCount(newCount);
        setSelectedOutcomes(prev => prev.filter(o => parseInt(o) < newCount));
    };

    // --- HANDLERS: TACTICAL (WORKFLOW) ---
    const addNode = (agent: Agent) => {
        if (workflowNodes.length < 5) {
            setWorkflowNodes([...workflowNodes, agent]);
        }
        setIsSelectingForWorkflow(false);
    };

    const removeNode = (index: number) => {
        setWorkflowNodes(prev => prev.filter((_, i) => i !== index));
    };

    const executeWorkflow = async () => {
        if (workflowNodes.length === 0 || !workflowInput) return;
        if (!keys.openai) {
            setChainState({ status: 'ERROR', step: 0, logs: ['[ERROR] Missing OPENAI key.'], finalOutput: null });
            return;
        }

        connect(keys.openai, strategy.providerId);
        setChainState({ status: 'RUNNING', step: 0, logs: [], finalOutput: null });

        let currentInput = workflowInput;

        try {
            for (let i = 0; i < workflowNodes.length; i++) {
                const node = workflowNodes[i];
                setChainState(prev => ({
                    ...prev,
                    step: i + 1,
                    logs: [...prev.logs, `[STEP ${i + 1}] Invoking ${node.name}...`]
                }));

                let output = '';
                const systemPrompt = `You are part of a workflow chain. Role: ${node.category}. Process the input.`;

                await executePrompt(currentInput, { systemPrompt, model: 'gpt-4o-mini' }, (chunk) => {
                    output += chunk;
                });

                setChainState(prev => ({
                    ...prev,
                    logs: [...prev.logs, `[STEP ${i + 1}] Output generated (${output.length} chars).`]
                }));

                currentInput = output;
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

    // --- EXECUTION LOGIC (ARENA) ---
    const startCombat = async () => {
        const stake = selectedOutcomes.length * WAGER_PER_BET;
        if (stake === 0) return;
        if (balance < stake) {
            setGlobalLogs(prev => [...prev, `[SYSTEM] INSUFFICIENT FUNDS. REQUIRED: ${stake}N`]);
            return;
        }

        const activeIndices = mode === 'SOLO' ? Array.from({length: soloSlotCount}, (_, i) => i) : [0, 1, 2, 3, 4, 5];
        const missingKeys = activeIndices.some(i => {
            const agent = slots[i];
            if (mode === 'SOLO' && !agent) return true;
            if (!agent) return false;
            // Check keys for this provider (key vault handled separately)
            return false; 
        });

        onUpdateBalance(prev => prev - stake);
        setBattleState('FIGHTING');
        setGlobalLogs(["INITIALIZING COMBAT PROTOCOL...", "ESTABLISHING TITANIUM UPLINK..."]);
        setSlotLogs(Array(6).fill([])); 

        if (mode === 'SQUAD') {
            await executeSquadBattle();
        } else {
            // PARALLEL STREAMING EXECUTION
            const promises = activeIndices.map(async (i) => {
                const agent = slots[i];
                if (!agent) return;

                const systemPrompt = `You are ${agent.name} in a gladiator battle. Your stats: Reasoning ${agent.metrics.reasoning}, Speed ${agent.metrics.speed}. Generate short, high-intensity combat logs describing your attacks and defenses.`;
                const userPrompt = "Engage combat. Output 3-5 log lines.";

                if (!keys.openai) return;
                connect(keys.openai, strategy.providerId);

                let buffer = '';
                await executePrompt(userPrompt, { systemPrompt, model: 'gpt-4o-mini' }, (chunk) => {
                    buffer += chunk;

                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const text = line.trim();
                        if (text.length > 0) handleLogUpdate(i, text);
                    }
                });

                if (buffer.trim().length > 0) handleLogUpdate(i, buffer.trim());
            });

            // Wait for all streams to finish (approx) or timeout
            await Promise.race([
                Promise.all(promises),
                new Promise(resolve => setTimeout(resolve, 8000)) // Force resolve after 8s
            ]);
            
            resolveBattle();
        }
    };

    const executeSquadBattle = async () => {
        // Simplified Squad logic for V6.5 (Focus on Solo Streaming)
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            if (Math.random() > 0.5) handleLogUpdate(Math.floor(Math.random()*3), 'ALPHA Unit Acting...');
            else handleLogUpdate(Math.floor(Math.random()*3)+3, 'OMEGA Unit Acting...');
            if (progress >= 100) {
                clearInterval(interval);
                resolveBattle();
            }
        }, 300);
    };

    const resolveBattle = () => {
        let winner: Outcome | null = null;
        if (mode === 'SOLO') {
            const participants = slots.slice(0, soloSlotCount) as Agent[];
            const winnerId = CombatEngine.simulateBattle(participants);
            const winnerIndex = participants.findIndex(a => a.id === winnerId);
            winner = winnerIndex !== -1 ? winnerIndex.toString() : '0';
        } else {
            const teamAlpha = slots.slice(0, 3).filter(Boolean) as Agent[];
            const teamOmega = slots.slice(3, 6).filter(Boolean) as Agent[];
            const scoreAlpha = teamAlpha.reduce((sum, a) => sum + (a.stats?.elo || 1200), 0) + (Math.random() * 500);
            const scoreOmega = teamOmega.reduce((sum, a) => sum + (a.stats?.elo || 1200), 0) + (Math.random() * 500);
            winner = scoreAlpha > scoreOmega ? 'ALPHA' : 'OMEGA';
        }

        setWinnerOutcome(winner);
        setBattleState('FINISHED');
        
        const hit = selectedOutcomes.includes(winner);
        const totalStake = selectedOutcomes.length * WAGER_PER_BET;
        let payout = 0;
        
        if (hit) {
            const multiplier = oddsMap[winner];
            payout = Math.floor(WAGER_PER_BET * multiplier);
            onUpdateBalance(prev => prev + payout);
        }
        
        const profit = payout - totalStake;
        const profitStr = profit >= 0 ? `+${profit}` : `${profit}`;
        
        setGlobalLogs(prev => [
            ...prev, 
            `COMBAT RESOLVED. WINNER: ${mode === 'SOLO' ? `AGENT ${SLOT_LABELS[parseInt(winner)]}` : `TEAM ${winner}`}`,
            hit ? `TARGET ACQUIRED. PAYOUT: ${payout}N (NET: ${profitStr}N)` : `MISSION FAILED. LOSS: -${totalStake}N`
        ]);
    };

    const getAgentPool = (slotIndex: number) => {
        const selectedIds = slots.map(s => s?.id);
        if (mode === 'SOLO' && slots[0] && slotIndex !== 0) {
             return agents.filter(a => a.category === slots[0]!.category && !selectedIds.includes(a.id));
        }
        return agents.filter(a => !selectedIds.includes(a.id));
    };

    // --- RENDERERS ---

    const renderTacticalMode = () => (
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
                            <div key={agent.id} onClick={() => addNode(agent)} className="border border-gray-800 bg-gray-900/50 p-4 rounded hover:border-matrix-green hover:bg-matrix-green/10 cursor-pointer flex items-center gap-4 transition-all">
                                <img src={agent.video_poster} className="w-12 h-12 rounded object-cover" />
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
                                    <motion.div 
                                        initial={{ scale: 0.8, opacity: 0 }} 
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        className={`shrink-0 w-48 h-64 border rounded-xl flex flex-col relative group overflow-hidden transition-all ${chainState.step === i + 1 ? 'border-matrix-green shadow-[0_0_20px_rgba(0,255,65,0.3)]' : 'border-gray-700 bg-gray-900/40'}`}
                                    >
                                        <img src={node.video_poster} className="w-full h-24 object-cover opacity-50 group-hover:opacity-80 transition-opacity" />
                                        <div className="p-3 flex-1 flex flex-col">
                                            <div className="text-xs font-bold text-white mb-1">{node.name}</div>
                                            <div className="text-[9px] text-gray-500 uppercase mb-auto">{node.category}</div>
                                            <div className="flex justify-between items-center mt-2">
                                                <div className="text-[10px] font-mono text-gray-600">STEP {i+1}</div>
                                                {chainState.status !== 'RUNNING' && (
                                                    <button onClick={() => removeNode(i)} className="text-red-500 hover:text-red-400 p-1"><Trash size={12} /></button>
                                                )}
                                            </div>
                                        </div>
                                        {chainState.step === i + 1 && (
                                            <div className="absolute inset-0 bg-matrix-green/10 animate-pulse pointer-events-none"></div>
                                        )}
                                    </motion.div>
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
                            className="flex-1 bg-gray-900/50 border border-gray-800 rounded p-3 text-xs font-mono text-gray-300 resize-none focus:border-matrix-green focus:outline-none"
                        />
                    </div>

                    {/* EXECUTION & LOGS */}
                    <div className="bg-black border border-gray-800 rounded-xl p-4 flex flex-col relative">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-xs font-mono text-matrix-green flex items-center gap-2"><TerminalStream text=">_ EXECUTION_LOG" /></div>
                            {chainState.status === 'RUNNING' && <Activity size={14} className="text-matrix-green animate-spin" />}
                        </div>
                        <div className="flex-1 bg-gray-900/30 rounded p-3 overflow-y-auto custom-scrollbar font-mono text-[10px] text-gray-400 mb-3 border border-gray-800/50">
                            {chainState.logs.length === 0 && <span className="opacity-30">Waiting for execution...</span>}
                            {chainState.logs.map((log, i) => <div key={i} className="mb-1">{log}</div>)}
                            <div ref={logsEndRef} />
                        </div>
                        <button 
                            onClick={executeWorkflow}
                            disabled={workflowNodes.length === 0 || !workflowInput || chainState.status === 'RUNNING'}
                            className="w-full py-3 bg-matrix-green text-black font-display font-black tracking-widest text-xs rounded hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {chainState.status === 'RUNNING' ? 'PROCESSING_CHAIN...' : <><Play size={14} /> EXECUTE_TACTICAL_FLOW</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // --- MAIN RETURN ---
    return (
        <div className="h-full w-full bg-black flex flex-col relative pt-20">
            {/* --- COMPACT HEADER --- */}
            <div className="px-6 pb-4 border-b border-gray-900 bg-black/80 backdrop-blur z-20 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                        {mode === 'TACTICAL' ? <Network className="text-blue-500" /> : <Swords className="text-red-500" />} 
                        {mode === 'TACTICAL' ? 'TACTICAL_OPS' : 'BATTLE_ARENA'}
                    </h2>
                    <div className="text-[10px] font-mono text-gray-500 mt-1 flex items-center gap-2">
                        <span>STATUS: {mode === 'TACTICAL' ? chainState.status : battleState}</span>
                        {mode === 'SOLO' && <span className="text-matrix-green animate-pulse">[ SKIRMISH_Active ]</span>}
                    </div>
                </div>
                
                {/* ICON-BASED MODE SWITCHER (FIXED OVERLAP) */}
                <div className="flex items-center gap-4">
                    {mode === 'SOLO' && (
                        <div className="hidden md:flex items-center gap-1 bg-gray-900 rounded p-1 border border-gray-800 mr-2">
                            <button onClick={() => adjustSoloCount(-1)} disabled={soloSlotCount <= 2 || battleState !== 'IDLE'} className="p-1 hover:bg-gray-800 rounded disabled:opacity-30"><X size={12} /></button>
                            <span className="text-xs font-bold text-white w-4 text-center">{soloSlotCount}</span>
                            <button onClick={() => adjustSoloCount(1)} disabled={soloSlotCount >= 4 || battleState !== 'IDLE'} className="p-1 hover:bg-gray-800 rounded disabled:opacity-30"><Plus size={12} /></button>
                        </div>
                    )}
                    
                    <div className="flex bg-gray-900/80 p-1 rounded-lg border border-gray-700 backdrop-blur gap-1">
                        <button 
                            onClick={() => handleModeSwitch('SOLO')} 
                            className={`p-2 rounded transition-all group relative ${mode === 'SOLO' ? 'bg-matrix-green text-black shadow-[0_0_10px_rgba(0,255,65,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
                            title="SOLO SKIRMISH"
                        >
                            <Swords size={18} />
                        </button>
                        <button 
                            onClick={() => handleModeSwitch('SQUAD')} 
                            className={`p-2 rounded transition-all group relative ${mode === 'SQUAD' ? 'bg-matrix-green text-black shadow-[0_0_10px_rgba(0,255,65,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
                            title="SQUAD WAR"
                        >
                            <Users size={18} />
                        </button>
                        <button 
                            onClick={() => handleModeSwitch('TACTICAL')} 
                            className={`p-2 rounded transition-all group relative ${mode === 'TACTICAL' ? 'bg-matrix-green text-black shadow-[0_0_10px_rgba(0,255,65,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
                            title="TACTICAL WORKFLOW"
                        >
                            <Network size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 relative overflow-hidden bg-black">
                {mode === 'TACTICAL' ? renderTacticalMode() : (
                    <div className="h-full p-6 flex flex-col relative">
                        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
                        
                        {/* VS BADGE */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                            {battleState === 'FINISHED' && winnerOutcome ? (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                                    <div className="bg-black border border-matrix-green px-6 py-3 rounded text-matrix-green font-display font-black text-2xl shadow-[0_0_50px_rgba(0,255,65,0.4)]">
                                        VICTORY: {mode === 'SOLO' ? SLOT_LABELS[parseInt(winnerOutcome)] : winnerOutcome}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    animate={{ scale: battleState === 'FIGHTING' ? [1, 1.2, 1] : 1, opacity: mode === 'SQUAD' ? 1 : 0 }} 
                                    transition={{ duration: 0.5, repeat: battleState === 'FIGHTING' ? Infinity : 0 }}
                                    className="w-16 h-16 bg-black border-2 border-white transform rotate-45 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                >
                                    <span className="font-display font-black text-xl text-white transform -rotate-45">VS</span>
                                </motion.div>
                            )}
                        </div>

                        {mode === 'SOLO' ? (
                            <div className={`grid gap-6 h-full relative z-10 transition-all duration-300 ${soloSlotCount === 2 ? 'grid-cols-2' : soloSlotCount === 3 ? 'grid-cols-3' : 'grid-cols-2 grid-rows-2'}`}>
                                {Array.from({length: soloSlotCount}).map((_, idx) => (
                                    <ArenaSlot 
                                        key={idx}
                                        index={idx} 
                                        agent={slots[idx]} 
                                        label={`COMBATANT [${SLOT_LABELS[idx]}]`} 
                                        keys={keys} 
                                        logs={slotLogs[idx]} 
                                        isProcessing={activeSlotIndex === idx}
                                        onSelect={() => {}} 
                                        onRemove={() => handleSlotUpdate(idx, null)} 
                                        onSaveKey={saveKey}
                                        getAgentPool={() => getAgentPool(idx)} 
                                        onAgentSelect={(a) => handleSlotUpdate(idx, a)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-20 h-full relative z-10">
                                <div className="flex flex-col gap-4 h-full">
                                    <div className="text-center text-xs font-mono text-blue-500 font-bold mb-1">TEAM ALPHA</div>
                                    {[0, 1, 2].map((idx, i) => (
                                        <div key={idx} className="flex-1">
                                            <ArenaSlot index={idx} agent={slots[idx]} label={`ALPHA_${i+1}`} role={SQUAD_ROLES[i]} keys={keys} logs={slotLogs[idx]} isProcessing={activeSlotIndex === idx} onSelect={() => {}} onRemove={() => handleSlotUpdate(idx, null)} onSaveKey={saveKey} getAgentPool={() => getAgentPool(idx)} onAgentSelect={(a) => handleSlotUpdate(idx, a)} />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-4 h-full">
                                    <div className="text-center text-xs font-mono text-red-500 font-bold mb-1">TEAM OMEGA</div>
                                    {[3, 4, 5].map((idx, i) => (
                                        <div key={idx} className="flex-1">
                                            <ArenaSlot index={idx} agent={slots[idx]} label={`OMEGA_${i+1}`} role={SQUAD_ROLES[i]} keys={keys} logs={slotLogs[idx]} isProcessing={activeSlotIndex === idx} onSelect={() => {}} onRemove={() => handleSlotUpdate(idx, null)} onSaveKey={saveKey} getAgentPool={() => getAgentPool(idx)} onAgentSelect={(a) => handleSlotUpdate(idx, a)} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- LOGS OVERLAY --- */}
            <AnimatePresence>
                {battleState !== 'IDLE' && mode !== 'TACTICAL' && (
                    <motion.div initial={{ height: 0 }} animate={{ height: '120px' }} exit={{ height: 0 }} className="bg-black/80 border-t border-gray-800 w-full relative z-30">
                        <div className="h-full p-4 overflow-y-auto custom-scrollbar font-mono text-xs text-matrix-green/80 space-y-1">
                            {globalLogs.map((log, i) => <div key={i} className={`border-l-2 pl-2 ${log.includes('WINNER') ? 'border-yellow-500 text-yellow-500 font-bold' : 'border-matrix-green/30'}`}>{log}</div>)}
                            <div ref={logsEndRef} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- COMMAND BAR (ARENA ONLY) --- */}
            {mode !== 'TACTICAL' && (
                <div className="h-24 bg-gray-900 border-t border-gray-800 p-4 flex items-center justify-between shrink-0 z-40 gap-4">
                    <div className="flex flex-col min-w-[120px]">
                        <span className="text-[10px] text-gray-500 font-mono">BALANCE</span>
                        <span className="text-xl text-yellow-500 font-display font-bold flex items-center gap-2"><Coins size={18} /> {balance}</span>
                    </div>

                    <div className="flex-1 flex justify-center items-center gap-3 overflow-x-auto">
                        {mode === 'SOLO' ? Array.from({length: soloSlotCount}).map((_, i) => {
                            const idxStr = i.toString();
                            return (
                                <button key={i} disabled={battleState !== 'IDLE' || !slots[i]} onClick={() => toggleBet(idxStr)} className={`flex flex-col items-center justify-center w-24 h-14 rounded border transition-all ${selectedOutcomes.includes(idxStr) ? 'bg-matrix-green text-black border-matrix-green shadow-[0_0_15px_rgba(0,255,65,0.4)]' : 'bg-black border-gray-700 text-gray-500 hover:border-gray-500'}`}>
                                    <span className="text-xs font-bold font-display">AGENT {SLOT_LABELS[i]}</span>
                                    <span className="text-[10px] font-mono">x{oddsMap[idxStr] || 1.0}</span>
                                </button>
                            );
                        }) : (
                            <>
                                <button disabled={battleState !== 'IDLE'} onClick={() => toggleBet('ALPHA')} className={`flex flex-col items-center justify-center w-32 h-14 rounded border transition-all ${selectedOutcomes.includes('ALPHA') ? 'bg-blue-600 text-white border-blue-400' : 'bg-black border-blue-900 text-blue-900'}`}><span className="text-xs font-bold font-display">TEAM ALPHA</span><span className="text-[10px] font-mono">x{oddsMap['ALPHA'] || 1.0}</span></button>
                                <button disabled={battleState !== 'IDLE'} onClick={() => toggleBet('OMEGA')} className={`flex flex-col items-center justify-center w-32 h-14 rounded border transition-all ${selectedOutcomes.includes('OMEGA') ? 'bg-red-600 text-white border-red-400' : 'bg-black border-red-900 text-red-900'}`}><span className="text-xs font-bold font-display">TEAM OMEGA</span><span className="text-[10px] font-mono">x{oddsMap['OMEGA'] || 1.0}</span></button>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col items-end gap-1 min-w-[140px]">
                        <div className="text-[10px] text-gray-500 font-mono">STAKE: <span className="text-white">{selectedOutcomes.length * WAGER_PER_BET} N</span></div>
                        {battleState === 'FINISHED' ? (
                            <button onClick={() => { setBattleState('IDLE'); setSelectedOutcomes([]); setSlots(prev => prev.map(() => null)); setGlobalLogs([]); setSlotLogs(Array(6).fill([])); setWinnerOutcome(null); }} className="w-full px-4 py-3 bg-white text-black font-display font-black tracking-widest rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-xs"><RefreshCw size={14} /> RESET</button>
                        ) : (
                            <button onClick={startCombat} disabled={selectedOutcomes.length === 0 || battleState !== 'IDLE'} className="w-full px-4 py-3 bg-matrix-green text-black font-display font-black tracking-widest rounded clip-angle hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(0,255,65,0.3)] flex items-center justify-center gap-2 text-xs"><Crosshair size={14} /> ENGAGE</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
