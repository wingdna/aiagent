
import React, { useState, useEffect, useRef } from 'react';
import { Database, Globe, Factory, Mic, Image as ImageIcon, Flame, Pause, Activity, RefreshCw, Key, Wifi, List, Zap, AlertTriangle, RotateCcw, Box, Server } from 'lucide-react';
import { cerebroService } from '../../services/cerebroService';
import { useUserKeys } from '../../hooks/useUserKeys';
import { supabase } from '../../lib/supabase';
import { isPlaceholder } from '../../utils';

const UNITS = [
  { id: 'UNIT_01', label: 'UNIT_01: HARVEST', icon: Globe, desc: 'URL EXTRACTION' },
  { id: 'UNIT_02', label: 'UNIT_02: ALCHEMIZER', icon: Factory, desc: 'NEURAL DIGESTION' },
  { id: 'UNIT_03', label: 'UNIT_03: PERSONA_FORGE', icon: ImageIcon, desc: 'ASSET GENERATION' },
  { id: 'UNIT_04', label: 'UNIT_04: VOICE_ENGINE', icon: Mic, desc: 'VOICE SYNTHESIS' },
];

export const CerebroEngine: React.FC = () => {
    const [activeUnit, setActiveUnit] = useState<string>('UNIT_01');
    const [sourceUrl, setSourceUrl] = useState('https://github.com/steven-tey/dub'); 
    const [logs, setLogs] = useState<string[]>([]);
    
    const [isHarvesting, setIsHarvesting] = useState(false);
    const [isDigesting, setIsDigesting] = useState(false);
    const [isForging, setIsForging] = useState(false);
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    
    const [cooldown, setCooldown] = useState(0); 
    const [batchSize, setBatchSize] = useState(5);
    const [stats, setStats] = useState({
        pendingSeeds: 0,
        completedAgents: 0,
        failedNetwork: 0,
        failedContent: 0
    });
    
    const logEndRef = useRef<HTMLDivElement>(null);
    const { keys } = useUserKeys();

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setInterval(() => setCooldown(prev => Math.max(0, prev - 1)), 1000);
            return () => clearInterval(timer);
        }
    }, [cooldown]);

    const fetchStats = async () => {
        if (!supabase) return;
        
        // PENDING
        const { count: pending } = await supabase.from('seed_queue').select('id', { head: true, count: 'exact' }).eq('status', 'PENDING');
        // COMPLETED (Agents Live)
        const { count: live } = await supabase.from('agents').select('id', { head: true, count: 'exact' });
        // FAILED (Network/API)
        const { count: network } = await supabase.from('seed_queue').select('id', { head: true, count: 'exact' }).eq('status', 'FAILED');
        // ERROR_CONTENT (URL Alive but unusable)
        const { count: content } = await supabase.from('seed_queue').select('id', { head: true, count: 'exact' }).eq('status', 'ERROR_CONTENT');

        setStats({ 
            pendingSeeds: pending || 0, 
            completedAgents: live || 0, 
            failedNetwork: network || 0,
            failedContent: content || 0
        });
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    const addLog = (msg: string) => setLogs(prev => [...prev.slice(-99), `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const handleHarvest = async (url: string) => {
        if (isHarvesting || !url) return;
        setIsHarvesting(true);
        addLog(`>_ UNIT_01: HARVESTING SIGNAL FROM ${url}`);
        try {
            await cerebroService.harvest(url, addLog);
            await fetchStats();
        } finally {
            setIsHarvesting(false);
        }
    };

    const toggleDigest = () => setIsDigesting(!isDigesting);

    const handleResetDeadlock = async () => {
        if (isResetting) return;
        setIsResetting(true);
        try {
            await cerebroService.resetDeadlock(addLog);
            await fetchStats();
        } finally {
            setIsResetting(false);
        }
    };

    useEffect(() => {
        let timer: any;
        const run = async () => {
            if (!isDigesting || cooldown > 0) return;
            const apiKey = keys.google || ""; 
            if (!apiKey) {
                setIsDigesting(false);
                addLog('>_ MISSING_GOOGLE_KEY');
                return;
            }
            try {
                await cerebroService.digestBatch(apiKey, addLog, batchSize);
                await fetchStats();
            } catch (e: any) {
                if (e.message?.includes("429")) {
                    setIsDigesting(false);
                    setCooldown(60);
                }
            }
        };
        if (isDigesting) {
            run();
            timer = setInterval(run, 10000);
        }
        return () => clearInterval(timer);
    }, [isDigesting, cooldown, batchSize, keys.google]);

    return (
        <div className="flex flex-col h-full bg-black/50 rounded-xl border border-cyan-500/20 overflow-hidden">
            
            {/* Header Stats Bar - V27.6 Refined */}
            <div className="flex border-b border-gray-800 bg-black/60 font-mono text-[9px] text-gray-400">
                <div className="flex-1 p-2 border-r border-gray-800 flex flex-col items-center justify-center">
                    <span>SEEDS_PENDING</span>
                    <span className="text-sm font-bold text-yellow-500">{stats.pendingSeeds}</span>
                </div>
                <div className="flex-1 p-2 border-r border-gray-800 flex flex-col items-center justify-center">
                    <span>AGENTS_LIVE</span>
                    <span className="text-sm font-bold text-cyan-400">{stats.completedAgents}</span>
                </div>
                <div className="flex-1 p-2 border-r border-gray-800 flex flex-col items-center justify-center">
                    <span className="text-red-500">FAILED_NETWORK</span>
                    <span className="text-sm font-bold text-red-500">{stats.failedNetwork}</span>
                </div>
                <div className="flex-1 p-2 flex flex-col items-center justify-center">
                    <span className="text-orange-500">FAILED_CONTENT</span>
                    <span className="text-sm font-bold text-orange-500">{stats.failedContent}</span>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-cyan-500/20 bg-black/40">
                {UNITS.map(u => (
                    <button key={u.id} onClick={() => setActiveUnit(u.id)} className={`flex-1 p-3 text-[10px] font-mono font-bold flex flex-col items-center justify-center gap-1 transition-all border-b-2 ${activeUnit === u.id ? 'border-cyan-400 bg-cyan-500/10 text-cyan-400' : 'border-transparent text-gray-500 hover:text-white'}`}>
                        <u.icon size={16} />
                        <span>{u.label.split(': ')[1]}</span>
                    </button>
                ))}
            </div>

            {/* Main Stage */}
            <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden relative">
                {activeUnit === 'UNIT_01' && (
                    <div className="flex flex-col gap-4 h-full">
                        <textarea value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className="flex-1 bg-black border border-gray-700 rounded p-3 text-xs font-mono text-white focus:border-cyan-400 outline-none resize-none" placeholder="Enter source URL (GitHub README, News feed...)" />
                        <button onClick={() => handleHarvest(sourceUrl)} disabled={isHarvesting} className="p-4 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-400 hover:text-black font-bold font-mono text-xs rounded transition-all flex items-center justify-center gap-2">
                            {isHarvesting ? <RefreshCw className="animate-spin" /> : <Zap />} INITIALIZE_HARVEST
                        </button>
                    </div>
                )}

                {activeUnit === 'UNIT_02' && (
                    <div className="flex flex-col gap-6 h-full justify-center items-center">
                        <div className="flex gap-4 items-center">
                            <div className="flex flex-col w-24">
                                <label className="text-[9px] font-mono text-gray-500 mb-1">BATCH_SIZE</label>
                                <input type="number" value={batchSize} onChange={(e) => setBatchSize(parseInt(e.target.value) || 1)} className="bg-black border border-gray-700 rounded p-2 text-white font-mono text-xs text-center" />
                            </div>
                            <button onClick={toggleDigest} disabled={cooldown > 0} className={`h-16 px-10 font-bold font-display text-sm tracking-widest rounded border transition-all ${isDigesting ? 'bg-red-500/20 text-red-500 border-red-500' : 'bg-cyan-500/20 text-cyan-400 border-cyan-400'}`}>
                                {cooldown > 0 ? `COOLING: ${cooldown}s` : (isDigesting ? 'STOP_ALCHEMY' : 'START_ALCHEMY')}
                            </button>
                        </div>
                        <button onClick={handleResetDeadlock} className="text-[10px] font-mono text-red-400 flex items-center gap-2 hover:text-red-300">
                            <RotateCcw size={12} /> FORCE_RESET_QUEUE (CLEAR_STUCK)
                        </button>
                    </div>
                )}

                {/* UNIT 03 & 04 (Omitted for brevity, assuming standard logic) */}
                {activeUnit === 'UNIT_03' && <div className="text-center font-mono text-xs text-gray-500 mt-10">FORGE_MODULE: STANDBY</div>}
                {activeUnit === 'UNIT_04' && <div className="text-center font-mono text-xs text-gray-500 mt-10">VOICE_MODULE: STANDBY</div>}

                {/* Unified Terminal Output */}
                <div className="h-32 bg-black border border-gray-800 rounded p-2 font-mono text-[9px] text-gray-300 overflow-y-auto custom-scrollbar relative flex flex-col mt-auto">
                    <div className="absolute top-2 right-2 text-gray-700 opacity-50 flex items-center gap-2"><Server size={14} /> TERMINAL_OUT</div>
                    {logs.map((log, i) => (
                        <div key={i} className={`mb-1 break-words ${log.includes("FATAL") ? "text-red-400" : log.includes("SUCCESS") ? "text-cyan-400" : ""}`}>
                            {log}
                        </div>
                    ))}
                    <div ref={logEndRef} />
                </div>
            </div>
        </div>
    );
};
