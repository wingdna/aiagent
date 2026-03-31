
import { dataService } from '../../services/dataService';
import { AGENTS_DB } from '../../agents';

export type CommandAction = 
  | { type: 'redirect'; payload: string }
  | { type: 'search'; payload: string }
  | { type: 'data'; payload: any }
  | { type: 'error'; payload: string }
  | { type: 'help'; payload: string }
  | { type: 'intel'; payload: any }
  | { type: 'find'; payload: any[] };

export const calculateMatchScore = (agent: any, query: string) => {
  const name = (agent.name || '').toLowerCase();
  const slug = (agent.slug || agent.id || '').toLowerCase();
  let score = 0;

  const isExact = name === query || slug === query;
  const isStart = name.startsWith(query) || slug.startsWith(query);
  const isInclude = name.includes(query) || slug.includes(query);

  if (isExact) score += 100;
  else if (isStart) score += 50;
  else if (isInclude) score += 10;

  // Only add NRI bonus if there's a textual match
  if (score > 0) {
    const nri = agent.metrics?.nri_score || agent.nri_score || 0;
    score += nri * 0.5;
  }

  return score;
};

export const searchAgents = (query: string, limit: number = 15) => {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return AGENTS_DB
    .map(agent => ({ agent, score: calculateMatchScore(agent, q) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.agent);
};

const findBestAgentMatch = (query: string) => {
  const matches = searchAgents(query, 1);
  return matches.length > 0 ? matches[0] : null;
};

export const executeCommand = async (cmd: string): Promise<CommandAction> => {
  const trimmed = cmd.trim();
  
  // /help
  if (trimmed.toLowerCase() === '/help') {
    return {
      type: 'help',
      payload: [
        '/search <query> - Trigger neural search',
        '/go <slug> - Navigate to agent detail page',
        '/intel <slug> - Terminal intel preview',
        '/find [args] - Parameterized filter (--free, --local, --top)',
        '/lounge <slug> - Enter agent lounge',
        '/metrics <slug> - Get agent NRI metrics JSON',
        '/help - Show this manual'
      ].join('\n')
    };
  }

  // /search <query>
  const searchMatch = trimmed.match(/^\/search\s+(.*)/i);
  if (searchMatch) {
    return { type: 'search', payload: searchMatch[1].trim() };
  }

  // /go <slug>
  const goMatch = trimmed.match(/^\/go\s+(.+)/i);
  if (goMatch) {
    const query = goMatch[1].trim().toLowerCase();
    const bestMatch = findBestAgentMatch(query);

    if (bestMatch) {
        return { type: 'redirect', payload: `/agent/${bestMatch.id}` };
    } else {
        // Fallback to exactly what they typed if no match found
        return { type: 'redirect', payload: `/agent/${query.replace(/[^a-z0-9-]/g, '')}` };
    }
  }

  // /intel <slug>
  const intelMatch = trimmed.match(/^\/intel\s+(.+)/i);
  if (intelMatch) {
    const query = intelMatch[1].trim().toLowerCase();
    const bestMatch = findBestAgentMatch(query);
    const targetId = bestMatch ? bestMatch.id : query.replace(/[^a-z0-9-]/g, '');

    try {
      const agent = await dataService.getAgentById(targetId);
      if (agent) {
        return { type: 'intel', payload: agent };
      }
      return { type: 'error', payload: `Agent [${targetId}] not found.` };
    } catch (e) {
      return { type: 'error', payload: `Failed to fetch intel for [${targetId}].` };
    }
  }

  // /find [args]
  const findMatch = trimmed.match(/^\/find\s+(.*)/i);
  if (findMatch) {
    try {
      const args = findMatch[1].split(' ').map(s => s.trim()).filter(Boolean);
      // Fetch all agents (or a large chunk) to filter locally as requested
      const allAgents = AGENTS_DB || [];
      
      let filtered = allAgents;
      
      if (args.includes('--free')) {
        filtered = filtered.filter(a => (a.pricing?.model || '').toLowerCase() === 'free' || a.pricing?.price === 0 || a.pricing?.price === '0' || a.pricing?.isOSS);
      }
      if (args.includes('--local')) {
        filtered = filtered.filter(a => (a.tactical_badges || []).includes('LOCAL') || (a.tags || []).includes('Local') || (a.tags || []).includes('local'));
      }
      if (args.includes('--top')) {
        filtered = filtered.filter(a => (a.nri_score || a.metrics?.nri_score || 0) > 90);
      }
      
      return { type: 'find', payload: filtered.slice(0, 10) }; // Return top 10 matches
    } catch (e) {
      return { type: 'error', payload: `Failed to execute find command.` };
    }
  }

  // /lounge <slug>
  const loungeMatch = trimmed.match(/^\/lounge\s+(.+)/i);
  if (loungeMatch) {
    const query = loungeMatch[1].trim().toLowerCase();
    const bestMatch = findBestAgentMatch(query);
    const targetId = bestMatch ? bestMatch.id : query.replace(/[^a-z0-9-]/g, '');
    return { type: 'redirect', payload: `/agent/${targetId}/lounge` };
  }

  // /metrics <slug>
  const metricsMatch = trimmed.match(/^\/metrics\s+(.+)/i);
  if (metricsMatch) {
    const query = metricsMatch[1].trim().toLowerCase();
    const bestMatch = findBestAgentMatch(query);
    const targetId = bestMatch ? bestMatch.id : query.replace(/[^a-z0-9-]/g, '');

    try {
      const agent = await dataService.getAgentById(targetId);
      if (agent) {
        return { type: 'data', payload: agent.metrics || { nri_score: agent.nri_score } };
      }
      return { type: 'error', payload: `Agent [${targetId}] not found.` };
    } catch (e) {
      return { type: 'error', payload: `Failed to fetch metrics for [${targetId}].` };
    }
  }

  return { type: 'error', payload: `Unknown command: ${trimmed}. Type /help for assistance.` };
};
