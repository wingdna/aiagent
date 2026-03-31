import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Agent, UserKeys } from '../../../types';
import { ArenaSlot } from '../ArenaSlot';

const SQUAD_ROLES = ['VANGUARD', 'TACTICIAN', 'ANCHOR'];
const SLOT_LABELS = ['A', 'B', 'C', 'D'];

interface ArenaBattlePanelProps {
    mode: 'SOLO' | 'SQUAD';
    soloSlotCount: number;
    slots: (Agent | null)[];
    slotLogs: string[][];
    activeSlotIndex: number | null;
    battleState: 'IDLE' | 'FIGHTING' | 'FINISHED';
    winnerOutcome: string | null;
    keys: UserKeys;
    saveKey: (provider: keyof UserKeys, key: string) => void;
    handleSlotUpdate: (index: number, agent: Agent | null) => void;
    getAgentPool: (slotIndex: number) => Agent[];
}

export const ArenaBattlePanel: React.FC<ArenaBattlePanelProps> = ({
    mode,
    soloSlotCount,
    slots,
    slotLogs,
    activeSlotIndex,
    battleState,
    winnerOutcome,
    keys,
    saveKey,
    handleSlotUpdate,
    getAgentPool
}) => {
    return (
        <div className="h-full p-6 flex flex-col relative">
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

            {/* VS BADGE */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                {battleState === 'FINISHED' && winnerOutcome ? (
                    <m.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                        <div className="bg-black border border-cyan-400 px-6 py-3 rounded text-cyan-400 font-display font-black text-2xl shadow-[0_0_50px_rgba(34,211,238,0.4)]">
                            VICTORY: {mode === 'SOLO' ? SLOT_LABELS[parseInt(winnerOutcome)] : winnerOutcome}
                        </div>
                    </m.div>
                ) : (
                    <m.div
                        animate={{ scale: battleState === 'FIGHTING' ? [1, 1.2, 1] : 1, opacity: mode === 'SQUAD' ? 1 : 0 }}
                        transition={{ duration: 0.5, repeat: battleState === 'FIGHTING' ? Infinity : 0 }}
                        className="w-16 h-16 bg-black border-2 border-white transform rotate-45 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    >
                        <span className="font-display font-black text-xl text-white transform -rotate-45">VS</span>
                    </m.div>
                )}
            </div>

            {mode === 'SOLO' ? (
                <div className={`grid gap-4 md:gap-6 h-auto md:h-full relative z-10 transition-all duration-300 ${soloSlotCount === 2 ? 'grid-cols-1 md:grid-cols-2' : soloSlotCount === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 md:grid-rows-2'}`}>
                    {Array.from({ length: soloSlotCount }).map((_, idx) => (
                        <ArenaSlot
                            key={idx}
                            index={idx}
                            agent={slots[idx]}
                            label={`COMBATANT [${SLOT_LABELS[idx]}]`}
                            keys={keys}
                            logs={slotLogs[idx]}
                            isProcessing={activeSlotIndex === idx}
                            onSelect={() => { }}
                            onRemove={() => handleSlotUpdate(idx, null)}
                            onSaveKey={saveKey}
                            getAgentPool={() => getAgentPool(idx)}
                            onAgentSelect={(a) => handleSlotUpdate(idx, a)}
                        />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20 h-auto md:h-full relative z-10">
                    <div className="flex flex-col gap-4 h-full">
                        <div className="text-center text-xs font-mono text-blue-500 font-bold mb-1">TEAM ALPHA</div>
                        {[0, 1, 2].map((idx, i) => (
                            <div key={idx} className="flex-1">
                                <ArenaSlot index={idx} agent={slots[idx]} label={`ALPHA_${i + 1}`} role={SQUAD_ROLES[i]} keys={keys} logs={slotLogs[idx]} isProcessing={activeSlotIndex === idx} onSelect={() => { }} onRemove={() => handleSlotUpdate(idx, null)} onSaveKey={saveKey} getAgentPool={() => getAgentPool(idx)} onAgentSelect={(a) => handleSlotUpdate(idx, a)} />
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col gap-4 h-full">
                        <div className="text-center text-xs font-mono text-red-500 font-bold mb-1">TEAM OMEGA</div>
                        {[3, 4, 5].map((idx, i) => (
                            <div key={idx} className="flex-1">
                                <ArenaSlot index={idx} agent={slots[idx]} label={`OMEGA_${i + 1}`} role={SQUAD_ROLES[i]} keys={keys} logs={slotLogs[idx]} isProcessing={activeSlotIndex === idx} onSelect={() => { }} onRemove={() => handleSlotUpdate(idx, null)} onSaveKey={saveKey} getAgentPool={() => getAgentPool(idx)} onAgentSelect={(a) => handleSlotUpdate(idx, a)} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
