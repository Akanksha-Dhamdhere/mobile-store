const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const root = path.resolve(__dirname, '..');
const reportFile = path.join(root, 'scripts', 'output', 'image_report.json');
const publicImages = path.join(root, 'public', 'images');

if (!fs.existsSync(reportFile)) {
  console.error('Report not found:', reportFile);
  process.exit(2);
}
if (!fs.existsSync(publicImages)) fs.mkdirSync(publicImages, { recursive: true });

const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error('Status ' + res.statusCode));
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    });
    req.on('error', reject);
  });
}

function saveDataUri(dataUri, dest) {
  const m = dataUri.match(/^data:(.+?);base64,(.+)$/);
  if (!m) return Promise.reject(new Error('Invalid data URI'));
  const b = Buffer.from(m[2], 'base64');
  fs.writeFileSync(dest, b);
  return Promise.resolve();
}

async function run() {
  const toDownload = new Map();
  report.forEach((r) => {
    const suggestions = (r.imagesSuggested || []).slice();
    if (r.suggested) suggestions.unshift(r.suggested);
    suggestions.forEach((s, idx) => {
      if (!s) return;
      const rel = s.replace(/^\/images\//, '');
      const dest = path.join(publicImages, rel);
      if (fs.existsSync(dest)) return;
      // decide source: prefer original images array entry if it's a URL or data
      const orig = (r.images && r.images[idx]) || r.image;
      if (!orig) return;
      toDownload.set(dest, { src: orig, dest });
    });
  });

  console.log('Will fetch', toDownload.size, 'images into', publicImages);
  for (const [dest, info] of toDownload) {
    const { src } = info;
    try {
      if (src.startsWith('data:')) {
        await saveDataUri(src, dest);
        console.log('Saved data URI ->', dest);
      } else if (/^https?:\/\//.test(src)) {
        await download(src, dest);
        console.log('Downloaded', src, '->', dest);
      } else {
        console.warn('Skipping non-http/data source for', dest, 'source:', src);
      }
    } catch (err) {
      console.error('Failed', src, '->', dest, err.message);
    }
  }
}

run().then(() => console.log('Done')).catch((e) => { console.error(e); process.exit(1); });
