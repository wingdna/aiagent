
import { Agent } from '../types';
import { CONFIG } from '../config';
import { relayService } from './relayService';
import { supabase } from '../lib/supabase';

export const forgeIdentity = async (agent: Agent): Promise<string | null> => {
    
    // Key check is now handled implicitly by the Relay or checked before calling
    const storedKeys = typeof window !== 'undefined' ? sessionStorage.getItem('YOUAGENT_KEYS') : null;
    const keys = storedKeys ? JSON.parse(storedKeys) : {};
    // Use HuggingFace key if available, else system fallback
    const apiKey = keys.huggingface || keys.siliconflow || ''; 

    // V28.0: NEURAL IDOL PROTOCOL (Anime Cyberpunk Waifu Style)
    // Base Style: High fidelity anime, dark background
    const basePrompt = "Anime style, Niji style, Masterpiece, best quality, high fidelity anime style, cel shaded, 8k wallpaper, cyberpunk aesthetic, neon lighting. Isolated on pure black background, no background details, floating in void. ";
    
    let specificPrompt = "";

    switch (agent.category) {
        case 'CODING':
            specificPrompt = "Cool beauty, silver long hair, futuristic visor, wearing black techwear jacket, green digital code aura, typing on holographic keyboard, intense serious expression.";
            break;
        case 'IMAGE_GEN':
        case 'VIDEO_GEN':
            specificPrompt = "Dreamy anime girl, multicolored glowing hair, translucent cybernetic skin, wearing futuristic street fashion, floating colorful fractals, artistic pose.";
            break;
        case 'SECURITY':
        case 'ANALYSIS':
            specificPrompt = "Strong anime female warrior, heavy mechanical exoskeleton, glowing red eyes, white ponytail, holding a digital data shield, imposing stance.";
            break;
        default: // TEXT_GEN and others
            specificPrompt = "Cute mechanical android girl, white dress with armor plating, glowing blue headphones, friendly smile, soft bio-digital aura.";
    }

    try {
        // 2. Relay Execution
        const imageUrl = await relayService.generateImage(basePrompt + specificPrompt, apiKey);

        if (imageUrl) {
            // 3. Supabase Sync (If connected)
            if (CONFIG.USE_DATABASE && supabase) {
                 await supabase.from('agents').update({ persona_img: imageUrl }).eq('id', agent.id);
            }
            return imageUrl;
        }
    } catch (e) {
        console.error("[FORGE] GENERATION FAILED:", e);
    }
    return null;
};
