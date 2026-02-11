const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const publicImagesDir = path.join(root, 'public', 'images');

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach((f) => {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, filelist);
    else filelist.push(full);
  });
  return filelist;
}

function collectImageRefs() {
  const exts = ['.js', '.jsx', '.ts', '.tsx', '.json', '.css'];
  const files = walk(srcDir).filter((f) => exts.includes(path.extname(f).toLowerCase()));
  // match '/images/...' or "images/..." only when preceded by a quote or start of token
  const regex = /(?:(?:['"`])\/(?:images)\/|(?:['"`])(?:images)\/)([A-Za-z0-9_\-\/\.]+?\.(?:png|jpg|jpeg|gif|webp|svg))/gi;
  const refs = new Set();
  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    let m;
    while ((m = regex.exec(content)) !== null) refs.add(m[1]);
  });
  return Array.from(refs);
}

function checkImages(refs) {
  const missing = [];
  refs.forEach((rel) => {
    const imgPath = path.join(publicImagesDir, rel);
    if (!fs.existsSync(imgPath)) missing.push(rel);
  });
  return missing;
}

function main() {
  if (!fs.existsSync(publicImagesDir)) {
    console.error('public/images directory not found at', publicImagesDir);
    process.exit(2);
  }

  const refs = collectImageRefs();
  if (refs.length === 0) {
    console.log('No /images/ references found in src.');
    process.exit(0);
  }

  console.log('Found', refs.length, 'referenced image paths (relative to public/images). Checking...');
  const missing = checkImages(refs);
  if (missing.length === 0) {
    console.log('All referenced images are present in public/images.');
    process.exit(0);
  }

  console.error('Missing images (' + missing.length + '):');
  missing.forEach((m) => console.error('-', m));
  process.exit(1);
}

main();
