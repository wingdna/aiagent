
import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, Settings2, Terminal, Volume2, VolumeX, X } from 'lucide-react';
import { Agent } from '../../types';
import { useExecutionProxy } from '../../src/hooks/useExecutionProxy';
import { UniversalStrategy } from '../../src/lib/execution/UniversalStrategy';
import { NeuralTerminal } from '../../src/components/tactical/NeuralTerminal';
import { cerebroService } from '../../services/cerebroService';

interface HoloFrameProps {
  agent: Agent;
  accentColor: string;
}

export const HoloFrame: React.FC<HoloFrameProps> = ({ agent }) => {
  const [muted, setMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [terminalOpen, setTerminalOpen] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);

  const [apiBaseUrl, setApiBaseUrl] = useState(agent.connectivity?.try_url || '');
  const [modelName, setModelName] = useState(agent.specs?.model_params || 'gpt-4o');
  const [tempBaseUrl, setTempBaseUrl] = useState(apiBaseUrl);
  const [tempModelName, setTempModelName] = useState(modelName);
  const [tempKey, setTempKey] = useState('');

  const strategy = useMemo(() => new UniversalStrategy(), []);
  const {
    messages,
    input,
    setInput,
    isStreaming,
    error,
    apiKey,
    connect,
    executePrompt,
    clearHistory,
  } = useExecutionProxy(strategy, { model: modelName, modelName, apiBaseUrl });

  useEffect(() => {
    setLoading(true);
    setVideoError(false);
    
    // NATIVE ANALYTICS: CEREBRO LINK
    cerebroService.trackEvent('view', agent.slug || agent.id);
  }, [agent.id, agent.slug]);

  useEffect(() => {
    const savedBaseUrl = localStorage.getItem(`youagent_base_url_${agent.id}`);
    const savedModel = localStorage.getItem(`youagent_model_${agent.id}`);

    if (savedBaseUrl) {
      setApiBaseUrl(savedBaseUrl);
      setTempBaseUrl(savedBaseUrl);
    }
    if (savedModel) {
      setModelName(savedModel);
      setTempModelName(savedModel);
    }
  }, [agent.id]);

  const hasVideo = Boolean(agent.video_url) && !videoError;
  const pricingStr = typeof agent.pricing_model === 'string' 
    ? agent.pricing_model 
    : (agent.pricing_model?.type || JSON.stringify(agent.pricing_model || ''));

  const categoryStr = typeof agent.category === 'string' ? agent.category : '';
  const tags = Array.isArray(agent.tags) ? agent.tags : [];

  const isExternalOnly =
    pricingStr.toLowerCase().includes('closed') ||
    pricingStr.toLowerCase().includes('local') ||
    categoryStr.toLowerCase() === 'local' ||
    tags.some((t) => typeof t === 'string' && (t.toLowerCase() === 'local' || t.toLowerCase() === 'closed_saas'));

  const handleSend = () => {
    if (!input.trim()) return;
    executePrompt(input);
    
    // NATIVE ANALYTICS: CEREBRO LINK
    cerebroService.trackEvent('execute_proxy', agent.slug || agent.id, null, false, strategy.providerId);
  };

  const openTerminalOrConfigure = () => {
    if (isExternalOnly) return;
    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }
    setTerminalOpen(true);
  };

  const handleKeySave = () => {
    if (tempKey.trim()) {
      connect(tempKey.trim(), strategy.providerId);
    }

    if (tempBaseUrl.trim()) {
      const v = tempBaseUrl.trim();
      setApiBaseUrl(v);
      localStorage.setItem(`youagent_base_url_${agent.id}`, v);
    }

    if (tempModelName.trim()) {
      const v = tempModelName.trim();
      setModelName(v);
      localStorage.setItem(`youagent_model_${agent.id}`, v);
    }

    setTempKey('');
    setShowKeyModal(false);
  };

  return (
    <>
      <div className="w-full aspect-video bg-[#0f172a] border border-white/10 rounded-xl overflow-hidden relative group mb-6 shadow-2xl backdrop-blur-sm pointer-events-auto">
        <div className="absolute top-0 left-0 p-3 opacity-30 z-20 pointer-events-none">
          <div className="w-3 h-3 border-t border-l border-white/70" />
        </div>
        <div className="absolute bottom-0 right-0 p-3 opacity-30 z-20 pointer-events-none">
          <div className="w-3 h-3 border-b border-r border-white/70" />
        </div>

        {hasVideo ? (
          <video
            src={agent.video_url}
            autoPlay
            muted={muted}
            loop
            playsInline
            onLoadedData={() => setLoading(false)}
            onError={() => setVideoError(true)}
            className={`w-full h-full object-cover transition-opacity duration-700 ${loading ? 'opacity-0' : 'opacity-100'
              }`}
          />
        ) : (
          <div className="relative w-full h-full">
            <img
              src={agent.video_poster || agent.persona_img}
              onLoad={() => setLoading(false)}
              loading="eager"
              className={`w-full h-full object-cover opacity-80 transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-80'
                }`}
            />
            {!loading && (
              <>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(6,182,212,0.02),rgba(0,0,0,0),rgba(245,158,11,0.02))] bg-[length:100%_2px,3px_100%] pointer-events-none z-10" />
                <div className="absolute inset-0 bg-cyan-950/10 animate-pulse mix-blend-overlay z-10 pointer-events-none" />
              </>
            )}
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-[#050505] z-30 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 relative z-40">
              <div className="relative flex items-center justify-center w-8 h-8">
                <div className="absolute inset-0 border border-cyan-500/30 rounded-full animate-[spin_3s_linear_infinite]" />
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              </div>
              <span className="text-[10px] font-mono text-cyan-400 tracking-[0.2em] font-light animate-pulse uppercase">
                Acquiring Signal
              </span>
            </div>
          </div>
        )}

        {!loading && (
          <div className="absolute bottom-4 left-5 flex items-center gap-3 z-20 pointer-events-none">
            <div
              className={`w-1.5 h-1.5 rounded-full animate-pulse ${hasVideo
                ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                }`}
            />
            <span className="text-[9px] font-mono text-white/50 tracking-widest uppercase bg-black/40 px-2.5 py-1 rounded backdrop-blur-sm border border-white/5">
              {hasVideo ? 'Live Feed // AV' : 'Static Uplink'}
            </span>
          </div>
        )}

        <button
          type="button"
          className="absolute inset-0 z-0 cursor-pointer"
          onClick={() => setIsFullscreen(true)}
          title="Expand Visuals"
        />

        {hasVideo && !loading && (
          <button
            type="button"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setMuted((v: boolean) => !v);
            }}
            className="absolute bottom-4 right-16 p-2 bg-black/40 hover:bg-white/10 text-white/50 hover:text-white border border-white/5 rounded-full backdrop-blur-md z-30 transition-all opacity-0 group-hover:opacity-100"
            title={muted ? 'Enable Audio' : 'Disable Audio'}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        )}

        {!terminalOpen && (
          <div className="absolute top-4 right-4 z-30">
            {isExternalOnly ? (
              <a
                href={agent.connectivity?.try_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-4 py-2 bg-slate-900/40 hover:bg-slate-800/60 text-slate-300 border border-white/10 hover:border-white/20 rounded backdrop-blur-md transition-all flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
              >
                <ExternalLink size={14} className="text-slate-400" />
                External Access
              </a>
            ) : (
              <button
                type="button"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  openTerminalOrConfigure();
                }}
                className="px-5 py-2.5 bg-black/40 hover:bg-cyan-950/40 text-cyan-400 border border-cyan-500/20 hover:border-cyan-400/50 rounded backdrop-blur-md transition-all flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_20px_rgba(0,0,0,0.5)]"
              >
                <Terminal size={14} />
                Connect Neural Link
              </button>
            )}
          </div>
        )}

        {!isExternalOnly && (
          <button
            type="button"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              if (!terminalOpen) {
                openTerminalOrConfigure();
              } else {
                setTerminalOpen(false);
              }
            }}
            className="absolute bottom-4 right-4 p-3 bg-black/60 hover:bg-cyan-950/60 text-cyan-500 border border-white/10 hover:border-cyan-500/40 rounded-full backdrop-blur-md z-50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
            title="Toggle Command Interface"
          >
            <Terminal size={16} />
          </button>
        )}

        <AnimatePresence>
          {terminalOpen && !isExternalOnly && (
            <NeuralTerminal
              messages={messages}
              input={input}
              setInput={setInput}
              isStreaming={isStreaming}
              error={error}
              apiKey={apiKey}
              onSend={handleSend}
              onClose={() => setTerminalOpen(false)}
              onConfigureKey={() => setShowKeyModal(true)}
              agentName={agent.name}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setShowKeyModal(false)}
          >
            <div
              className="bg-black/60 border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50" />
              <h3 className="text-slate-200 font-sans text-xl font-light tracking-wide mb-6 flex items-center gap-3">
                <Settings2 size={20} className="text-cyan-400" /> Connection Parameters
              </h3>

              <div className="space-y-5 relative z-10">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 block">
                    API Base URL
                  </label>
                  <input
                    type="text"
                    value={tempBaseUrl}
                    onChange={(e) => setTempBaseUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl p-3 text-slate-200 font-sans text-sm focus:border-cyan-500/40 focus:bg-white/[0.04] transition-colors outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 block">
                    Model Name
                  </label>
                  <input
                    type="text"
                    value={tempModelName}
                    onChange={(e) => setTempModelName(e.target.value)}
                    placeholder="gpt-4o"
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl p-3 text-slate-200 font-sans text-sm focus:border-cyan-500/40 focus:bg-white/[0.04] transition-colors outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 block">
                    Authorization Key
                  </label>
                  <input
                    type="password"
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl p-3 text-slate-200 font-mono text-sm focus:border-cyan-500/40 focus:bg-white/[0.04] transition-colors outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 relative z-10">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-5 py-2.5 text-sm font-sans text-slate-500 hover:text-slate-300 transition-colors rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleKeySave}
                  className="px-5 py-2.5 bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/50 hover:border-cyan-400 transition-colors rounded-xl text-sm font-sans font-medium shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                >
                  Establish Link
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
            onClick={() => setIsFullscreen(false)}
          >
            <div
              className="relative w-full max-w-6xl aspect-video border border-matrix-green/30 rounded-xl overflow-hidden shadow-[0_0_100px_rgba(0,255,65,0.2)] bg-black"
              onClick={(e) => e.stopPropagation()}
            >
              {hasVideo ? (
                <video
                  src={agent.video_url}
                  autoPlay
                  loop
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full relative">
                  <img
                    src={agent.video_poster || agent.persona_img}
                    className="w-full h-full object-contain"
                    alt="preview"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white hover:text-red-500 rounded-full backdrop-blur transition-colors z-50"
              >
                <X size={24} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
