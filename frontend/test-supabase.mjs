import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://lotehbdddaprnyatdscl.supabase.co';
const supabaseKey = 'your_supabase_key_here';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('hpp_bahan_baku').select('*').limit(1);
  console.log("Data:", data);
  console.log("Error:", error);
}
test();
