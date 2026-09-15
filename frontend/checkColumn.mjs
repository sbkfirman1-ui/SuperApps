import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lotehbdddaprnyatdscl.supabase.co';
const supabaseKey = 'sb_publishable_SWBQMcy2tRON0xZ_8IewgA_rPW6H1Ia';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCatatan() {
  const { data, error } = await supabase.from('transactions').select('catatan').limit(1);
  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Success! Column exists. Data:", data);
  }
}

checkCatatan();
