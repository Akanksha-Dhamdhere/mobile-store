const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const uploads = path.join(root, 'backend', 'uploads');
const dest = path.join(root, 'public', 'images');
if (!fs.existsSync(uploads)) { console.error('uploads dir not found'); process.exit(1); }
if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

const files = fs.readdirSync(uploads);
let count = 0;
files.forEach(f => {
  const src = path.join(uploads, f);
  const d1 = path.join(dest, f);
  try {
    fs.copyFileSync(src, d1);
    count++;
  } catch(e) {}
  // also create underscore variant
  const underscored = f.replace(/\s+/g, '_');
  if (underscored !== f) {
    const d2 = path.join(dest, underscored);
    try { fs.copyFileSync(src, d2); } catch(e) {}
  }
});
console.log('Copied', count, 'files from uploads to public/images (plus underscored variants).');
