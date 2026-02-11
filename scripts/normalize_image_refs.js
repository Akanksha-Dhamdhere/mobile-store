const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const utilsDir = path.join(root, 'src', 'utils');
const publicImages = path.join(root, 'public', 'images');

function safeFilename(name) {
  return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\.\-]/g, '');
}

function processFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  const regex = /(["'`])\/(?:images)\/([^"'`\n]+?)\1/g;
  const replacements = [];
  src = src.replace(regex, (m, q, filename) => {
    const safe = safeFilename(filename);
    if (safe !== filename) replacements.push({ old: filename, safe });
    return q + '/images/' + safe + q;
  });
  if (replacements.length > 0) {
    const bak = filePath + '.norm.bak';
    if (!fs.existsSync(bak)) fs.copyFileSync(filePath, bak);
    fs.writeFileSync(filePath, src, 'utf8');
    console.log('Updated', path.basename(filePath), 'replaced', replacements.length, 'filenames. Backup at', bak);
    // rename existing files in public/images if present
    replacements.forEach(({ old, safe }) => {
      const oldPath = path.join(publicImages, old);
      const newPath = path.join(publicImages, safe);
      try {
        if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
          fs.renameSync(oldPath, newPath);
          console.log('Renamed', old, '->', safe);
        }
      } catch (e) {
        console.warn('Could not rename', old, e.message);
      }
    });
  } else {
    console.log('No changes needed for', path.basename(filePath));
  }
}

['productsData.js','accessoriesData.js'].forEach((f) => {
  const p = path.join(utilsDir, f);
  if (fs.existsSync(p)) processFile(p);
});

console.log('Normalization complete.');
