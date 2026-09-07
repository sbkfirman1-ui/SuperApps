import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read from .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL="([^"]+)"/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/);

const supabaseUrl = urlMatch[1];
const supabaseKey = keyMatch[1];
const supabase = createClient(supabaseUrl, supabaseKey);

const RAW = [
  { name: "12RP + Frame", unit: 1, price: 130000 },
  { name: "16RP + Frame", unit: 1, price: 200000 },
  { name: "4RP + Frame 4 pcs", unit: 4, price: 170000 },
  { name: "4RP + Frame 1 pcs", unit: 1, price: 40000 },
  { name: "4RP + Frame 2 pcs", unit: 2, price: 80000 },
  { name: "5RP + Frame 4 pcs", unit: 4, price: 190000 },
  { name: "Album 2 Roll", unit: 1, price: 300000 },
  { name: "Album Magazine 2 susun", unit: 1, price: 1250000 },
  { name: "Album Magazine Ekslusif", unit: 1, price: 650000 },
  { name: "Album Magazine Koper", unit: 1, price: 450000 },
  { name: "Biaya Busana MUA Prewed (Studio)", unit: 1, price: 150000 },
  { name: "Biaya Makeup MUA LB (Studio)", unit: 1, price: 150000 },
  { name: "Biaya Makeup MUA Prewed (Studio)", unit: 1, price: 300000 },
  { name: "Biaya Operasional", unit: 30, price: 10000 },
  { name: "Biaya Sewa Studio", unit: 30, price: 10000 },
  { name: "Cetakan LB (Studio)", unit: 1, price: 12000 },
  { name: "Cost Admin WA", unit: 1, price: 4500 },
  { name: "Cost Admin Cetak", unit: 1, price: 10000 },
  { "name": "Cost Sosmed instagram", "unit": 1, "price": 4500 },
  { "name": "Cost Sosmed Studio", "unit": 1, "price": 4500 },
  { "name": "Cost Admin Tiktok", "unit": 1, "price": 4500 },
  { name: "Edit Layout 2 Roll", unit: 1, price: 45000 },
  { name: "Edit Layout LB (Studio)", unit: 1, price: 7000 },
  { name: "Edit Layout Magazine", unit: 1, price: 90000 },
  { name: "Edit LR Studio LB (Studio)", unit: 1, price: 18000 },
  { name: "Edit LR Studio Prewed (Studio)", unit: 1, price: 40000 },
  { name: "Edit LR Wedding", unit: 1, price: 75000 },
  { name: "Edit VG Cinematic", unit: 1, price: 150000 },
  { name: "Edit VG Teaser", unit: 1, price: 50000 },
  { name: "Edit VG Full", unit: 1, price: 150000 },
  { name: "Fee Management", unit: 30, price: 10000 },
  { name: "Fee Management (Studio)", unit: 30, price: 10000 },
  { name: "FG LB (Studio)", unit: 1, price: 25000 },
  { name: "FG Studio Prewed (Studio)", unit: 1, price: 50000 },
  { name: "FG Wedding", unit: 1, price: 150000 },
  { name: "Flashdisk", unit: 1, price: 50000 },
  { name: "Kamera Studio LB (Studio)", unit: 1, price: 20000 },
  { name: "Kamera Studio PR (Studio)", "unit": 1, "price": 50000 },
  { name: "Kamera Wedding", unit: 2, price: 300000 },
  { name: "Komputer", unit: 2, price: 20000 },
  { name: "Lighting Studio (Studio)", unit: 2, price: 1000 },
  { name: "Lighting Wedding", "unit": 2, "price": 5000 },
  { name: "Listrik", unit: 30, price: 10000 },
  { name: "Maintenance", unit: 30, price: 10000 },
  { name: "Undangan Web", unit: 1, price: 60000 },
  { name: "VG Cinematic", unit: 1, price: 150000 },
  { name: "VG Full", unit: 1, price: 150000 },
  { name: "Wifi", unit: 30, price: 5000 },
  { name: "Wedding Content Creator", unit: 1, price: 300000 },
  { name: "Assisten FG Wedding", unit: 1, price: 50000 },
  { name: "Video Latar Biru (Studio)", unit: 1, price: 10000 },
  { name: "Biaya Busana Laki Studio (Studio)", unit: 1, price: 300000 }
];

async function run() {
  console.log("Menghapus data bahan baku yang lama agar tidak duplikat...");
  await supabase.from('hpp_bahan_baku').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // delete all

  const dataToInsert = RAW.map(item => ({
    name: item.name,
    unit: item.unit,
    price: item.price,
    category: item.name.toLowerCase().includes('studio') ? 'Studio' : 'Wedding'
  }));

  console.log("Memasukkan 52 data baru ke database Supabase...");
  const { data, error } = await supabase.from('hpp_bahan_baku').insert(dataToInsert);

  if (error) {
    console.error("Error inserting data:", error);
  } else {
    console.log("Berhasil memasukkan data bahan baku!");
  }
}

run();
