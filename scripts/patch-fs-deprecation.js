const fs = require('fs');
const path = require('path');

// List of files that may use deprecated APIs
const fsFilesToPatch = [
  path.join(__dirname, '..', 'node_modules', 'react-dev-utils', 'checkRequiredFiles.js')
];

// Patch fs.F_OK deprecation
fsFilesToPatch.forEach((file) => {
  try {
    if (!fs.existsSync(file)) {
      console.log('Not found, skipping:', file);
      return;
    }
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('fs.F_OK')) {
      content = content.replace(/fs\.F_OK/g, 'fs.constants.F_OK');
      fs.writeFileSync(file, content, 'utf8');
      console.log('✓ Patched fs.F_OK in:', file);
    }
  } catch (err) {
    console.error('Error patching', file, err && err.message);
  }
});

// Patch util._extend deprecation in spdy and related packages
const spdyFiles = [
  path.join(__dirname, '..', 'node_modules', 'spdy', 'lib', 'spdy', 'agent.js'),
  path.join(__dirname, '..', 'node_modules', 'spdy', 'lib', 'spdy', 'server.js'),
  path.join(__dirname, '..', 'node_modules', 'spdy-transport', 'lib', 'spdy-transport', 'utils.js')
];

let patchedCount = 0;
spdyFiles.forEach((file) => {
  try {
    if (!fs.existsSync(file)) {
      return;
    }
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('util._extend')) {
      content = content.replace(/util\._extend/g, 'Object.assign');
      fs.writeFileSync(file, content, 'utf8');
      console.log('✓ Patched util._extend in:', file);
      patchedCount++;
    }
  } catch (err) {
    // File doesn't exist or can't be patched
  }
});

if (patchedCount > 0) {
  console.log(`\n✓ Successfully patched ${patchedCount} file(s) for util._extend deprecation`);
}
