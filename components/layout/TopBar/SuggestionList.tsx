import React from 'react';

interface SuggestionListProps {
    items: any[];
    selectedIndex: number;
    onSelect: (val: string) => void;
}

export const SuggestionList: React.FC<SuggestionListProps> = ({ items, selectedIndex, onSelect }) => {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-4">
                <div className="text-sm font-mono italic tracking-widest text-cyan-400/40">PRESS ENTER TO INITIATE NEURAL SCAN</div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item: any, index: number) => (
                <button 
                    key={item.id}
                    onClick={() => onSelect(item.isCommand ? `${item.id} ` : (item.isGoCommand ? `/go ${item.id}` : (item.isIntelCommand ? `/intel ${item.id}` : item.name)))}
                    className={`flex justify-between items-center p-3 rounded-lg border transition-all ${
                        index === selectedIndex 
                            ? 'bg-cyan-500/20 border-cyan-400' 
                            : 'bg-white/5 hover:bg-white/10 border-cyan-500/20'
                    }`}
                >
                    <span className="font-mono text-sm text-cyan-300">
                        {item.displayLabel || (item.isCommand ? item.name : (item.isGoCommand ? `/go ${item.id}` : (item.isIntelCommand ? `/intel ${item.id}` : item.name)))}
                    </span>
                    {item.isCommand || item.type === 'category' || item.type === 'tag' || item.type === 'badge' ? (
                        <span className="text-xs text-gray-500">{item.desc}</span>
                    ) : (
                        item.metrics?.nri_score && (
                            <span className="text-[10px] font-mono text-cyan-500/70">NRI: {(item.metrics.nri_score * 100).toFixed(1)}%</span>
                        )
                    )}
                </button>
            ))}
        </div>
    );
};
