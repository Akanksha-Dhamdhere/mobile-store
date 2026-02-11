const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const reportFile = path.join(root, 'scripts', 'output', 'image_report.json');
if (!fs.existsSync(reportFile)) {
  console.error('Report not found:', reportFile);
  process.exit(2);
}
const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));

const targetDir = path.join(root, 'src', 'utils');

const grouped = report.reduce((acc, r) => {
  (acc[r.file] = acc[r.file] || []).push(r);
  return acc;
}, {});

Object.keys(grouped).forEach((file) => {
  const filePath = path.join(targetDir, file);
  if (!fs.existsSync(filePath)) return;
  const bak = filePath + '.bak';
  if (!fs.existsSync(bak)) fs.copyFileSync(filePath, bak);
  let src = fs.readFileSync(filePath, 'utf8');
  grouped[file].forEach((entry) => {
    // Only modify accessoriesData.js by default to avoid changing products unless needed
    if (file !== 'accessoriesData.js') return;
    const { image, suggested, images, imagesSuggested } = entry;
    if (image && suggested && image !== suggested) {
      // replace exact quoted image value occurrences
      const esc = image.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp('(["' + "'" + '])' + esc + '\\1', 'g');
      src = src.replace(re, '"' + suggested + '"');
    }
    if (images && imagesSuggested) {
      images.forEach((img, idx) => {
        const sug = imagesSuggested[idx];
        if (!sug || img === sug) return;
        const esc2 = img.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re2 = new RegExp('(["' + "'" + '])' + esc2 + '\\1', 'g');
        src = src.replace(re2, '"' + sug + '"');
      });
    }
  });
  fs.writeFileSync(filePath, src, 'utf8');
  console.log('Updated', filePath, '(backup at', bak, ')');
});

console.log('Apply-suggestions complete.');
