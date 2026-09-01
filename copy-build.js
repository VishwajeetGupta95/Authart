const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'frontend', 'vite-project', 'dist');

if (!fs.existsSync(src)) {
  console.error('Source directory does not exist:', src);
  process.exit(1);
}

// Copy to directories that Vercel might look for depending on dashboard settings
const destinations = ['dist', 'public', 'public '];

for (const destName of destinations) {
  try {
    const dest = path.join(__dirname, destName);
    fs.cpSync(src, dest, { recursive: true, force: true });
    console.log(`Copied build artifacts to "${destName}"`);
  } catch (err) {
    console.warn(`Could not copy to "${destName}":`, err.message);
  }
}
