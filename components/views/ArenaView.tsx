
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Swords, Coins, Crosshair, RefreshCw, Plus, X, Users, Network, Play, Save, ArrowRight, Trash, Activity } from 'lucide-react';
import { Agent, Challenge } from '../../types';
import { CombatEngine } from '../../engine/combat';
import { useUserKeys } from '../../hooks/useUserKeys';
import { useExecutionProxy } from '../../hooks/useExecutionProxy';
import { OpenAIStrategy } from '../../lib/execution/OpenAIStrategy';
import { ArenaSlot } from './ArenaSlot';
import { TacticalModePanel } from './arena/TacticalModePanel';
import { ArenaBattlePanel } from './arena/ArenaBattlePanel';

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
                for (let i = 0; i < soloSlotCount; i++) map[i.toString()] = 1.0;
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

        const activeIndices = mode === 'SOLO' ? Array.from({ length: soloSlotCount }, (_, i) => i) : [0, 1, 2, 3, 4, 5];
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

                const systemPrompt = `You are ${agent.name} in a gladiator battle. Your stats: Reasoning ${agent.metrics?.reasoning || 0}, Speed ${agent.metrics?.speed || 0}. Generate short, high-intensity combat logs describing your attacks and defenses.`;
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
            if (Math.random() > 0.5) handleLogUpdate(Math.floor(Math.random() * 3), 'ALPHA Unit Acting...');
            else handleLogUpdate(Math.floor(Math.random() * 3) + 3, 'OMEGA Unit Acting...');
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

    // Tactical rendering now delegated to TacticalModePanel


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
                        {mode === 'SOLO' && <span className="text-cyan-400 animate-pulse">[ SKIRMISH_Active ]</span>}
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
                            className={`p-2 rounded transition-all group relative ${mode === 'SOLO' ? 'bg-cyan-400 text-black shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
                            title="SOLO SKIRMISH"
                        >
                            <Swords size={18} />
                        </button>
                        <button
                            onClick={() => handleModeSwitch('SQUAD')}
                            className={`p-2 rounded transition-all group relative ${mode === 'SQUAD' ? 'bg-cyan-400 text-black shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
                            title="SQUAD WAR"
                        >
                            <Users size={18} />
                        </button>
                        <button
                            onClick={() => handleModeSwitch('TACTICAL')}
                            className={`p-2 rounded transition-all group relative ${mode === 'TACTICAL' ? 'bg-cyan-400 text-black shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
                            title="TACTICAL WORKFLOW"
                        >
                            <Network size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 relative overflow-hidden bg-black">
                {mode === 'TACTICAL' ? (
                    <TacticalModePanel
                        agents={agents}
                        executeWorkflow={executeWorkflow}
                        chainState={chainState}
                        workflowNodes={workflowNodes}
                        workflowInput={workflowInput}
                        setWorkflowInput={setWorkflowInput}
                        isSelectingForWorkflow={isSelectingForWorkflow}
                        setIsSelectingForWorkflow={setIsSelectingForWorkflow}
                        addNode={addNode}
                        removeNode={removeNode}
                        logsEndRef={logsEndRef}
                    />
                ) : (
                    <ArenaBattlePanel
                        mode={mode}
                        soloSlotCount={soloSlotCount}
                        slots={slots}
                        slotLogs={slotLogs}
                        activeSlotIndex={activeSlotIndex}
                        battleState={battleState}
                        winnerOutcome={winnerOutcome}
                        keys={keys}
                        saveKey={saveKey}
                        handleSlotUpdate={handleSlotUpdate}
                        getAgentPool={getAgentPool}
                    />
                )}
            </div>

            {/* --- LOGS OVERLAY --- */}
            <AnimatePresence>
                {battleState !== 'IDLE' && mode !== 'TACTICAL' && (
                    <m.div initial={{ height: 0 }} animate={{ height: '120px' }} exit={{ height: 0 }} className="bg-black/80 border-t border-gray-800 w-full relative z-30">
                        <div className="h-full p-4 overflow-y-auto custom-scrollbar font-mono text-xs text-cyan-400/80 space-y-1">
                            {globalLogs.map((log, i) => <div key={i} className={`border-l-2 pl-2 ${log.includes('WINNER') ? 'border-yellow-500 text-yellow-500 font-bold' : 'border-cyan-500/30'}`}>{log}</div>)}
                            <div ref={logsEndRef} />
                        </div>
                    </m.div>
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
                        {mode === 'SOLO' ? Array.from({ length: soloSlotCount }).map((_, i) => {
                            const idxStr = i.toString();
                            return (
                                <button key={i} disabled={battleState !== 'IDLE' || !slots[i]} onClick={() => toggleBet(idxStr)} className={`flex flex-col items-center justify-center w-24 h-14 rounded border transition-all ${selectedOutcomes.includes(idxStr) ? 'bg-cyan-400 text-black border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-black border-gray-700 text-gray-500 hover:border-gray-500'}`}>
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
                            <button onClick={startCombat} disabled={selectedOutcomes.length === 0 || battleState !== 'IDLE'} className="w-full px-4 py-3 bg-cyan-400 text-black font-display font-black tracking-widest rounded clip-angle hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center justify-center gap-2 text-xs"><Crosshair size={14} /> ENGAGE</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
