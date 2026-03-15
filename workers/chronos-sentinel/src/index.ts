
/**
 * 🛑 ARCHITECTURAL BARRIER: IRON SHIELD PROTOCOL 🛑
 * THIS IS A BACKGROUND WORKER (CHRONOS ENGINE).
 * IT HAS NO UI COMPONENTS.
 * DO NOT MODIFY THIS FILE WHEN WORKING ON FRONTEND TASKS.
 * ANY CHANGE HERE REQUIRES EXPLICIT AUTHORIZATION "V16.2".
 */

// Fix for missing Cloudflare Worker types in this context
interface ScheduledEvent {
  cron: string;
  type: string;
  scheduledTime: number;
}

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  OPENAI_API_KEY: string;
  CRON_SECRET: string; // V21.0: Added for manual trigger security
}

interface AgentUpdate {
  name: string;
  version: string;
  release_date: string;
  context_window: string;
  change_summary: string;
}

const TARGET_FEEDS = [
  "https://openai.com/news/rss.xml",
  "https://blog.google/products/gemini/rss/",
  "https://anthropic.com/feed.xml"
];

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runEvolutionCycle(env, 'SCHEDULED'));
  },

  // ⚡ Protocol V21.0: Manual Override Trigger
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    // Security: Simple secret query param to prevent public abuse
    if (url.searchParams.get('key') !== env.CRON_SECRET) {
      return new Response('Unauthorized: Invalid Key', { status: 401 });
    }

    try {
      const report = await runEvolutionCycle(env, 'MANUAL_TRIGGER');
      return new Response(JSON.stringify(report, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err: any) {
      return new Response(`Error: ${err.message}`, { status: 500 });
    }
  }
};

async function runEvolutionCycle(env: Env, triggerSource: string) {
  await logSystemEvent(env, "CHRONOS_WAKE", `Sentinel cycle initiated via ${triggerSource}.`);

  const report = {
    source: triggerSource,
    timestamp: new Date().toISOString(),
    feeds_scanned: 0,
    updates_found: 0,
    details: [] as string[]
  };

  try {
    // 1. Harvest Intelligence
    const rawIntel = await fetchFeeds();
    report.feeds_scanned = TARGET_FEEDS.length;
    
    // 2. Alchemize (LLM Extraction)
    const updates = await extractSpecs(env, rawIntel);
    
    // 3. Atomic Sync
    if (updates.length > 0) {
      await syncToCore(env, updates);
      report.updates_found = updates.length;
      report.details = updates.map(u => `Upgraded ${u.name} to v${u.version}`);
    } else {
      await logSystemEvent(env, "CHRONOS_SLEEP", "No version deviations detected.");
      report.details.push("No updates detected.");
    }

    return report;

  } catch (error: any) {
    await logSystemEvent(env, "CHRONOS_FAILURE", error.message || "Unknown Error");
    console.error(`[CHRONOS_CRITICAL] ${error.message}`);
    throw error;
  }
}

async function fetchFeeds(): Promise<string> {
  let combinedText = "";
  // Simplified fetch logic for demonstration. Real implementation would parse XML.
  for (const url of TARGET_FEEDS) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      // Rudimentary cleanup to reduce token usage
      const clean = text.substring(0, 5000).replace(/<[^>]*>?/gm, ''); 
      combinedText += `\n--- SOURCE: ${url} ---\n${clean}`;
    } catch (e) {
      console.warn(`Feed failed: ${url}`);
    }
  }
  return combinedText;
}

async function extractSpecs(env: Env, context: string): Promise<AgentUpdate[]> {
  // 🧠 Protocol V21.0: Logic Calibration
  // Enforced rules to prevent "LOCAL" tag hallucinations on SaaS models.
  const prompt = `
    SYSTEM: You are a rigid technical auditor.
    
    CONTEXT:
    ${context}

    TASK:
    Identify latest model versions (e.g., GPT-5, Gemini 3.0, Claude 4) mentioned in the text.
    
    HARD RULES (Logic Calibration):
    Rule 1: If the provider is Google, OpenAI, Anthropic, or Perplexity -> deployment_type MUST be 'SaaS'. tags CANNOT include 'LOCAL', 'BYOK', '1-CLK'.
    Rule 2: If the provider is Meta (Llama), Mistral, Qwen -> deployment_type can be 'Open Weight'.
    
    EXTRACT:
    1. Agent Name (Standardize to: 'GPT-4 Omni', 'Gemini Pro', etc.)
    2. Version Number
    3. Context Window (e.g., '128k', '1M')
    4. Release Date
    5. One sentence summary of changes.

    OUTPUT: JSON Array only. No markdown.
    Example: [{"name": "GPT-4", "version": "4.5", "context_window": "256k", "release_date": "2024-10-01", "change_summary": "Improved reasoning."}]
  `;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1
    })
  });

  if (!response.ok) throw new Error(`LLM Gateway 500: ${response.statusText}`);
  
  const data: any = await response.json();
  const rawContent = data.choices[0].message.content;
  
  try {
    // Sanitize and parse
    const jsonStr = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("LLM Output Parse Error", rawContent);
    return [];
  }
}

async function syncToCore(env: Env, updates: AgentUpdate[]) {
  for (const update of updates) {
    // 1. Check existing version via Supabase REST
    // Note: This requires 'agents' table to have a 'version' column or similar metadata field.
    // For V16.2, we assume 'specs->version' JSON path or similar pattern.
    
    // We update the 'specs' JSONB column
    const { error } = await fetch(`${env.SUPABASE_URL}/rest/v1/agents?name=ilike.*${encodeURIComponent(update.name.split(' ')[0])}*`, {
      method: "PATCH",
      headers: {
        "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        description: `[AUTO-UPDATED ${update.release_date}] ${update.change_summary} (Ver: ${update.version})`,
        specs: {
          version: update.version,
          context_window: update.context_window,
          last_updated: new Date().toISOString()
        }
      })
    }).then(r => r.json()) as any;

    if (!error) {
      await logSystemEvent(env, "CHRONOS_EVOLUTION", `Upgraded ${update.name} to v${update.version}`);
    }
  }
}

async function logSystemEvent(env: Env, type: string, message: string) {
  // Logs to a 'system_logs' table in Supabase
  await fetch(`${env.SUPABASE_URL}/rest/v1/lounge_announcements`, {
    method: "POST",
    headers: {
      "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      type: "SYSTEM_ALERT",
      content: `[${type}] ${message}`
    })
  }).catch(e => console.error("Logging failed", e));
}
