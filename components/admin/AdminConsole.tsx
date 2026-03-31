
import React, { useState, useRef, useEffect } from 'react';
import { m } from 'framer-motion';
// Added Activity to imports
import { AlertTriangle, X, Database, RefreshCw, Key, ShieldCheck, Check, Wifi, BrainCircuit, BarChart2, Hammer, Code, Info, Terminal as TerminalIcon, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../../config';
import { AGENTS_DB } from '../../agents';
import { CerebroEngine } from './CerebroEngine';
import { CerebroAnalytics } from './CerebroAnalytics';

export const AdminConsole: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [view, setView] = useState<'CONSOLE' | 'CEREBRO' | 'ANALYTICS' | 'SCHEMA_FORGE'>('CONSOLE');
    const [logs, setLogs] = useState<string[]>(["INITIALIZING GHOST PROTOCOL...", "BYPASSING SECURITY LAYER 7..."]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [tempServiceKey, setTempServiceKey] = useState('');
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `> ${msg}`]);

    const handleSync = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        addLog("ESTABLISHING UPLINK TO SUPABASE...");
        if (!supabase) {
            addLog("FATAL ERROR: DATABASE UPLINK OFFLINE.");
            setIsSyncing(false);
            return;
        }
        let successCount = 0;
        for (const agent of AGENTS_DB) {
            addLog(`SYNCING: [${agent.id}]...`);
            const { error } = await supabase.from('agents').upsert(agent, { onConflict: 'id' });
            if (error) addLog(`ERROR: ${error.message}`);
            else successCount++;
        }
        addLog(`--- SYNC COMPLETE: ${successCount} SUCCESS ---`);
        setIsSyncing(false);
    };

    const runSchemaUpdate = async () => {
        setIsSyncing(true);
        addLog("INITIATING SCHEMA_FORGE PROTOCOL...");
        
        // Use service role key if provided, else fall back to default client (ANON_KEY) as requested
        const targetClient = tempServiceKey 
            ? createClient(CONFIG.SUPABASE_URL, tempServiceKey) 
            : supabase;

        if (!targetClient) {
            addLog("FATAL ERROR: NO ACTIVE CLIENT FOUND.");
            setIsSyncing(false);
            return;
        }

        if (!tempServiceKey) {
            addLog("WARNING: NO SERVICE_ROLE_KEY PROVIDED. ATTEMPTING VIA ANON_KEY...");
        } else {
            addLog("ELEVATED AUTH DETECTED. PROCEEDING WITH SERVICE_ROLE...");
        }

        try {
            const sql = `
                -- 1. Create Enums
                DO $$ BEGIN
                    CREATE TYPE intel_type AS ENUM ('news', 'tutorial');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;

                DO $$ BEGIN
                    CREATE TYPE difficulty_level AS ENUM ('novice', 'adept', 'elite');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;

                -- 2. Create Table
                CREATE TABLE IF NOT EXISTS agent_intel (
                  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                  agent_id_link TEXT REFERENCES agents(id) ON DELETE CASCADE,
                  type intel_type NOT NULL,
                  title TEXT NOT NULL,
                  summary TEXT,
                  original_url TEXT,
                  source_domain TEXT,
                  published_at TIMESTAMPTZ DEFAULT now(),
                  tags TEXT[] DEFAULT '{}',
                  difficulty_level difficulty_level DEFAULT 'novice'
                );

                -- 3. Enable RLS
                ALTER TABLE agent_intel ENABLE ROW LEVEL SECURITY;

                -- 4. Create Access Policies (Public Read)
                DO $$ BEGIN
                    CREATE POLICY "Enable read access for all users" ON "public"."agent_intel"
                    AS PERMISSIVE FOR SELECT TO public USING (true);
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `;

            addLog("TRANSMITTING DDL TO CORE...");
            
            // Attempting RPC execution. 
            // Note: Postgres DDL usually requires higher privilege than ANON_KEY.
            const { error } = await targetClient.rpc('exec_sql', { sql_query: sql });

            if (error) {
                addLog(`UPLINK REJECTED: ${error.message}`);
                if (error.message.includes("does not exist")) {
                    addLog("CRITICAL: RPC 'exec_sql' NOT FOUND ON DATABASE.");
                }
                addLog("STATUS: FORGE_FAILED. ACCESS DENIED OR MISSING RPC.");
            } else {
                addLog("SUCCESS: agent_intel TABLE CONSTRUCTED.");
                addLog("RLS POLICIES APPLIED.");
            }
        } catch (e: any) {
            addLog(`CRITICAL CRASH: ${e.message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <m.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
        >
            <div className={`w-full max-w-6xl bg-[#1a0505] border border-red-900/50 rounded-xl overflow-hidden shadow-[0_0_100px_rgba(255,0,0,0.1)] flex flex-col h-[85vh]`}>
                <div className="bg-red-950/20 border-b border-red-900/30 p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="text-red-500 animate-pulse" size={20} />
                            <h2 className="font-display font-bold text-red-500 tracking-widest text-lg">GHOST_PROTOCOL // ADMIN</h2>
                        </div>
                        <div className="flex bg-black/40 rounded p-1 border border-red-900/20 gap-1">
                            <button onClick={() => setView('CONSOLE')} className={`px-4 py-1 text-xs font-mono font-bold rounded ${view === 'CONSOLE' ? 'bg-red-900/40 text-red-300' : 'text-gray-500'}`}>SYSTEM_LOGS</button>
                            <button onClick={() => setView('CEREBRO')} className={`px-4 py-1 text-xs font-mono font-bold rounded ${view === 'CEREBRO' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500'}`}>CEREBRO_ENGINE</button>
                            <button onClick={() => setView('SCHEMA_FORGE')} className={`px-4 py-1 text-xs font-mono font-bold rounded flex items-center gap-2 ${view === 'SCHEMA_FORGE' ? 'bg-amber-900/40 text-amber-400' : 'text-gray-500'}`}><Hammer size={12}/> SCHEMA_FORGE</button>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-red-500/20 rounded text-red-500 transition-colors"><X size={20} /></button>
                </div>
                
                <div className="flex-1 flex overflow-hidden">
                    {view === 'SCHEMA_FORGE' ? (
                        <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                                <div className="space-y-4 flex flex-col">
                                    <div className="bg-red-900/10 border border-red-500/50 p-4 rounded-lg">
                                        <h3 className="text-amber-500 font-display text-sm mb-2 flex items-center gap-2"><Key size={16}/> ELEVATED_AUTH_REQUIRED</h3>
                                        <p className="text-[10px] text-gray-400 font-mono mb-4 leading-relaxed">
                                            Creating tables usually requires the <span className="text-white">service_role_key</span>. 
                                            If you don't have it, we will try with the <span className="text-cyan-400">ANON_KEY</span> as requested.
                                        </p>
                                        <input 
                                            type="password"
                                            value={tempServiceKey}
                                            onChange={(e) => setTempServiceKey(e.target.value)}
                                            placeholder="PASTE_SERVICE_ROLE_KEY_HERE (OPTIONAL)"
                                            className="w-full bg-black border border-red-900 rounded p-3 text-xs text-red-500 font-mono focus:outline-none focus:border-red-500 placeholder:text-red-950"
                                        />
                                    </div>

                                    <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-lg flex-1 overflow-hidden flex flex-col">
                                        <h3 className="text-white font-display text-sm mb-2 flex items-center gap-2"><Code size={16}/> TABLE: agent_intel</h3>
                                        <div className="bg-black/80 rounded p-3 font-mono text-[9px] text-gray-500 overflow-y-auto flex-1 custom-scrollbar">
                                            <pre>{`CREATE TABLE agent_intel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id_link TEXT REFERENCES agents(id),
  type intel_type,
  title TEXT,
  summary TEXT,
  original_url TEXT,
  source_domain TEXT,
  published_at TIMESTAMPTZ,
  tags TEXT[],
  difficulty_level difficulty_level
);`}</pre>
                                        </div>
                                        <button 
                                            onClick={runSchemaUpdate}
                                            disabled={isSyncing}
                                            className={`mt-4 w-full py-4 font-black font-display tracking-widest text-xs rounded transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2 ${
                                                isSyncing ? 'bg-red-900/50 text-red-700 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-black active:scale-95'
                                            }`}
                                        >
                                            {isSyncing ? <RefreshCw className="animate-spin" size={14} /> : <TerminalIcon size={14} />}
                                            {isSyncing ? "EXECUTING_DDL..." : "BUILD_INTEL_TABLE"}
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-black border border-red-900/20 rounded-xl p-4 font-mono text-xs overflow-y-auto custom-scrollbar flex flex-col">
                                    <div className="text-red-900/50 mb-2 border-b border-red-900/20 pb-2 flex justify-between items-center">
                                        <span>CONSTRUCT_LOGS</span>
                                        {isSyncing && <Activity size={10} className="animate-pulse text-red-500" />}
                                    </div>
                                    <div className="flex-1">
                                        {logs.map((log, i) => (
                                            <div key={i} className={`mb-1 ${
                                                log.includes("SUCCESS") ? "text-cyan-400" : 
                                                log.includes("ERROR") || log.includes("REJECTED") || log.includes("FAILED") ? "text-red-500" : 
                                                log.includes("WARNING") ? "text-yellow-500" :
                                                "text-amber-500/70"
                                            }`}>
                                                {log}
                                            </div>
                                        ))}
                                        <div ref={logsEndRef} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : view === 'CONSOLE' ? (
                        <div className="flex-1 flex overflow-hidden">
                             <div className="w-64 bg-black/40 border-r border-red-900/30 p-4 flex flex-col gap-3 shrink-0 overflow-y-auto custom-scrollbar">
                                <button onClick={handleSync} disabled={isSyncing} className={`p-4 border border-red-800/50 bg-red-900/10 hover:bg-red-900/30 text-red-400 font-mono text-xs text-left transition-all group ${isSyncing ? 'opacity-50' : ''}`}>
                                    <div className="flex items-center gap-2 mb-2 font-bold group-hover:text-red-300"><Database size={16} /> SYNC_TO_SUPABASE</div>
                                    <div className="opacity-60 text-[10px]">Batch upsert local AGENTS_DB.</div>
                                </button>
                                <div className="mt-auto pt-4 border-t border-red-900/30">
                                    <button onClick={onClose} className="w-full py-3 bg-red-600 hover:bg-red-500 text-black font-bold font-display tracking-widest text-xs rounded transition-colors">SYSTEM_EXIT</button>
                                </div>
                            </div>
                            <div className="flex-1 bg-black p-6 font-mono text-xs overflow-y-auto custom-scrollbar relative">
                                <div className="absolute inset-0 pointer-events-none bg-[url('https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif')] opacity-[0.02]"></div>
                                {logs.map((log, i) => (
                                    <div key={i} className={`mb-1 ${log.includes("ERROR") ? "text-red-500" : "text-amber-500/80"}`}>{log}</div>
                                ))}
                                <div ref={logsEndRef}></div>
                                {isSyncing && <div className="mt-2 text-amber-500 animate-pulse">_</div>}
                            </div>
                        </div>
                    ) : view === 'CEREBRO' ? (
                        <div className="flex-1 p-4 bg-black/20"><CerebroEngine /></div>
                    ) : (
                        <div className="flex-1 overflow-hidden"><CerebroAnalytics /></div>
                    )}
                </div>
            </div>
        </m.div>
    );
};
