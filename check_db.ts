import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://kumviyxbodfktoamgazw.supabase.co';
const supabaseKey = 'sb_publishable_gp2I7s0aQDXmEYpP_s1eLQ_2gNKv-OI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error, count } = await supabase.from('agents').select('*', { count: 'exact', head: true });
  console.log("Count:", count);
  console.log("Error:", error);
  
  const { data: items } = await supabase.from('agents').select('id').limit(20);
  console.log("Items:", items?.length);
}
check();
