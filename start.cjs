const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const serverFile = path.join(__dirname, 'dist', 'server.cjs');

if (!fs.existsSync(serverFile)) {
  console.log('[SwiftCart] dist/server.cjs not found. Running automatic build step...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('[SwiftCart] Build completed successfully.');
  } catch (err) {
    console.error('[SwiftCart] Build failed:', err);
    process.exit(1);
  }
}

console.log('[SwiftCart] Starting production server from dist/server.cjs...');
require(serverFile);
