import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL="([^"]+)"/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/);

const supabaseUrl = urlMatch[1];
const supabaseKey = keyMatch[1];
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  // To check RLS, we can try inserting anonymously, but wait, we already did that!
  // Our seed script used VITE_SUPABASE_ANON_KEY and inserted successfully.
  // Wait, does the seed script use a Service Role Key?
  // Let's check what the anon key actually is. If it's a service role key, it bypasses RLS.
  console.log("Key length:", supabaseKey.length);
  console.log("Starts with:", supabaseKey.substring(0, 10));
}

checkRLS();
