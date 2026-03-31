
import React, { useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m } from 'framer-motion';
import { Settings2, Terminal, X } from 'lucide-react';
import { AgentRegistryEntity } from '../../app/types/registry';
import { useExecutionProxy } from '../../hooks/useExecutionProxy';
import { UniversalStrategy } from '../../lib/execution/UniversalStrategy';
import { NeuralTerminal } from '../../components/tactical/NeuralTerminal';
import { cerebroService } from '../../services/cerebroService';
import { HoloProjector } from '../ui/HoloProjector';
import { extractYoutubeId } from '../../utils/videoUtils';


export interface HoloFrameRef {
  openTerminal: () => void;
}

interface HoloFrameProps {
  agent: AgentRegistryEntity;
  accentColor: string;
  expansion?: 'normal' | 'enlarged' | 'ultra' | 'full';
  setExpansion?: React.Dispatch<React.SetStateAction<'normal' | 'enlarged' | 'ultra' | 'full'>>;
  onTerminalStateChange?: (isOpen: boolean) => void;
}

export const HoloFrame = forwardRef<HoloFrameRef, HoloFrameProps>(({ agent, expansion = 'normal', setExpansion, onTerminalStateChange }, ref) => {
  const [muted, setMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);


  const [terminalOpen, setTerminalOpen] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [apiBaseUrl, setApiBaseUrl] = useState(agent.connectivity?.try_url || '');
  const [modelName, setModelName] = useState(typeof agent.specs?.model_params === 'string' ? agent.specs.model_params : 'gpt-4o');
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
    setIsMounted(true);
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

  useEffect(() => {
    if (onTerminalStateChange) {
      onTerminalStateChange(terminalOpen);
    }
  }, [terminalOpen, onTerminalStateChange]);

  const videoId = extractYoutubeId(agent.assets.video_url);
  const hasVideo = Boolean(agent.assets.video_url || videoId) && !videoError;
  const pricingDetails = agent.pricing?.details;
  const pricingStr = typeof pricingDetails === 'string' 
    ? pricingDetails 
    : (pricingDetails?.type || JSON.stringify(pricingDetails || ''));

  const categoryStr = typeof agent.category === 'string' ? agent.category : '';
  const tags = Array.isArray(agent.capabilities) ? agent.capabilities : [];

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
    // if (isExternalOnly) return; // Allow connection for all agents
    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }
    setTerminalOpen(true);
  };

  useImperativeHandle(ref, () => ({
    openTerminal: openTerminalOrConfigure
  }));

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
      <div className="w-full aspect-video bg-[#050505] border border-white/10 rounded-xl overflow-hidden relative group mb-6 backdrop-blur-sm pointer-events-auto">
        <div className="absolute top-0 left-0 p-3 opacity-30 z-20 pointer-events-none">
          <div className="w-3 h-3 border-t border-l border-white/70" />
        </div>
        <div className="absolute bottom-0 right-0 p-3 opacity-30 z-20 pointer-events-none">
          <div className="w-3 h-3 border-b border-r border-white/70" />
        </div>

        {/* --- HOLO PROJECTOR INTEGRATION --- */}
        <div className="absolute inset-0 w-full h-full">
          <HoloProjector 
            mode={agent.display_mode as any}
            video={agent.assets.video_url} 
            gif={agent.assets.gif_url} 
            image={agent.assets.cover_url} 
            title={String(agent.name || '')} 
            gallery={agent.assets.media_gallery}
            audioSample={agent.assets.audio_sample_url}
            demoInteraction={agent.demo_interaction}
            expansion={expansion}
            setExpansion={setExpansion}
            className="w-full h-full"
          />
        </div>
        {/* ---------------------------------- */}

        <AnimatePresence>
          {terminalOpen && (
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
              agentName={String(agent.name || '')}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isMounted && showKeyModal && createPortal(
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setShowKeyModal(false)}
          >
            <div
              className="bg-black/60 border border-white/10 p-8 rounded-2xl w-full max-w-md relative overflow-hidden"
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
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl p-3 text-slate-200 font-sans text-sm focus:border-cyan-500/40 focus:bg-white/[0.04] transition-colors outline-none"
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
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl p-3 text-slate-200 font-sans text-sm focus:border-cyan-500/40 focus:bg-white/[0.04] transition-colors outline-none"
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
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl p-3 text-slate-200 font-sans text-sm focus:border-cyan-500/40 focus:bg-white/[0.04] transition-colors outline-none"
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
                  className="px-5 py-2.5 bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/50 hover:border-cyan-400 transition-colors rounded-xl text-sm font-sans font-medium"
                >
                  Establish Link
                </button>
              </div>
            </div>
          </m.div>,
          document.body
        )}
      </AnimatePresence>


    </>
  );
});
