import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Agent } from '../../types';
import { Check, DollarSign, Zap, Globe, Shield, Code, ChevronDown, ChevronUp, Activity } from 'lucide-react';

interface PricingMatrixProps {
  agent: Agent;
}

// --- SUB-COMPONENT: TIER CARD (Collapsible Logic) ---
const TierCard: React.FC<{ tier: any, idx: number, total: number }> = ({ tier, idx, total }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Safe price extraction
    let priceDisplay = typeof tier.price === 'object' ? 'Custom' : tier.price;
    let originalPrice = tier.original_price || tier.strike_price;

    // [DATA_SANITIZATION_PROTOCOL]
    if (typeof priceDisplay === 'string') {
        const matches = priceDisplay.match(/(\d+(?:\.\d+)?)/g);
        if (matches && matches.length > 1) {
            const nums = matches.map(parseFloat);
            const minPrice = Math.min(...nums);
            const maxPrice = Math.max(...nums);
            if (minPrice !== maxPrice) {
                priceDisplay = minPrice;
                originalPrice = maxPrice;
            } else {
                priceDisplay = minPrice;
            }
        }
    }

    const saturation = ((idx + 1) / total) * 100;
    const features = tier.features || [];

    return (
        <div 
            className={`relative bg-[#050505] border border-white/5 rounded-xl p-5 backdrop-blur-md flex flex-col transition-all group overflow-hidden cursor-pointer ${isExpanded ? 'border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'hover:border-white/20'}`} 
            onClick={() => setIsExpanded(!isExpanded)}
            itemProp="offers" itemScope itemType="http://schema.org/Offer"
        >
            <meta itemProp="priceCurrency" content="USD" />
            <meta itemProp="price" content={typeof priceDisplay === 'number' ? priceDisplay.toString() : "0"} />
            
            {/* TACTICAL VALUE BAR */}
            <div className="absolute top-0 left-0 h-[2px] bg-zinc-900 w-full">
                <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-1000" 
                    style={{ width: `${saturation}%` }}
                />
            </div>
            
            {/* Highlight Effect */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            {/* HEADER (Always Visible) */}
            <div className="flex justify-between items-center mb-2 relative z-10 h-8">
                <div className="flex items-center">
                    <span className="text-xl text-cyan-400 font-bold tracking-tight font-sans">
                        {priceDisplay === 0 ? 'FREE' : (typeof priceDisplay === 'number' ? `$${priceDisplay}` : priceDisplay)}
                    </span>
                    {originalPrice && (
                        <span className="text-xs text-zinc-600 line-through ml-2 font-mono">
                            ${originalPrice}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {tier.popular ? (
                        <span className="text-[9px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                            RECOMMENDED
                        </span>
                    ) : (
                        <span className="text-[9px] font-mono text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded border border-white/5">
                            TIER {idx + 1}
                        </span>
                    )}
                    <div className={`text-cyan-500/50 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={14} />
                    </div>
                </div>
            </div>

            <h4 className="text-xs font-bold text-white font-display uppercase tracking-wider mb-1 relative z-10 pl-0.5" itemProp="name">
                {tier.name}
            </h4>

            {/* COLLAPSIBLE CONTENT */}
            <AnimatePresence>
                {isExpanded && (
                    <m.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden relative z-10"
                    >
                        <div className="pt-4">
                            {tier.description && <p className="text-[10px] text-zinc-500 mb-6 leading-relaxed pl-0.5" itemProp="description">{tier.description}</p>}

                            {/* FEATURES LIST */}
                            <div className="space-y-2 mb-6">
                                {features.map((feat: string, fIdx: number) => {
                                    const parts = feat.split(/(\d+(?:,\d+)*(?:\.\d+)?)/);
                                    return (
                                        <div key={fIdx} className="flex items-start gap-2 group/feat">
                                            <Check size={12} className="text-cyan-500/70 mt-0.5 shrink-0 group-hover/feat:text-cyan-400 transition-colors" />
                                            <span className="text-[11px] text-zinc-400 font-mono leading-snug">
                                                {parts.map((part, pIdx) => {
                                                    if (/^\d+(?:,\d+)*(?:\.\d+)?$/.test(part)) {
                                                        return <span key={pIdx} className="text-zinc-100 font-medium">{part}</span>;
                                                    }
                                                    return <span key={pIdx}>{part}</span>;
                                                })}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <button className="w-full h-9 flex items-center justify-center rounded bg-[#111] border border-white/10 text-cyan-400 font-mono text-[10px] uppercase tracking-wider hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all duration-300 relative overflow-hidden group/btn z-10">
                                <div className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                <span className="relative z-10 group-hover/btn:text-cyan-300 transition-colors font-bold">
                                    {tier.btn_text || 'SELECT_NODE'}
                                </span>
                            </button>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const PricingMatrix: React.FC<PricingMatrixProps> = ({ agent }) => {
  const pricing = agent.pricing_model as any;
  const pricingJson = agent.pricing_model_json as any;

  // --- NEW RENDERER FOR JSON TIERS ---
  if (pricingJson && pricingJson.tiers && pricingJson.tiers.length > 0) {
      return (
          <m.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 w-full"
          >
              <div className="flex items-center gap-2 mb-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                 <DollarSign size={12} /> PRICING_INTEL_DECK
              </div>

              <div className="flex flex-col gap-4">
                  {pricingJson.tiers.map((tier: any, idx: number) => (
                      <TierCard key={idx} tier={tier} idx={idx} total={pricingJson.tiers.length} />
                  ))}
              </div>
          </m.div>
      );
  }

  // [UI_FALLBACK_REFINEMENT]
  // If no structured pricing data, show "Under Analysis" instead of nothing or broken UI
  if (!pricing && (!pricingJson || !pricingJson.tiers || pricingJson.tiers.length === 0)) {
      return (
        <m.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 w-full"
        >
            <div className="flex items-center gap-2 mb-4 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                 <DollarSign size={12} /> PRICING_INTEL_DECK
            </div>
            <div className="w-full h-24 border border-dashed border-white/10 rounded-xl bg-white/5 flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]" />
                <Activity size={16} className="text-cyan-500/50 animate-pulse" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">PRICING_MODEL_UNDER_ANALYSIS</span>
            </div>
        </m.div>
      );
  }

  if (!pricing) return null;

  // Normalize type to handle case sensitivity or variations
  const type = pricing.type;
  
  // Strict check for empty object
  if (!type) return null;

  // --- RENDERERS ---

  const renderSubscription = () => (
    <div className="grid grid-cols-1 gap-3">
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
          <DollarSign size={48} />
        </div>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1">SUBSCRIPTION</h4>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white font-sans">${pricing.price}</span>
              <span className="text-xs text-gray-400 font-mono">/{pricing.interval || 'mo'}</span>
            </div>
          </div>
          {pricing.trial_days && (
            <span className="px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-400 font-mono">
              {pricing.trial_days} DAY TRIAL
            </span>
          )}
        </div>
        
        {pricing.features && pricing.features.length > 0 && (
          <ul className="space-y-2 mt-4">
            {pricing.features.map((feature: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-[11px] font-mono text-gray-300">
                <Check size={12} className="text-cyan-500 mt-0.5 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const renderApiUsage = () => (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm relative overflow-hidden">
      <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
        <h4 className="text-xs font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-2">
          <Zap size={12} /> API_METERED
        </h4>
        <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono">
          PAY_PER_TOKEN
        </span>
      </div>
      
      <div className="space-y-3 font-mono text-xs">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">INPUT_COST</span>
          <span className="text-white font-bold">${pricing.input_cost_per_1k || '0.00'}<span className="text-gray-500 font-normal">/1k</span></span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">OUTPUT_COST</span>
          <span className="text-white font-bold">${pricing.output_cost_per_1k || '0.00'}<span className="text-gray-500 font-normal">/1k</span></span>
        </div>
        {pricing.image_cost && (
           <div className="flex justify-between items-center pt-2 border-t border-white/5">
             <span className="text-gray-400">IMAGE_GEN</span>
             <span className="text-white font-bold">${pricing.image_cost}<span className="text-gray-500 font-normal">/img</span></span>
           </div>
        )}
      </div>
    </div>
  );

  const renderOpenSource = () => (
    <div className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-lg p-4 backdrop-blur-sm relative overflow-hidden group hover:border-white/20 transition-colors">
       <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
       
       <div className="flex items-center gap-3 mb-3 relative z-10">
         <div className="p-2 rounded bg-white/10 text-white">
           <Globe size={16} />
         </div>
         <div>
           <h4 className="text-xs font-bold text-white font-sans">COMMUNITY_EDITION</h4>
           <span className="text-[10px] font-mono text-gray-400 uppercase">{pricing.license || 'MIT_LICENSE'}</span>
         </div>
       </div>

       <div className="flex gap-2 mt-3 relative z-10">
         <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-gray-300 font-mono flex items-center gap-1">
           <Shield size={10} /> AUDITED
         </span>
         <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-gray-300 font-mono flex items-center gap-1">
           <Code size={10} /> SELF_HOST
         </span>
       </div>
    </div>
  );

  // --- MAIN RENDER ---
  
  return (
    <m.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
         <DollarSign size={12} /> ECONOMIC_MODEL
      </div>

      {/* Content */}
      {(type === 'Subscription' || type === 'Closed-SaaS') && renderSubscription()}
      {type === 'API_Usage' && renderApiUsage()}
      {(type === 'Free_OpenSource' || type === 'Open-Weights') && renderOpenSource()}
      
      {/* Fallback for unknown types */}
      {!['Subscription', 'Closed-SaaS', 'API_Usage', 'Free_OpenSource', 'Open-Weights'].includes(type as string) && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-gray-400 font-mono">
           MODEL: {type}
           {pricing.price && <span className="block text-white font-bold mt-1">${pricing.price}</span>}
        </div>
      )}
    </m.div>
  );
};
