import React from 'react';
import { Image as IconImage, FileText as IconFileText, Code as IconCode } from 'lucide-react';

interface MultimodalTrayProps {
    onTriggerIngestion: () => void;
    isMobile: boolean;
}

export const MultimodalTray: React.FC<MultimodalTrayProps> = ({ onTriggerIngestion, isMobile }) => {
    // Only hide on actual mobile devices, not small desktop windows
    if (isMobile) return null;

    return (
        <div className="flex gap-3 opacity-40 group-hover:opacity-100 transition-opacity mr-3 shrink-0">
            <IconImage onClick={onTriggerIngestion} className="w-5 h-5 cursor-pointer hover:text-cyan-400" />
            <IconFileText onClick={onTriggerIngestion} className="w-5 h-5 cursor-pointer hover:text-cyan-400" />
            <IconCode onClick={onTriggerIngestion} className="w-5 h-5 cursor-pointer hover:text-cyan-400" />
        </div>
    );
};
