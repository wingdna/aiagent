import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const SystemFailureHUD: React.FC<{ error?: Error }> = ({ error }) => {
  const [text, setText] = useState('');
  const fullText = `ERR_DEADLOCK: VITE_ENV_COMPROMISED\n> SYSTEM_HALT: ${error?.message || 'UNKNOWN_FATAL_ERROR'}\n> INITIATING_EMERGENCY_SHUTDOWN...`;

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [fullText]);

  return (
    <div className="w-full h-full bg-[#050505] flex flex-col items-center justify-center p-8 overflow-hidden relative">
      {/* Glitch Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif')] bg-cover mix-blend-overlay" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 border border-red-900/50 bg-black/90 p-8 max-w-2xl w-full font-mono shadow-[0_0_50px_rgba(220,38,38,0.2)]"
      >
        <div className="flex items-center gap-4 mb-6 border-b border-red-900/30 pb-4">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-ping" />
          <h1 className="text-red-600 text-xl font-bold tracking-[0.2em] glitch-text" data-text="CRITICAL_SYSTEM_FAILURE">
            CRITICAL_SYSTEM_FAILURE
          </h1>
        </div>

        <div className="space-y-4">
          <p className="text-red-500/80 text-sm whitespace-pre-wrap leading-relaxed min-h-[100px]">
            {text}
            <span className="inline-block w-2 h-4 bg-red-600 ml-1 animate-pulse" />
          </p>
        </div>

        <div className="mt-8 flex justify-between items-center border-t border-red-900/30 pt-4">
          <span className="text-[10px] text-red-900 uppercase tracking-widest">Error Code: 0xDEADDEAD</span>
          <button 
            onClick={() => typeof window !== 'undefined' && window.location.reload()}
            className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 text-xs border border-red-900/50 transition-all hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] uppercase tracking-widest"
          >
            Reboot_System
          </button>
        </div>
      </motion.div>

      <style>{`
        .glitch-text {
          position: relative;
        }
        .glitch-text::before,
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .glitch-text::before {
          left: 2px;
          text-shadow: -1px 0 #00ffff;
          clip: rect(44px, 450px, 56px, 0);
          animation: glitch-anim 5s infinite linear alternate-reverse;
        }
        .glitch-text::after {
          left: -2px;
          text-shadow: -1px 0 #ff00ff;
          clip: rect(44px, 450px, 56px, 0);
          animation: glitch-anim2 5s infinite linear alternate-reverse;
        }
        @keyframes glitch-anim {
          0% { clip: rect(31px, 9999px, 94px, 0); }
          4.166666667% { clip: rect(91px, 9999px, 43px, 0); }
          8.333333333% { clip: rect(6px, 9999px, 8px, 0); }
          12.5% { clip: rect(62px, 9999px, 16px, 0); }
          16.66666667% { clip: rect(13px, 9999px, 7px, 0); }
          20.83333333% { clip: rect(60px, 9999px, 63px, 0); }
          25% { clip: rect(43px, 9999px, 96px, 0); }
          29.16666667% { clip: rect(10px, 9999px, 83px, 0); }
          33.33333333% { clip: rect(56px, 9999px, 93px, 0); }
          37.5% { clip: rect(20px, 9999px, 15px, 0); }
          41.66666667% { clip: rect(14px, 9999px, 4px, 0); }
          45.83333333% { clip: rect(80px, 9999px, 3px, 0); }
          50% { clip: rect(64px, 9999px, 98px, 0); }
          54.16666667% { clip: rect(81px, 9999px, 66px, 0); }
          58.33333333% { clip: rect(83px, 9999px, 1px, 0); }
          62.5% { clip: rect(62px, 9999px, 36px, 0); }
          66.66666667% { clip: rect(19px, 9999px, 18px, 0); }
          70.83333333% { clip: rect(18px, 9999px, 82px, 0); }
          75% { clip: rect(34px, 9999px, 8px, 0); }
          79.16666667% { clip: rect(51px, 9999px, 35px, 0); }
          83.33333333% { clip: rect(14px, 9999px, 88px, 0); }
          87.5% { clip: rect(60px, 9999px, 53px, 0); }
          91.66666667% { clip: rect(30px, 9999px, 2px, 0); }
          95.83333333% { clip: rect(66px, 9999px, 24px, 0); }
          100% { clip: rect(48px, 9999px, 9px, 0); }
        }
        @keyframes glitch-anim2 {
          0% { clip: rect(65px, 9999px, 100px, 0); }
          100% { clip: rect(10px, 9999px, 81px, 0); }
        }
      `}</style>
    </div>
  );
};
