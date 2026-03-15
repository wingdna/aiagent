
// 🛑 CORE ENGINE LOGIC - DO NOT MODIFY UNLESS EXPLICITLY INSTRUCTED. PURE LOGIC ONLY.
import { AgentAdapter } from './types';
import { LLMAdapter } from './LLMAdapter';
import { ImageAdapter } from './ImageAdapter';

export class AdapterFactory {
    static getAdapter(category: string): AgentAdapter {
        const cat = category.toUpperCase();
        
        if (cat === 'IMAGE_GEN' || cat === 'VIDEO_GEN') {
            return new ImageAdapter();
        }
        
        // Default to Text/LLM for Coding, Analysis, Security, Text
        return new LLMAdapter();
    }
}
