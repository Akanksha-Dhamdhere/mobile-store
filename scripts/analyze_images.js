const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcUtils = path.join(root, 'src', 'utils');
const publicImages = path.join(root, 'public', 'images');

function safeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function extractEntries(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // crude regex to find objects with id, name, image, images
  const objRegex = /\{[\s\S]*?\}/g;
  const matches = content.match(objRegex) || [];
  const entries = [];
  matches.forEach((m) => {
    const idMatch = m.match(/id\s*:\s*(\d+)/);
    const nameMatch = m.match(/name\s*:\s*"([^"]+)"/);
    const imageMatch = m.match(/image\s*:\s*(["'`])([^"'`\n]+)\1/);
    const imagesMatch = m.match(/images\s*:\s*\[([\s\S]*?)\]/);
    const images = [];
    if (imagesMatch) {
      const imgs = imagesMatch[1].match(/(["'`])([^"'`\n]+)\1/g) || [];
      imgs.forEach((im) => {
        const v = im.replace(/^['"`]|['"`]$/g, '');
        images.push(v);
      });
    }
    entries.push({
      id: idMatch ? idMatch[1] : '',
      name: nameMatch ? nameMatch[1] : '',
      image: imageMatch ? imageMatch[2] : '',
      images
    });
  });
  return entries;
}

function suggestLocal(img, id, name, kind) {
  // if already local (/images/) return as-is
  if (!img) return '';
  if (img.startsWith('/images/') || img.startsWith('images/')) return img.replace(/^images\//, '/images/');
  if (img.startsWith('data:')) return `/images/${kind}_${id}_${safeName(name)}_data.jpg`;
  // external URL
  const extMatch = img.match(/\.(png|jpg|jpeg|webp|gif|svg)(?:\?|$)/i);
  const ext = extMatch ? extMatch[0].split('.').pop().split('?')[0] : 'jpg';
  return `/images/${kind}_${id}_${safeName(name)}.${ext}`;
}

function analyze() {
  const files = [
    { path: path.join(srcUtils, 'productsData.js'), kind: 'product' },
    { path: path.join(srcUtils, 'accessoriesData.js'), kind: 'accessory' }
  ];
  const report = [];
  files.forEach((f) => {
    if (!fs.existsSync(f.path)) return;
    const entries = extractEntries(f.path);
    entries.forEach((e) => {
      const suggested = e.image ? suggestLocal(e.image, e.id || 'noid', e.name || 'noname', f.kind) : '';
      const imagesSuggested = (e.images || []).map((img, idx) => suggestLocal(img, e.id || 'noid', e.name || 'noname', f.kind));
      const imageExists = e.image && (e.image.startsWith('/images/') ? fs.existsSync(path.join(publicImages, e.image.replace(/^\/images\//, '')) ) : fs.existsSync(path.join(publicImages, suggested.replace(/^\/images\//, '')) ));
      const imagesExist = (e.images || []).map((img, idx) => {
        const s = imagesSuggested[idx];
        if (img.startsWith('/images/')) return fs.existsSync(path.join(publicImages, img.replace(/^\/images\//, '')));
        return fs.existsSync(path.join(publicImages, s.replace(/^\/images\//, '')));
      });
      report.push({
        file: path.basename(f.path),
        id: e.id,
        name: e.name,
        image: e.image,
        imageExists,
        suggested,
        images: e.images,
        imagesExist: imagesExist,
        imagesSuggested
      });
    });
  });

  const outDir = path.join(root, 'scripts', 'output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'image_report.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2), 'utf8');
  console.log('Analysis complete. Report written to', outFile);
}

analyze();
