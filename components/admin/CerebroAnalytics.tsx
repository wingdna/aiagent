
import React, { useState } from 'react';
import { BarChart, Globe, Save, RefreshCw, Activity, Zap } from 'lucide-react';
import { analyticsEngine } from '../../services/AnalyticsEngine';
import { Agent } from '../../types';
import { dataService } from '../../services/dataService';

export const CerebroAnalytics: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const addLog = (msg: string) => setLogs(prev => [...prev.slice(-20), `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const runSync = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            // Need all agents for this
            const agents = await dataService.getAgents(0, 1000); // Get a large batch
            await analyticsEngine.syncExternalData(agents, addLog);
        } catch (e: any) {
            addLog(`ERROR: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const runCompute = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const agents = await dataService.getAgents(0, 1000);
            await analyticsEngine.computeNRIScores(agents, addLog);
        } catch (e: any) {
            addLog(`ERROR: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const runSnapshot = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        addLog("[WORKER] DISPATCHING REPORT REQUEST...");
        
        try {
            // V32.0: Trigger Cloudflare Worker Endpoint
            const WORKER_URL = 'https://youagent.top/api/dispatch-report';
            
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportType: 'WEEKLY' })
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Worker Error: ${text}`);
            }

            const result = await response.json() as any;
            
            if (result.success) {
                addLog(`[SUCCESS] SNAPSHOT ID: ${result.snapshot_id}`);
                addLog(`[EMAIL] STATUS: ${result.email}`);
                addLog(`[BROADCAST] STATUS: ${result.broadcast}`);
            } else {
                throw new Error(result.error || 'Unknown Worker Error');
            }

        } catch (e: any) {
            addLog(`ERROR: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/40 p-6 gap-6">
            {/* V31.1: CHRONOS TRIGGER STATUS */}
            <div className="flex items-center justify-between bg-gray-900/50 border border-gray-800 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-3 h-3 bg-matrix-green rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 bg-matrix-green rounded-full animate-ping opacity-50"></div>
                    </div>
                    <span className="text-xs font-mono text-white font-bold tracking-widest flex items-center gap-2">
                        AUTO_PUBLISH: <span className="text-matrix-green">ACTIVE</span>
                    </span>
                </div>
                <div className="text-[10px] font-mono text-gray-500 flex items-center gap-2">
                    <Zap size={12} className="text-yellow-500" />
                    NEXT_RUN: MON_09:00_UTC
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* CARD 1: CRAWL */}
                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl flex flex-col items-center text-center hover:border-blue-500 transition-colors">
                    <div className="p-4 rounded-full bg-blue-900/20 text-blue-500 mb-4">
                        <Globe size={32} />
                    </div>
                    <h3 className="text-white font-display font-bold text-lg mb-2">EXTERNAL CENSUS</h3>
                    <p className="text-gray-500 text-xs font-mono mb-6">
                        Triangulate signals from GitHub Stars and Web Mentions via Jina Proxy.
                    </p>
                    <button 
                        onClick={runSync}
                        disabled={isProcessing}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs rounded transition-all disabled:opacity-50"
                    >
                        {isProcessing ? 'SCANNING...' : 'SYNC_EXTERNAL_DATA'}
                    </button>
                </div>

                {/* CARD 2: COMPUTE */}
                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl flex flex-col items-center text-center hover:border-amber-500 transition-colors">
                    <div className="p-4 rounded-full bg-amber-900/20 text-amber-500 mb-4">
                        <Activity size={32} />
                    </div>
                    <h3 className="text-white font-display font-bold text-lg mb-2">NRI ALGORITHM</h3>
                    <p className="text-gray-500 text-xs font-mono mb-6">
                        Compute Neural Reputation Index based on ELO, Stars, and Hype.
                    </p>
                    <button 
                        onClick={runCompute}
                        disabled={isProcessing}
                        className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-xs rounded transition-all disabled:opacity-50"
                    >
                        {isProcessing ? 'CALCULATING...' : 'RE-CALC SCORES'}
                    </button>
                </div>

                {/* CARD 3: SNAPSHOT */}
                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl flex flex-col items-center text-center hover:border-matrix-green transition-colors">
                    <div className="p-4 rounded-full bg-green-900/20 text-matrix-green mb-4">
                        <Save size={32} />
                    </div>
                    <h3 className="text-white font-display font-bold text-lg mb-2">PUBLISH LEADERBOARD</h3>
                    <p className="text-gray-500 text-xs font-mono mb-6">
                        Auto-generate report via Worker, broadcast to Lounge, and email Admin.
                    </p>
                    <button 
                        onClick={runSnapshot}
                        disabled={isProcessing}
                        className="w-full py-3 bg-matrix-green hover:bg-green-400 text-black font-mono font-bold text-xs rounded transition-all disabled:opacity-50"
                    >
                        {isProcessing ? 'DISPATCHING...' : 'PUBLISH_SNAPSHOT'}
                    </button>
                </div>
            </div>

            {/* TERMINAL OUTPUT */}
            <div className="flex-1 bg-black border border-gray-800 rounded-xl p-4 font-mono text-xs overflow-y-auto custom-scrollbar">
                <div className="text-gray-500 mb-2 border-b border-gray-800 pb-2">ANALYTICS_ENGINE_LOGS</div>
                {logs.map((log, i) => (
                    <div key={i} className="mb-1 text-gray-300">{log}</div>
                ))}
                {isProcessing && <div className="text-matrix-green animate-pulse">_PROCESSING_REQUEST...</div>}
            </div>
        </div>
    );
};
