import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lotehbdddaprnyatdscl.supabase.co';
const supabaseKey = 'sb_publishable_SWBQMcy2tRON0xZ_8IewgA_rPW6H1Ia';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getCategories() {
  const { data, error } = await supabase.from('finance').select('kategoriFinance, jenis');
  if (error) {
    console.error("Error:", error);
    return;
  }
  const uniqueCats = [...new Set(data.map(d => `${d.kategoriFinance} (${d.jenis})`))];
  console.log("Categories in DB:");
  uniqueCats.forEach(c => console.log(c));
}

getCategories();
