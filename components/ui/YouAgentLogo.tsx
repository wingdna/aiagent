import React from 'react';

interface LogoProps {
  className?: string;
}

export const YouAgentLogo: React.FC<LogoProps> = ({ className = "w-10 h-10" }) => {
  return (
    <svg 
      className={`select-none ${className}`} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* 反重力霓虹光晕滤镜 (Antigravity Neon Glow) */}
        <filter id="cyber-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="100%" stopColor="#8A2BE2" />
        </linearGradient>
      </defs>

      {/* 外围神经网络六边形边框 */}
      <path 
        d="M50 5L89 27.5V72.5L50 95L11 72.5V27.5L50 5Z" 
        stroke="url(#edge-gradient)" 
        strokeWidth="3" 
        strokeOpacity="0.8"
        filter="url(#cyber-glow)"
      />
      
      {/* 几何字母 Y (You) */}
      <path 
        d="M32 35L50 55L68 35" 
        stroke="#E2E8F0" /* Tailwind slate-200 */
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M50 55V80" 
        stroke="#E2E8F0" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* 几何字母 A 的横纹破壳点缀 (Agent) */}
      <path 
        d="M36 68H64" 
        stroke="#00F0FF" 
        strokeWidth="4" 
        strokeLinecap="round" 
        filter="url(#cyber-glow)"
      />

      {/* 核心意图爆发点 (Intent Core) */}
      <circle 
        cx="50" 
        cy="55" 
        r="5" 
        fill="#00F0FF" 
        filter="url(#cyber-glow)" 
      />
    </svg>
  );
};
