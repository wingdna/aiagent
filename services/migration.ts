
import { AGENTS_DB } from '../agents';
import { supabase } from '../lib/supabase';

/**
 * Executes a batch Upsert to synchronize local AGENTS_DB with Supabase.
 * Can be triggered via UI or Console.
 */
export async function migrateAgentsToSupabase() {
    
    // 1. Validation Check
    if (!supabase) {
        console.error("❌ [MIGRATION] Credentials missing or invalid config.");
        alert("System Error: Supabase connection not established.");
        return;
    }

    try {
        const { data, error } = await supabase
            .from('agents')
            .upsert(AGENTS_DB, { onConflict: 'id' })
            .select('id, name');

        if (error) {
            console.error("❌ [MIGRATION] Protocol Failure:", error.message);
            console.error("   Details:", error);
            alert(`Migration Failed: ${error.message}\nCheck console for details.`);
        } else {
            console.table(data?.map(a => ({ id: a.id, name: a.name, status: 'SYNCED' })));
            alert(`✅ SUCCESS: Synced ${data?.length} agents to Core Database.`);
        }
    } catch (e: any) {
        console.error("❌ [MIGRATION] Critical Error:", e);
        alert(`Critical Error: ${e.message}`);
    }
}

/**
 * Targeted update for Visual Assets only (Persona Img).
 * Useful for Art Directors to push new visuals without resetting stats.
 */
export async function updatePersonasInSupabase() {
    if (!supabase) return;

    let successCount = 0;
    
    for (const agent of AGENTS_DB) {
        if (agent.persona_img) {
            const { error } = await supabase
                .from('agents')
                .update({ persona_img: agent.persona_img })
                .eq('id', agent.id);
            
            if (error) {
                console.error(`❌ Failed to update ${agent.name}:`, error.message);
            } else {
                successCount++;
            }
        }
    }
    
    alert(`🎨 Visual Injection Complete: ${successCount} assets updated.`);
}
