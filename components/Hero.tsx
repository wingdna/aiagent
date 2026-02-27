import React from 'react';
import { Search, Zap } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-cyber-black border-b border-cyber-dim">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern bg-[length:30px_30px] opacity-20 pointer-events-none"></div>
      
      {/* Glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyber-cyan/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyber-purple/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyber-cyan/30 bg-cyber-cyan/10 text-cyber-cyan text-xs font-mono mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-cyan"></span>
          </span>
          SYSTEM ONLINE // V 2.4.0
        </div>
        
        <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 tracking-tight">
          CONNECT TO <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-white to-cyber-purple neon-text">
            YouAgent
          </span>
        </h1>
        
        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-400 font-sans">
          Deploy autonomous AI agents for complex workflows. <br/>
          Secure. Scalable. Decentralized.
        </p>

        <div className="mt-10 max-w-lg mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyber-cyan to-cyber-purple rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-cyber-panel border border-cyber-dim rounded-lg p-2">
            <Search className="w-5 h-5 text-gray-400 ml-2" />
            <input 
              type="text" 
              placeholder="Search protocol: e.g. 'Data Analysis'" 
              className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 font-mono text-sm h-10 px-4"
            />
            <button className="bg-cyber-cyan hover:bg-cyan-400 text-cyber-black font-bold py-2 px-6 rounded transition-colors flex items-center gap-2">
              <Zap className="w-4 h-4" />
              INIT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};