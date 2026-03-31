import { createClient } from '@supabase/supabase-js';

export const onRequest = async (context: any) => {
  try {
    const supabaseUrl = context.env.SUPABASE_URL || '';
    const supabaseKey = context.env.SUPABASE_SERVICE_ROLE_KEY || context.env.SUPABASE_ANON_KEY || ''; // Use service role for updates
    
    if (!supabaseUrl) {
      return new Response(JSON.stringify({ error: 'Supabase URL not configured' }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch Top 500 Agents
    const { data: agents, error } = await supabase
      .from('agents')
      .select('id, try_url')
      .order('hot_score', { ascending: false })
      .limit(500);

    if (error) throw error;

    const updates = [];

    // 2. Probe Agents
    for (const agent of agents) {
      if (!agent.try_url) continue;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(agent.try_url, {
          method: 'HEAD',
          signal: controller.signal,
          headers: { 'User-Agent': 'YouAgent-Pulse-Monitor/1.0' }
        });

        clearTimeout(timeoutId);

        const status = response.ok ? 'online' : 'offline';
        updates.push({ id: agent.id, status, last_checked: new Date().toISOString() });
      } catch (e) {
        updates.push({ id: agent.id, status: 'offline', last_checked: new Date().toISOString() });
      }
    }

    // 3. Bulk Update (Simulated via loop for now, ideally use upsert)
    for (const update of updates) {
      await supabase
        .from('agents')
        .update({ status: update.status, last_checked: update.last_checked })
        .eq('id', update.id);
    }

    return new Response(JSON.stringify({ success: true, checked: updates.length }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
