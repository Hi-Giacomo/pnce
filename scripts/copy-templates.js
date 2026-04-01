const fs = require('fs-extra');
const path = require('path');

const srcDir = path.join(__dirname, '../src/templates');
const destDir = path.join(__dirname, '../dist/templates');

async function copyTemplates() {
  try {
    await fs.copy(srcDir, destDir, {
      overwrite: true,
      filter: (src, dest) => {
        // Skip node_modules and dist folders
        if (src.includes('node_modules') || src.includes('dist')) {
          return false;
        }
        return true;
      }
    });
    console.log('✓ Templates copied to dist/');
  } catch (err) {
    console.error('Failed to copy templates:', err);
    process.exit(1);
  }
}

copyTemplates();
