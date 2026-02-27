
import { Agent } from '../types';
import { supabase } from '../lib/supabase';
import { relayService } from './relayService';

/**
 * CEREBRO ANALYTICS ENGINE (V31.0)
 * Responsible for the "Neural Census" - calculating global reputation scores.
 */
export class AnalyticsEngine {

    /**
     * ACTION 1: SYNC_EXTERNAL_DATA
     * Crawls GitHub and Web for signal triangulation.
     */
    async syncExternalData(agents: Agent[], onLog: (msg: string) => void): Promise<void> {
        if (!supabase) return;

        onLog("[CEREBRO] INITIALIZING EXTERNAL SIGNAL TRIANGULATION...");
        let updatedCount = 0;

        for (const agent of agents) {
            let stars = agent.external_stats?.github_stars || 0;
            let mentions = agent.external_stats?.web_mentions || 0;
            let changed = false;

            // 1. GitHub Signal
            if (agent.connectivity.try_url.includes('github.com')) {
                const repoPath = agent.connectivity.try_url.replace('https://github.com/', '').replace(/\/$/, '');
                try {
                    const res = await fetch(`https://api.github.com/repos/${repoPath}`);
                    if (res.ok) {
                        const data = await res.json() as any;
                        if (data.stargazers_count !== stars) {
                            stars = data.stargazers_count;
                            changed = true;
                            onLog(`[GITHUB] ${agent.name}: ${stars} STARS DETECTED.`);
                        }
                    }
                } catch (e) {
                    console.warn(`GitHub fetch failed for ${agent.name}`);
                }
            }

            // 2. Web Hype Signal (Proxy via Jina)
            // We search for "Agent Name reviews" or similar to gauge footprint
            // Since we don't have a Google Search API key for everyone, we use Jina to read a search result page if possible,
            // OR simply randomize a "crawl" based on connectivity if strictly no search is avail.
            // As per instruction: "Use relayService('jina') to search"
            // Note: Jina Reader works best on specific URLs. We will try to fetch a HackerNews or Reddit search URL.
            try {
                const query = encodeURIComponent(`${agent.name} AI`);
                const searchUrl = `https://www.bing.com/search?q=${query}`; 
                // Using Bing as it renders cleaner HTML for Jina usually than Google
                
                const jinaRes = await relayService.call('jina', { url: searchUrl });
                if (!jinaRes.error && jinaRes.text) {
                    // Simple Heuristic: Count occurrence of agent name in search results
                    const regex = new RegExp(agent.name, 'gi');
                    const count = (jinaRes.text.match(regex) || []).length;
                    // Normalize: A count of 20+ on page 1 is high. 
                    // We map this to a "Mention Score" roughly.
                    const newMentions = Math.min(1000, count * 50); // Arbitrary scaling
                    if (Math.abs(newMentions - mentions) > 50) {
                        mentions = newMentions;
                        changed = true;
                        onLog(`[WEB] ${agent.name}: SIGNAL STRENGTH ${mentions}`);
                    }
                }
            } catch (e) {
                // Silent fail
            }

            // 3. Commit
            if (changed || !agent.external_stats) {
                const updates = {
                    github_stars: stars,
                    web_mentions: mentions,
                    last_crawled: new Date().toISOString()
                };
                
                await supabase.from('agents').update({ external_stats: updates }).eq('id', agent.id);
                updatedCount++;
            }
            
            // Rate limit protection
            await new Promise(r => setTimeout(r, 500));
        }
        
        onLog(`[CEREBRO] SYNC COMPLETE. UPDATED ${updatedCount} ENTITIES.`);
    }

    /**
     * ACTION 2: COMPUTE_NRI_SCORES
     * Formula: (ELO * 0.3) + (Log10(Stars) * 15) + (Mentions * 0.5) + (InternalHype)
     */
    async computeNRIScores(agents: Agent[], onLog: (msg: string) => void): Promise<void> {
        if (!supabase) return;
        onLog("[CEREBRO] COMPUTING NEURAL REPUTATION INDEX (NRI)...");

        for (const agent of agents) {
            const elo = agent.stats?.elo || 1200;
            const stars = agent.external_stats?.github_stars || 0;
            const mentions = agent.external_stats?.web_mentions || 0;
            const likes = agent.stats?.likes || (agent.stats?.wins || 0) / 5; // Fallback if no likes

            // Weighted Algorithm
            const w_elo = elo * 0.3; // 1200 -> 360
            const w_stars = Math.log10(Math.max(1, stars)) * 15; // 1000 stars -> 3 * 15 = 45
            const w_mentions = Math.min(200, mentions * 0.2); // Cap at 200 points
            const w_hype = Math.min(300, likes * 5); // Internal popularity

            const nri = parseFloat((w_elo + w_stars + w_mentions + w_hype).toFixed(2));

            await supabase.from('agents').update({ nri_score: nri }).eq('id', agent.id);
        }
        
        onLog("[CEREBRO] NRI RECALCULATION SUCCESSFUL.");
    }

    /**
     * ACTION 3: PUBLISH_SNAPSHOT
     * Freezes current standings into history.
     */
    async publishSnapshot(type: 'WEEKLY' | 'MONTHLY', onLog: (msg: string) => void): Promise<void> {
        if (!supabase) return;
        
        // 1. Get Top 100 sorted by NRI
        const { data: agents } = await supabase
            .from('agents')
            .select('id, name, category, nri_score, stats')
            .order('nri_score', { ascending: false })
            .limit(100);

        if (!agents) {
            onLog("[ERROR] FAILED TO FETCH AGENT DATA.");
            return;
        }

        // 2. Insert Snapshot
        const payload = {
            type,
            data: agents,
            created_at: new Date().toISOString()
        };

        const { error } = await supabase.from('rankings_snapshot').insert(payload);

        if (error) {
            onLog(`[ERROR] SNAPSHOT FAILED: ${error.message}`);
        } else {
            onLog(`[SUCCESS] PUBLISHED ${type} SNAPSHOT (${agents.length} ITEMS).`);
        }
    }

    /**
     * Helper to get comparison data
     */
    async getPreviousSnapshot(): Promise<Record<string, number>> {
        if (!supabase) return {};
        
        // Get the latest snapshot before today (simplified)
        const { data } = await supabase
            .from('rankings_snapshot')
            .select('data')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!data || !data.data) return {};

        // Build Map: ID -> Rank
        const rankMap: Record<string, number> = {};
        (data.data as any[]).forEach((item, index) => {
            rankMap[item.id] = index + 1;
        });
        
        return rankMap;
    }
}

export const analyticsEngine = new AnalyticsEngine();
