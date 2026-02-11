const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const reportFile = path.join(root, 'scripts', 'output', 'image_report.json');
const uploadsDir = path.join(root, 'backend', 'uploads');
const publicImages = path.join(root, 'public', 'images');

if (!fs.existsSync(reportFile)) {
  console.error('Report not found:', reportFile);
  process.exit(2);
}
if (!fs.existsSync(publicImages)) fs.mkdirSync(publicImages, { recursive: true });

const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
const missing = report.filter(r => !r.imageExists).map(r => r.suggested).filter(Boolean).map(s => s.replace(/^\/images\//, ''));

let copied = 0;
missing.forEach((fname) => {
  const src = path.join(uploadsDir, fname);
  const altSrc = path.join(uploadsDir, fname.replace(/_/g, ' '));
  const dest = path.join(publicImages, fname);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('Copied from uploads:', fname);
    copied++;
  } else if (fs.existsSync(altSrc)) {
    fs.copyFileSync(altSrc, dest);
    console.log('Copied from uploads (alt name):', fname);
    copied++;
  }
});

console.log('Copy complete. Files copied:', copied);
