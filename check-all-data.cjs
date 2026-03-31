const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://kumviyxbodfktoamgazw.supabase.co';
const supabaseKey = 'sb_publishable_gp2I7s0aQDXmEYpP_s1eLQ_2gNKv-OI';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecificAgent(slug) {
  console.log(`\n--- Checking Agent: ${slug} ---`);
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('id, slug, name')
    .eq('slug', slug)
    .single();
  
  if (agentError) {
    console.error('Agent Error:', agentError);
    return;
  }
  console.log('Agent:', agent);

  const { data: reviews } = await supabase
    .from('agent_reviews')
    .select('id, agent_id_link, title')
    .or(`agent_id_link.eq.${agent.id},agent_id_link.eq.${agent.slug}`);
  console.log('Reviews:', reviews);

  const { data: intel } = await supabase
    .from('agent_intel')
    .select('id, agent_id_link, agent_slug, title')
    .or(`agent_id_link.eq.${agent.id},agent_slug.eq.${agent.slug},agent_id_link.eq.${agent.slug}`);
  console.log('Intel:', intel);
}

async function run() {
  const { data: reviews } = await supabase
    .from('agent_reviews')
    .select('agent_id_link, title');
  
  console.log('Total reviews:', reviews?.length);
  console.log('Reviews:', reviews);
}

run();
