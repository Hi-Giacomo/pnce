const fs = require('fs-extra');
const path = require('path');

/**
 *  default.config.ts Mediumversion
 */
function getCLIversion() {
  const configPath = path.join(__dirname, '..', 'src', 'config', 'default.config.ts');
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const versionMatch = configContent.match(/export const CLI_VERSION = "([^"]+)"/);
  return versionMatch ? versionMatch[1] : null;
}

/**
 * Update package.json Mediumversion
 */
async function updatePackageversion(version) {
  if (!version) {
    console.warn('⚠️  Could not find CLI_VERSION in default.config.ts');
    return;
  }

  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = await fs.readJson(packagePath);

  if (packageJson.version === version) {
    console.log(`✅ version already up to date: ${version}`);
    return;
  }

  packageJson.version = version;
  await fs.writeJson(packagePath, packageJson, { spaces: 2 });
  console.log(`✅ Package version updated to: ${version}`);
}

/**
 * Copyfile dist Directory
 * CopyCompilefile，Exclude .ts file（Code） .d.ts file（Type）
 */
async function copyTemplates() {
  const srcTemplatesDir = path.join(__dirname, '..', 'src', 'templates');
  const distTemplatesDir = path.join(__dirname, '..', 'dist', 'templates');

  //  dist/templates Directory
  await fs.ensureDir(distTemplatesDir);

  // Copy service 
  const serviceSrcDir = path.join(srcTemplatesDir, 'service');
  const serviceDistDir = path.join(distTemplatesDir, 'service');

  if (await fs.pathExists(serviceSrcDir)) {
    await fs.copy(serviceSrcDir, serviceDistDir, {
      filter: (src) => {
        // Exclude TypeScript file（file）
        const relativePath = path.relative(serviceSrcDir, src);
        //  .ts file（ index.ts、index.d.ts Buildfile）
        // DirectoryMediumfile，Exclude
        return !relativePath.endsWith('.d.ts') &&
               !relativePath.endsWith('.d.ts.map') &&
               !relativePath.endsWith('.js') &&
               !relativePath.endsWith('.js.map');
      },
    });
    console.log('✅ Service template copied');
  }

  // Copy microservice 
  const microserviceSrcDir = path.join(srcTemplatesDir, 'microservice');
  const microserviceDistDir = path.join(distTemplatesDir, 'microservice');

  if (await fs.pathExists(microserviceSrcDir)) {
    await fs.copy(microserviceSrcDir, microserviceDistDir, {
      filter: (src) => {
        const relativePath = path.relative(microserviceSrcDir, src);
        return !relativePath.endsWith('.d.ts') &&
               !relativePath.endsWith('.d.ts.map') &&
               !relativePath.endsWith('.js') &&
               !relativePath.endsWith('.js.map');
      },
    });
    console.log('✅ Microservice template copied');
  }

  console.log('✨ All templates copied to dist/templates');
}

// Function：SyncversionCopy
async function main() {
  try {
    // 1. Syncversion
    const version = getCLIversion();
    await updatePackageversion(version);

    // 2. Copyfile
    await copyTemplates();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
