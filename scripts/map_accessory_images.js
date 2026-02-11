const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const accFile = path.join(root, 'src', 'utils', 'accessoriesData.js');
const publicImages = path.join(root, 'public', 'images');

if (!fs.existsSync(accFile)) { console.error('accessoriesData.js not found'); process.exit(1); }
const imgFiles = fs.readdirSync(publicImages).map(f => f.toLowerCase());

let src = fs.readFileSync(accFile, 'utf8');

// crude parse: find image: "/images/accessory_noid_xxx.jpg"
const re = /image:\s*(["'`])\/images\/(accessory_noid_[^"'`\n]+)\1/g;
let changed = 0;
src = src.replace(re, (m, q, name) => {
  // try match by keywords
  const keywords = name.replace(/^accessory_noid_/, '').split('_').filter(Boolean);
  // also try keywords from surrounding 'name' property by finding the object chunk
  const idx = m ? src.indexOf(m) : -1;
  // find candidate
  let candidate = null;
  // try brand or keywords
  for (const f of imgFiles) {
    for (const k of keywords) {
      if (f.includes(k)) { candidate = f; break; }
    }
    if (candidate) break;
  }
  if (!candidate) {
    // fallback: pick any image that contains 'accessory' or 'phone' - skip
    return m;
  }
  changed++;
  return `image: "\/images\/${candidate}"`;
});

if (changed > 0) {
  const bak = accFile + '.map.bak';
  if (!fs.existsSync(bak)) fs.copyFileSync(accFile, bak);
  fs.writeFileSync(accFile, src, 'utf8');
  console.log('Mapped', changed, 'accessory images. Backup at', bak);
} else {
  console.log('No accessory mappings applied.');
}
