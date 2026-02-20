const fs = require('fs-extra');
const path = require('path');

/**
 * 从 default.config.ts 中提取版本号
 */
function getCLIVersion() {
  const configPath = path.join(__dirname, '..', 'src', 'config', 'default.config.ts');
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const versionMatch = configContent.match(/export const CLI_VERSION = "([^"]+)"/);
  return versionMatch ? versionMatch[1] : null;
}

/**
 * 更新 package.json 中的版本号
 */
async function updatePackageVersion(version) {
  if (!version) {
    console.warn('⚠️  Could not find CLI_VERSION in default.config.ts');
    return;
  }

  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = await fs.readJson(packagePath);

  if (packageJson.version === version) {
    console.log(`✅ Version already up to date: ${version}`);
    return;
  }

  packageJson.version = version;
  await fs.writeJson(packagePath, packageJson, { spaces: 2 });
  console.log(`✅ Package version updated to: ${version}`);
}

/**
 * 复制模板文件到 dist 目录
 * 只复制非编译文件，排除 .ts 文件（源代码）和 .d.ts 文件（类型声明）
 */
async function copyTemplates() {
  const srcTemplatesDir = path.join(__dirname, '..', 'src', 'templates');
  const distTemplatesDir = path.join(__dirname, '..', 'dist', 'templates');

  // 确保 dist/templates 目录存在
  await fs.ensureDir(distTemplatesDir);

  // 复制 service 模板
  const serviceSrcDir = path.join(srcTemplatesDir, 'service');
  const serviceDistDir = path.join(distTemplatesDir, 'service');

  if (await fs.pathExists(serviceSrcDir)) {
    await fs.copy(serviceSrcDir, serviceDistDir, {
      filter: (src) => {
        // 排除 TypeScript 源文件（只保留模板文件）
        const relativePath = path.relative(serviceSrcDir, src);
        // 保留所有非 .ts 文件（除了 index.ts、index.d.ts 等构建文件）
        // 实际上模板目录中应该只有源文件，不需要排除
        return !relativePath.endsWith('.d.ts') &&
               !relativePath.endsWith('.d.ts.map') &&
               !relativePath.endsWith('.js') &&
               !relativePath.endsWith('.js.map');
      },
    });
    console.log('✅ Service template copied');
  }

  // 复制 microservice 模板
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

// 主函数：同步版本号并复制模板
async function main() {
  try {
    // 1. 同步版本号
    const version = getCLIVersion();
    await updatePackageVersion(version);

    // 2. 复制模板文件
    await copyTemplates();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
