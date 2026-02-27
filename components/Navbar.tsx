import React from 'react';
import { Terminal, Bell, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { YouAgentLogo } from './ui/YouAgentLogo';

export const Navbar: React.FC = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-cyber-dim bg-cyber-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-4 group cursor-pointer">
             <motion.div 
               initial={{ opacity: 0, scale: 0.8 }} 
               animate={{ opacity: 1, scale: 1 }} 
               transition={{ duration: 0.5 }}
             >
               <YouAgentLogo className="w-12 h-12" />
             </motion.div>
            <span className="font-display font-bold text-2xl tracking-wider text-white">
              YouAgent
            </span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a href="#" className="font-mono text-cyber-cyan hover:text-white transition-colors px-3 py-2 rounded-md text-sm font-medium">/DISCOVER</a>
              <a href="#" className="font-mono text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-md text-sm font-medium">/MARKETPLACE</a>
              <a href="#" className="font-mono text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-md text-sm font-medium">/DEPLOY</a>
            </div>
          </div>

          {/* User Controls */}
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-cyber-cyan transition-colors">
              <Terminal className="w-5 h-5" />
            </button>
            <button className="text-gray-400 hover:text-cyber-pink transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-cyber-black bg-cyber-pink"></span>
            </button>
            <div className="h-8 w-8 rounded bg-gradient-to-tr from-cyber-purple to-cyber-cyan p-[1px] cursor-pointer">
              <div className="h-full w-full bg-cyber-black rounded flex items-center justify-center hover:bg-transparent transition-all">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
};