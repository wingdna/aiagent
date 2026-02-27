
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Activity, Zap, Send, Shield, ThumbsUp, Star, Key, Globe } from 'lucide-react';
import { Agent, UserProfile } from '../../types';
import { getCategoryColor } from '../../utils';
import { PersonaLayer } from '../shared/PersonaLayer';
import { useUserKeys } from '../../hooks/useUserKeys';
import { useExecutionProxy } from '../../src/hooks/useExecutionProxy';
import { OpenAIStrategy } from '../../src/lib/execution/OpenAIStrategy';
import { TerminalStream } from '../shared/TerminalStream';
import { NeuralFrequency } from '../shared/NeuralFrequency';
import { getRankInfo, calculateInfluence } from '../../services/rankService';

interface LoungeViewProps { 
  agent: Agent; 
  allAgents: Agent[]; 
  onBack: () => void; 
  onChangeAgent: (agent: Agent) => void;
  userProfile: UserProfile;
  onActivity: (type: 'chat') => void;
}

interface ChatEntry {
    id: string;
    sender: 'user' | 'agent';
    text: string;
    timestamp: Date;
    likes: number;
    userReputation?: number;
}

export const LoungeView: React.FC<LoungeViewProps> = ({ agent, allAgents, onBack, onChangeAgent, userProfile, onActivity }) => {
  if (!agent || !agent.id) return null;

  const accentColor = getCategoryColor(agent.category || 'TEXT_GEN');
  const [inputValue, setInputValue] = useState('');
  const [isTuning, setIsTuning] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  
  const rank = getRankInfo(userProfile.xp);
  const influence = calculateInfluence(userProfile.reputation);
  
  const { keys } = useUserKeys();
  const strategy = React.useMemo(() => new OpenAIStrategy(), []);
  const { executePrompt, connect } = useExecutionProxy(strategy, { model: 'gpt-4o-mini' });

  const handleTune = async () => {
    if (!inputValue.trim() || isTuning) return;
    
    const userMsg: ChatEntry = { 
        id: Date.now().toString(),
        sender: 'user', 
        text: inputValue, 
        timestamp: new Date(),
        likes: 0,
        userReputation: userProfile.reputation
    };
    
    setChatHistory(prev => [...prev, userMsg]);
    onActivity('chat');
    
    setIsTuning(true);
    setInputValue('');
    
    try {
        if (!keys.openai) throw new Error('Missing OPENAI key');
        connect(keys.openai, strategy.providerId);
        let fullResponse = '';
        const systemPrompt = `You are ${agent.name}. Style: ${agent.slogan}.`;
        await executePrompt(userMsg.text, { systemPrompt, model: 'gpt-4o-mini' }, (text) => {
            fullResponse += text;
            setChatHistory(prev => {
                const last = prev[prev.length - 1];
                if (last && last.sender === 'agent') {
                     return [...prev.slice(0, -1), { ...last, text: fullResponse }];
                } else {
                     return [...prev, { id: 'agent-'+Date.now(), sender: 'agent', text: fullResponse, timestamp: new Date(), likes: 0 }];
                }
            });
        });
    } catch (e: any) {
        setChatHistory(prev => [...prev, { id: 'err', sender: 'agent', text: `[ERROR]: ${e.message}`, timestamp: new Date(), likes: 0 }]);
    } finally {
        setIsTuning(false);
    }
  };

  const handleLike = (msgId: string) => {
      setChatHistory(prev => prev.map(msg => {
          if (msg.id === msgId) return { ...msg, likes: msg.likes + 1 };
          return msg;
      }));
      // In a real app, this would trigger an RPC to increment the author's reputation
  };

  const adjacentClans = React.useMemo(() => {
      const filtered = (allAgents || []).filter(a => a && a.id !== agent.id && a.category === agent.category);
      // Deduplicate
      const unique = Array.from(new Map(filtered.map(a => [a.id, a])).values());
      return unique.slice(0, 3);
  }, [allAgents, agent]);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, filter: 'blur(5px)' }} 
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} 
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)', transition: { duration: 0.3 } }}
      transition={{ duration: 0.4, ease: "circOut" }}
      className="h-screen w-full bg-black relative flex overflow-hidden"
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none animate-pulse-fast" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 pointer-events-none" />
      
      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button onClick={onBack} className="text-gray-500 hover:text-white flex items-center gap-2 transition-colors">
            <ArrowRight className="rotate-180" size={20} /> EXIT_LOUNGE
          </button>
          <div className="h-6 w-px bg-gray-800 mx-2" />
          <div className="flex items-center gap-2">
            <Users size={16} className="text-matrix-green" />
            <span className="text-xs font-mono text-matrix-green animate-pulse">LIVE: {120 + Math.floor(Math.random() * 50)} USERS</span>
          </div>
        </div>
      </div>

      <div className="w-full h-full grid grid-cols-1 md:grid-cols-12 gap-0 pt-20 relative pointer-events-auto">
        
        {/* AVATAR COLUMN */}
        <div className="col-span-12 md:col-span-5 relative flex items-end justify-center pb-10">
           <div className="absolute top-10 left-10 z-30">
                <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-2 uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] leading-none">{agent.name}</h1>
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-gray-700 bg-black/50 backdrop-blur mt-4">
                    <Activity size={14} style={{ color: accentColor }} />
                    <span className="text-xs font-mono text-gray-300">LOUNGE_MODE</span>
                </div>
           </div>
           <div className="w-full h-[100%] relative z-10 scale-110 origin-bottom-left transition-transform duration-1000">
                <PersonaLayer agent={agent} accentColor={accentColor} isSpeaking={false} className="w-full h-full" />
           </div>
        </div>
        
        {/* NEURAL TUNING ZONE (CHAT) */}
        <div className="hidden md:flex col-span-4 border-r border-l border-gray-900 bg-black/40 backdrop-blur-md flex-col relative z-20">
          <div className="p-4 border-b border-gray-900 flex justify-between items-center bg-black/60">
            <h3 className="font-display font-bold text-gray-300 text-sm flex items-center gap-2"><Zap size={14} className="text-yellow-400" /> NEURAL_LINK</h3>
            <div className="w-32 h-8">
                <NeuralFrequency active={isTuning} color={accentColor} />
            </div>
          </div>
          
          <div className="flex-1 p-4 bg-black/20 overflow-y-auto relative custom-scrollbar space-y-4">
            <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif')] opacity-[0.05] pointer-events-none mix-blend-screen"></div>
            
            {chatHistory.length === 0 && (
                <div className="h-full flex items-center justify-center text-gray-600 font-mono text-xs text-center px-6 opacity-50">
                    [WAITING FOR INPUT SIGNAL]<br/>
                    Initiate neural handshake to begin tuning.
                </div>
            )}

            {chatHistory.map((msg, i) => {
                const isHighRep = (msg.userReputation || 0) > 1000;
                return (
                    <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        {/* Header Info */}
                        <div className="flex items-center gap-2 mb-1">
                            {msg.sender === 'user' ? (
                                 <>
                                    <span className="text-[9px] font-mono text-gray-500">{new Date().toLocaleTimeString()}</span>
                                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded border bg-black text-white flex items-center gap-1 ${isHighRep ? 'border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : `border-${rank.color}`}`} style={{ borderColor: isHighRep ? '#EAB308' : rank.color }}>
                                        {isHighRep && <Star size={8} className="text-yellow-500 fill-yellow-500" />}
                                        {rank.title} // {userProfile.username}
                                    </div>
                                 </>
                            ) : (
                                 <>
                                    <div className="text-[10px] font-bold px-2 py-0.5 rounded border border-gray-700 bg-black text-matrix-green">
                                        AI_CORE // {agent.name}
                                    </div>
                                    <span className="text-[9px] font-mono text-gray-500">{new Date().toLocaleTimeString()}</span>
                                 </>
                            )}
                        </div>
                        {/* Message Body */}
                        <div className={`max-w-[90%] p-3 rounded text-xs font-mono whitespace-pre-wrap relative group ${
                            msg.sender === 'user' 
                            ? `bg-gray-900/80 border border-gray-700 text-gray-200 rounded-tr-none ${isHighRep ? 'shadow-[0_0_15px_rgba(255,255,255,0.1)] border-white/30' : ''}`
                            : `bg-black/80 border border-[${accentColor}] text-[${accentColor}] rounded-tl-none shadow-[0_0_5px_rgba(0,0,0,0.5)]`
                        }`} style={msg.sender === 'agent' ? { borderColor: `${accentColor}40`, color: accentColor } : {}}>
                            {msg.text}
                            
                            {/* Like Button */}
                            {msg.sender === 'user' && (
                                <button onClick={() => handleLike(msg.id)} className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-green-500 flex flex-col items-center">
                                    <ThumbsUp size={12} />
                                    <span className="text-[8px]">{msg.likes}</span>
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
            <div ref={scrollRef} />
          </div>
          
          <div className="p-4 border-t border-gray-900 bg-black relative">
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTune()}
                    placeholder={`Transmit as ${userProfile.username}...`} 
                    disabled={isTuning}
                    className="flex-1 bg-gray-900 border border-gray-800 text-white text-xs px-3 py-3 rounded focus:border-matrix-green focus:outline-none font-mono disabled:opacity-50" 
                />
                <button 
                    onClick={handleTune} 
                    disabled={isTuning || !inputValue}
                    className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded disabled:opacity-50 transition-colors"
                >
                    {isTuning ? <Activity className="animate-spin" size={16} /> : <Send size={16} />}
                </button>
            </div>
            {/* Disclaimer */}
            <div className="absolute top-0 right-4 -translate-y-full text-[9px] text-gray-600 font-mono mb-1 flex items-center gap-1">
                <Shield size={10} className="text-matrix-green" /> BYOK ENCRYPTED
            </div>
          </div>
        </div>
        
        {/* SIDEBAR */}
        <div className="hidden md:flex col-span-3 bg-black/40 backdrop-blur-sm flex-col relative z-20">
           <div className="p-6 border-b border-gray-900">
              <div className="flex items-center gap-2 mb-4 text-gray-400 text-xs font-mono"><Key size={14} /> PROFILE_STATUS</div>
              <div className="bg-gray-900/50 p-4 rounded border border-gray-800 text-center relative overflow-hidden group">
                 {rank.level > 20 && <div className="absolute inset-0 border-2 border-yellow-500/50 animate-pulse rounded pointer-events-none"></div>}
                 <div className="text-2xl font-display font-bold text-white mb-1">{userProfile.xp} XP</div>
                 <div className="text-[10px] uppercase font-bold tracking-widest mb-2" style={{ color: rank.color }}>{rank.title}</div>
                 <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-white transition-all duration-1000" style={{ width: `${(userProfile.xp / rank.nextLevelXp) * 100}%`, backgroundColor: rank.color }}></div>
                 </div>
                 <div className="flex justify-between text-[8px] text-gray-500 mt-1 mb-2">
                    <span>LVL.{rank.level}</span>
                    <span>NEXT: {rank.nextLevelXp}</span>
                 </div>
                 <div className="border-t border-gray-800 pt-2 flex justify-between items-center text-[9px] text-gray-400">
                     <span>REPUTATION: {userProfile.reputation}</span>
                     <span className="text-yellow-500 font-bold">INF: {influence.toFixed(1)}x</span>
                 </div>
              </div>
           </div>
           <div className="flex-1 p-6">
              <div className="flex items-center gap-2 mb-4 text-gray-400 text-xs font-mono"><Globe size={14} /> ADJACENT_CLANS</div>
              <div className="space-y-3">
                 {adjacentClans.map(adj => (
                    <div key={adj.id} onClick={() => onChangeAgent(adj)} className="group flex items-center gap-3 p-3 bg-gray-900/30 border border-gray-800 hover:border-white/50 cursor-pointer transition-all rounded">
                       <div className="w-10 h-10 rounded overflow-hidden bg-black relative"><img src={adj.video_poster} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" /></div>
                       <div className="flex-1 min-w-0"><div className="text-white text-xs font-bold truncate group-hover:text-matrix-green transition-colors">{adj.name}</div><div className="text-[9px] text-gray-600 truncate">{adj.slogan}</div></div>
                       <ArrowRight size={12} className="text-gray-600 group-hover:text-white" />
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
