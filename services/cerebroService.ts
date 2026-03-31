
import { AgentSchema } from '../lib/schema/agent';
import { relayService } from './relayService';
import { forgeIdentity } from './forgeService';
import { Agent, VoiceConfig } from '../types';
import { supabase } from '../lib/supabase';
import { isPlaceholder } from '../utils';

export interface Seed {
    url: string;
    source: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'ERROR_CONTENT' | 'PRIORITY_NEW_BORN';
    fail_count: number;
    last_scanned_at: string;
}

export class CerebroService {
    
    /**
     * UNIT 01: THE HARVESTER
     */
    async harvest(sourceUrl: string, onLog: (msg: string) => void, sourceLabel?: string): Promise<number> {
        onLog(`[HARVEST] Targeting: ${sourceLabel || sourceUrl}`);
        if (!supabase) throw new Error("Database Disconnected");

        try {
            const content = await relayService.fetchWithProxy(sourceUrl);
            onLog(`[HARVEST] Payload received: ${content.length} chars`);

            const urlRegex = /https?:\/\/[^\s\)\],]+/g;
            const matches: string[] = content.match(urlRegex) || [];
            
            const cleanUrls = matches
                .map(u => u.replace(/[.,;)]+$/, '')) 
                .filter((url: string) => {
                    const u = url.toLowerCase();
                    const noise = ['w3.org', 'schema.org', 'githubusercontent', 'twitter', 'facebook', 'linkedin', '.png', '.jpg', '.svg', 'license', 'sitemap', 'policies', 'google.com/search', 'login', 'signup', 'localhost', '127.0.0.1', '0.0.0.0'];
                    if (noise.some(n => u.includes(n))) return false;
                    try { 
                        const urlObj = new URL(url);
                        if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') return false;
                    } catch { return false; }
                    return true; 
                });

            const uniqueUrls = [...new Set(cleanUrls)];
            onLog(`[HARVEST] Filtered ${matches.length} -> ${uniqueUrls.length} unique candidates.`);

            if (uniqueUrls.length === 0) return 0;

            const seeds = uniqueUrls.map(url => ({
                url,
                source: sourceLabel || sourceUrl,
                status: 'PENDING',
                fail_count: 0,
                last_scanned_at: new Date().toISOString()
            }));

            const { error } = await supabase.from('seed_queue').upsert(seeds, { onConflict: 'url', ignoreDuplicates: true });
            
            if (error) throw error;
            onLog(`[HARVEST] Operation Successful. ${uniqueUrls.length} seeds injected.`);
            return uniqueUrls.length;

        } catch (e: any) {
            onLog(`[HARVEST] FATAL: ${e.message}`);
            return 0;
        }
    }

    /**
     * RESET DEADLOCK
     */
    async resetDeadlock(onLog: (msg: string) => void): Promise<void> {
        if (!supabase) return;
        onLog("[RESET] RECYCLING STALLED UNITS...");
        const { data } = await supabase
            .from('seed_queue')
            .update({ status: 'PENDING', fail_count: 0 })
            .in('status', ['PROCESSING', 'FAILED', 'ERROR_CONTENT']);
        onLog(`[RESET] Queue cleaned. READY for re-processing.`);
    }

    /**
     * UNIT 02: THE ALCHEMIZER
     */
    async digestBatch(
        apiKey: string, 
        onLog: (msg: string) => void,
        batchSize: number = 5
    ): Promise<void> {
        if (!supabase) {
            onLog("[DIGEST] FATAL: Database connection required.");
            return;
        }

        const { data: seeds, error } = await supabase
            .from('seed_queue')
            .select('id, url, source, status, fail_count, last_scanned_at')
            .in('status', ['PENDING', 'PRIORITY_NEW_BORN'])
            .order('status', { ascending: false }) 
            .order('fail_count', { ascending: true })
            .limit(batchSize);

        if (error || !seeds || seeds.length === 0) {
            onLog(`[DIGEST] Queue Empty. Standing by.`);
            return;
        }

        onLog(`[DIGEST] Processing Batch: ${seeds.length} seeds...`);

        for (const seed of seeds) {
            try {
                const { count: existingCount } = await supabase
                    .from('agents')
                    .select('id', { count: 'exact', head: true })
                    .eq('connectivity->>try_url', seed.url);

                if (existingCount && existingCount > 0) {
                    onLog(`[SKIP] Already Indexed: ${seed.url}`);
                    await supabase.from('seed_queue').update({ status: 'COMPLETED' }).eq('url', seed.url);
                    continue;
                }

                await supabase.from('seed_queue').update({ status: 'PROCESSING' }).eq('url', seed.url);

                let markdown = "";
                const jinaResponse = await relayService.call('jina', { url: seed.url });
                
                if (jinaResponse.error) {
                    onLog(`[FATAL_JINA] Seed failed. Status: FAILED`);
                    await supabase.from('seed_queue').update({ status: 'FAILED' }).eq('url', seed.url);
                    continue;
                }

                markdown = jinaResponse.text || "";
                
                if (!markdown || markdown.length < 100) {
                    onLog(`[FATAL_CONTENT] Content insufficient. Status: ERROR_CONTENT`);
                    await supabase.from('seed_queue').update({ status: 'ERROR_CONTENT' }).eq('url', seed.url);
                    continue;
                }

                onLog(`[${seed.url}] >_ NEURAL ANALYSIS...`);
                const agentData = await this.analyzeContent(markdown, seed.url, apiKey);
                
                if (!agentData) {
                    onLog(`[FATAL_GEMINI] Analysis failed. Status: FAILED`);
                    await supabase.from('seed_queue').update({ status: 'FAILED' }).eq('url', seed.url);
                    continue;
                }

                const rawAgent = {
                    id: agentData.id.substring(0, 50),
                    name: agentData.name || "Unknown Entity",
                    slogan: agentData.slogan || "Signal Detected",
                    description: agentData.description || "No analysis available.",
                    category: agentData.category || "ANALYSIS",
                    metrics: {
                        reasoning: Number(agentData.metrics?.reasoning) || 50,
                        creativity: Number(agentData.metrics?.creativity) || 50,
                        speed: Number(agentData.metrics?.speed) || 50
                    },
                    stats: {
                        wins: 0,
                        losses: 0,
                        elo: 1200
                    },
                    connectivity: {
                        try_url: seed.url,
                        iframe_safe: Boolean(agentData.connectivity?.iframe_safe)
                    },
                    // FIX: Enforce technical depth in tags
                    tags: (Array.isArray(agentData.tags) && agentData.tags.length >= 4) 
                        ? agentData.tags.map((t: string) => t.toUpperCase().replace(/\s+/g, '_')).slice(0, 8) 
                        : [agentData.category, "NEURAL_CORE", "AUTONOMOUS", "INDEXED_NODE"],
                    // FIX: Map tactical badges from pool
                    tactical_badges: (Array.isArray(agentData.tactical_badges) && agentData.tactical_badges.length > 0)
                        ? agentData.tactical_badges.map((b: string) => b.toUpperCase()).slice(0, 4)
                        : ["NEW_BORN", "UNAUDITED"],
                    pricing_model: agentData.pricing_model || "Unknown",
                    specs: agentData.specs || {}
                };

                // EDGE MESH: ZOD RUNTIME VALIDATION
                const validationResult = AgentSchema.safeParse(rawAgent);
                if (!validationResult.success) {
                    onLog(`[FATAL_ZOD] Payload rejected by Edge Mesh: ${validationResult.error.issues[0].message}`);
                    await supabase.from('seed_queue').update({ status: 'FAILED' }).eq('url', seed.url);
                    continue;
                }

                const sanitizedAgent = validationResult.data;

                const { error: insertError } = await supabase.from('agents').upsert(sanitizedAgent, { onConflict: 'id' });
                
                if (insertError) {
                    onLog(`[FATAL_DB] Write failed. Status: FAILED`);
                    await supabase.from('seed_queue').update({ status: 'FAILED' }).eq('url', seed.url);
                    continue;
                }

                await supabase.from('seed_queue').update({ status: 'COMPLETED' }).eq('url', seed.url);
                onLog(`[SUCCESS] INTEGRATED -> ${sanitizedAgent.name} (METRICS: 3/3, TAGS: ${sanitizedAgent.tags.length})`);

            } catch (e: any) {
                onLog(`[CRITICAL_ERROR] ${e.message}`);
                await supabase.from('seed_queue').update({ status: 'FAILED' }).eq('url', seed.url);
            }

            await new Promise(r => setTimeout(r, 1000));
        }
    }

    /**
     * UNIT 03: PERSONA FORGE
     */
    async forgeBatch(onLog: (msg: string) => void, batchSize: number = 5): Promise<void> {
        if (!supabase) return;
        const { data: agents } = await supabase.from('agents').select('id, name, description, entity_type, nri_score, hot_score, video_url, cover_url, display_mode, specs, pricing_model, persona_img, metrics');
        const targets = agents?.filter(a => isPlaceholder(a.persona_img)).slice(0, batchSize) || [];
        for (const agent of targets) {
            try {
                // Ensure metrics are available for forgeIdentity
                const agentWithMetrics = {
                    ...agent,
                    metrics: agent.metrics || {
                        nri_score: agent.nri_score,
                        hot_score: agent.hot_score
                    }
                };
                onLog(`[FORGE] GENERATING ASSET FOR: ${agent.name}...`);
                const newImg = await forgeIdentity(agentWithMetrics as Agent);
                if (newImg) await supabase.from('agents').update({ persona_img: newImg, video_poster: newImg }).eq('id', agent.id);
                await new Promise(r => setTimeout(r, 2000));
            } catch (e: any) {
                onLog(`[FORGE] ERROR: ${e.message}`);
            }
        }
    }

    private async analyzeContent(markdown: string, url: string, apiKey: string): Promise<any | null> {
        const schema = `{
            "id": "kebab-case-id",
            "name": "Full Display Name",
            "slogan": "Short Punchy Tagline",
            "description": "Comprehensive 2-sentence overview",
            "category": "TEXT_GEN|IMAGE_GEN|VIDEO_GEN|CODING|SECURITY|ANALYSIS",
            "metrics": { "reasoning": 0-100, "creativity": 0-100, "speed": 0-100 },
            "tags": ["SPECIFIC_TECH_1", "SPECIFIC_TECH_2", "FEATURE_X", "TARGET_STACK"],
            "tactical_badges": ["SOTA" | "0_COST" | "UNFILTERED" | "BYOK" | "LOCAL" | "ONE_CLICK" | "PROFIT_UP" | "NEURAL_TITAN" | "NEW_BORN"]
        }`;

        const prompt = `ACT AS NEURAL AUDITOR. 
        INPUT: ${markdown.substring(0, 8000)}
        
        TASK: Deep analyze this AI agent and extract core metadata.
        
        CRITICAL CONSTRAINTS:
        1. 'metrics' MUST have distinct values for reasoning, creativity, and speed based on the content.
        2. 'tags' MUST contain at least 5 technical keywords. Avoid generic words like 'AI' or 'Smart'. Use words like 'PYTHON', 'RAG', 'LATENCY_SENSITIVE', 'DIFFUSION', 'OPEN_WEIGHTS', etc.
        3. 'tactical_badges' MUST be chosen (1-4 badges) from this pool: SOTA, 0_COST, UNFILTERED, BYOK, LOCAL, ONE_CLICK, PROFIT_UP, NEURAL_TITAN, NEW_BORN.
        4. Category must be accurate.
        
        OUTPUT STRICT JSON ONLY: ${schema}`;

        let jsonStr = "";
        try {
            await relayService.chatStream({
                model: 'gemini-3-flash-preview', 
                provider: 'google', 
                apiKey: apiKey,
                system: "Output only raw JSON content.",
                user: prompt,
                onChunk: (text) => jsonStr += text,
                onError: (e) => { throw new Error(e) }
            });
            
            const start = jsonStr.indexOf('{');
            const end = jsonStr.lastIndexOf('}');
            const parsed = JSON.parse(jsonStr.substring(start, end + 1));
            return parsed;
        } catch (e: any) {
            console.error("Neural Analysis Failed:", e);
            return null;
        }
    }

    /**
     * NATIVE ANALYTICS: CEREBRO LINK
     */
    private getSessionId(): string {
        if (typeof window === 'undefined') return 'ssr-session';
        let sessionId = sessionStorage.getItem('cerebro_session_id');
        if (!sessionId) {
            sessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
            sessionStorage.setItem('cerebro_session_id', sessionId);
        }
        return sessionId;
    }

    public trackEvent(
        actionType: string, 
        targetSlug?: string | null, 
        searchQuery?: string | null, 
        isSemantic?: boolean | null, 
        provider?: string | null
    ): void {
        if (!supabase) return;
        
        const sessionId = this.getSessionId();
        
        // Fire and forget
        /*
        supabase.rpc('log_cerebro_trace', {
            session_id: sessionId,
            action_type: actionType,
            target_slug: targetSlug || null,
            search_query: searchQuery || null,
            is_semantic: isSemantic || false,
            provider: provider || null,
            url: typeof window !== 'undefined' ? window.location.pathname : '/'
        }).then(({ error }) => {
            if (error) {
                // Silently fail to avoid polluting console with telemetry errors
                console.debug('[CEREBRO] Trace failed:', error);
            }
        });
        */
    }

    async synthesizeVoiceBatch(onLog: (msg: string) => void, batchSize: number = 5): Promise<void> {
        // Logic for voice synthesis...
    }

    async runSentinelStream(onLog: (msg: string) => void): Promise<number> {
        onLog("[SENTINEL] SCANNING NEURAL LATTICE...");
        return 0;
    }

    async runSentinel(onLog: (msg: string) => void) {
        if (!supabase) return;
        onLog("[SENTINEL] HEARTBEAT_OK.");
    }
}

export const cerebroService = new CerebroService();
