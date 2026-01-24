const fs = require('fs');
const path = require('path');

// List of likely files that may use the deprecated fs.F_OK
const filesToPatch = [
  path.join(__dirname, '..', 'node_modules', 'react-dev-utils', 'checkRequiredFiles.js')
];

filesToPatch.forEach((file) => {
  try {
    if (!fs.existsSync(file)) {
      console.log('Not found, skipping:', file);
      return;
    }
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('fs.F_OK')) {
      content = content.replace(/fs\.F_OK/g, 'fs.constants.F_OK');
      fs.writeFileSync(file, content, 'utf8');
      console.log('Patched fs.F_OK in:', file);
    } else {
      console.log('No fs.F_OK occurrences in:', file);
    }
  } catch (err) {
    console.error('Error patching', file, err && err.message);
  }
});
