import React from 'react';
import { Agent } from '../../types';

interface TechnicalDeepDiveProps {
  agent: Agent;
}

export const TechnicalDeepDive: React.FC<TechnicalDeepDiveProps> = ({ agent }) => {
  // 1. 安全提取 JSONB 数据
  const techSpecs = agent.technical_specs || {};
  const hasSpecs = Object.keys(techSpecs).length > 0;

  // 2. 如果没有任何规格数据，直接返回 null，不渲染空壳
  if (!hasSpecs) return null;

  // 3. 动态遍历渲染
  return (
    <div className="bento-card-container bg-black/20 border border-white/5 rounded-xl p-6 backdrop-blur-sm mt-4">
      <h3 className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest border-b border-cyan-900/30 pb-2 mb-6">
        TECHNICAL_DEEP_DIVE
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(techSpecs).map(([key, value]) => {
          // 格式化 Key (例如 'model_architecture' -> 'MODEL ARCHITECTURE')
          const formattedKey = key.replace(/_/g, ' ').toUpperCase();
          
          // 处理布尔值 (例如 multimodal: true)
          if (typeof value === 'boolean') {
            return (
              <div key={key} className="spec-item flex flex-col gap-1">
                <span className="spec-label text-[10px] text-gray-500 uppercase">{formattedKey}</span>
                <span className={`text-sm font-mono ${value ? "text-cyan-400" : "text-red-400"}`}>
                  {value ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
            );
          }
          
          // 处理普通字符串/数字
          return (
            <div key={key} className="spec-item flex flex-col gap-1">
              <span className="spec-label text-[10px] text-gray-500 uppercase">{formattedKey}</span>
              <span className="spec-value text-sm text-gray-200 font-mono">{String(value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
