import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lotehbdddaprnyatdscl.supabase.co';
const supabaseKey = 'sb_publishable_SWBQMcy2tRON0xZ_8IewgA_rPW6H1Ia';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategory() {
  const { data, error } = await supabase.from('hpp_packages').insert([{
    category: 'Add-on Wedding',
    name: 'Test Add-on',
    hargaJual: 100000
  }]).select();

  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Success! Data:", data);
    // Cleanup
    await supabase.from('hpp_packages').delete().eq('id', data[0].id);
  }
}

checkCategory();
