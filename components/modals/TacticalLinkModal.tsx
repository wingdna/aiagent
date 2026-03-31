import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, Zap, Copy, Check, Terminal } from 'lucide-react';
import { AgentRegistryEntity } from '../../app/types/registry';
import { Agent } from '../../types';

interface TacticalLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    agent: AgentRegistryEntity;
    data?: any;
}

const TacticalLinkModal: React.FC<TacticalLinkModalProps> = ({ isOpen, onClose, agent }) => {
    const [copied, setCopied] = useState(false);
    const [executionCodeSnippet, setExecutionCodeSnippet] = useState('');
    const [displayedCode, setDisplayedCode] = useState('');

    useEffect(() => {
        if (!agent) return;

        const pricing = agent.pricing?.details as any;
        const tagsStr = (agent.tags || []).join(' ').toLowerCase();
        const isOSS = agent.pricing?.isOSS || pricing?.type === 'Open Source' || pricing?.type === 'open_weights' || tagsStr.includes('open source') || tagsStr.includes('apache 2.0') || tagsStr.includes('mit');
        const isMCP = tagsStr.includes('mcp') || (agent.specs && JSON.stringify(agent.specs).toLowerCase().includes('mcp'));
        
        const apiUrl = agent.connectivity?.api_url;

        const baseSnippet = `# [1] Fetch Neural Intel from YouAgent API
curl -X GET "https://youagent.top/api/agents?slug=${agent.slug || agent.id}" \\
  -H "Accept: application/json"

`;

        let snippet = '';

        if (apiUrl) {
            snippet = `# [2] Initialize Neural Link via API
curl -X POST "${apiUrl}" \\
  -H "Authorization: Bearer $YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${agent.api_model_name || agent.slug || 'default-model'}",
    "messages": [
      {
        "role": "user",
        "content": "Initialize neural link with ${agent.name || 'Agent'}."
      }
    ]
  }'`;
        } else if (isMCP) {
            snippet = `# [2] Configure MCP Server
cat << 'EOF' > mcp_config.json
{
  "mcpServers": {
    "${agent.slug || 'agent-server'}": {
      "command": "npx",
      "args": [
        "-y",
        "@${agent.vendor_slug || 'vendor'}/${agent.slug || 'agent'}"
      ]
    }
  }
}
EOF`;
        } else if (isOSS) {
            snippet = `# [2] Clone and Initialize Open Source Entity
git clone https://github.com/${agent.vendor_slug || 'vendor'}/${agent.slug || 'agent'}.git
cd ${agent.slug || 'agent'}
npm install
npm run start`;
        } else {
            const officialUrl = agent.official_url || agent.connectivity?.try_url || `https://youagent.top/agent/${agent.slug || agent.id}`;
            snippet = `# [2] Target Entity lacks direct CLI/API access.
# Establishing neural link via default browser...
$ open ${officialUrl}`;
        }

        setExecutionCodeSnippet(baseSnippet + snippet);
    }, [agent]);

    useEffect(() => {
        if (!isOpen || !executionCodeSnippet) {
            setDisplayedCode('');
            return;
        }

        let i = 0;
        setDisplayedCode('');
        
        const intervalId = setInterval(() => {
            setDisplayedCode(executionCodeSnippet.substring(0, i + 1));
            i += 5; // Type 5 characters at a time for a fast, smooth effect
            if (i >= executionCodeSnippet.length) {
                setDisplayedCode(executionCodeSnippet);
                clearInterval(intervalId);
            }
        }, 10);

        return () => clearInterval(intervalId);
    }, [isOpen, executionCodeSnippet]);

    const handleCopy = () => {
        navigator.clipboard.writeText(executionCodeSnippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <m.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div 
                            className="bg-[#0a0a0a] border border-cyan-500/30 w-full max-w-2xl rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.2)] pointer-events-auto relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-gradient-to-r from-cyan-950/30 to-transparent">
                                <div>
                                    <h3 className="text-xl font-display text-white mb-1 flex items-center gap-2">
                                        <Terminal size={18} className="text-cyan-400" />
                                        EXECUTION_TERMINAL
                                    </h3>
                                    <p className="text-xs font-mono text-cyan-500/70 uppercase tracking-wider">
                                        TARGET_ENTITY: {(agent.name || 'Unknown').toUpperCase()}
                                    </p>
                                </div>
                                <button 
                                    onClick={onClose}
                                    className="text-gray-500 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <div className="w-full bg-[#000000] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                                    {/* Terminal Header */}
                                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                        </div>
                                        <span className="text-[10px] text-white/40 font-mono">bash - agent-invoke</span>
                                        <button onClick={handleCopy} className="text-cyan-400 hover:text-white transition-colors flex items-center gap-1 group relative">
                                            {copied ? <Check size={14}/> : <Copy size={14} className="group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"/>}
                                            {copied && <span className="absolute -top-6 right-0 text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-2 py-1 rounded border border-emerald-500/30">COPIED!</span>}
                                        </button>
                                    </div>
                                    {/* Terminal Body */}
                                    <div className="p-4 overflow-x-auto text-emerald-400/90 text-xs leading-relaxed font-mono whitespace-pre-wrap min-h-[150px]">
                                        {displayedCode}
                                        {displayedCode.length < executionCodeSnippet.length && (
                                            <span className="inline-block w-2 h-4 bg-emerald-400/80 ml-1 animate-pulse align-middle"></span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-black/40 border-t border-white/5 flex flex-col gap-4">
                                {(agent.official_url || agent.connectivity?.try_url) && (
                                    <a 
                                        href={agent.official_url || agent.connectivity?.try_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/50 rounded text-cyan-400 font-mono text-[10px] font-bold text-center transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] uppercase tracking-wider block"
                                    >
                                        LAUNCH_TERMINAL
                                    </a>
                                )}
                                <div className="flex justify-between items-center text-[10px] font-mono text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Zap size={12} className="text-cyan-500/50" />
                                        <span>NEURAL_LINK_READY</span>
                                    </div>
                                    <span>AWAITING_EXECUTION</span>
                                </div>
                            </div>
                        </div>
                    </m.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default TacticalLinkModal;
