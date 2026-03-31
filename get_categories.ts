import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('agents').select('category');
  if (error) console.error(error);
  else {
    const categories = Array.from(new Set(data.map(d => d.category).filter(Boolean)));
    console.log(categories);
  }
}
main();
