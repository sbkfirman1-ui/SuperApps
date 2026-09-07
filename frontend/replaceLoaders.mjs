import fs from 'fs';
import path from 'path';

const dir = './src/pages';
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (file.endsWith('.jsx')) {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    let changed = false;

    if (content.includes('Memuat data') || content.includes('Memuat Price Book')) {
      // Import Loader if not already imported
      if (!content.includes("import Loader from '../components/Loader';")) {
        content = content.replace(/(import React.*?;\n)/, "$1import Loader from '../components/Loader';\n");
        changed = true;
      }
      
      // Replace loading texts
      content = content.replace(/<tr>\s*<td.*?Memuat.*?<\/td>\s*<\/tr>/g, (match) => {
        // extract colSpan
        const colSpanMatch = match.match(/colSpan="(\d+)"/);
        const colSpan = colSpanMatch ? colSpanMatch[1] : "1";
        // extract the exact text
        const textMatch = match.match(/>([^<]*Memuat[^<]*)<\/td>/);
        const text = textMatch ? textMatch[1].trim() : "Memuat data...";
        
        return `<tr><td colSpan="${colSpan}" style={{ padding: 0 }}><Loader text="${text.replace('⏳ ', '')}" /></td></tr>`;
      });
      
      // Replace div loading texts
      content = content.replace(/<div[^>]*>\s*⏳\s*Memuat[^<]*<\/div>/g, (match) => {
        const textMatch = match.match(/⏳\s*(Memuat[^<]*)/);
        const text = textMatch ? textMatch[1].trim() : "Memuat data...";
        return `<Loader text="${text}" />`;
      });
      
      // Check for <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Memuat data...</div> in PnlReport
      content = content.replace(/<div[^>]*>\s*Memuat data\.\.\.\s*<\/div>/g, (match) => {
        return `<Loader text="Memuat data..." />`;
      });

      if (changed) {
        fs.writeFileSync(path.join(dir, file), content);
        console.log(`Updated ${file}`);
      }
    }
  }
});
