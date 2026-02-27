import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://kumviyxbodfktoamgazw.supabase.co';
const supabaseKey = 'sb_publishable_gp2I7s0aQDXmEYpP_s1eLQ_2gNKv-OI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('agents').select('*').limit(1);
  console.log("Columns:", Object.keys(data?.[0] || {}));
}
check();
