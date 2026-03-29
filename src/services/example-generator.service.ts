import * as fs from 'fs-extra';
import * as path from 'path';
import {
  level1Services,
  level2Services,
  level3Services,
  type ServiceConfig,
} from '../config/example-services.config';

export interface ExampleOptions {
  type: 'basic' | 'advanced' | 'full';
  skipInstall: boolean;
  skipDocs: boolean;
}

/**
 * Create example project with nested microservices
 */
export async function createExampleProject(
  targetDir: string,
  options: ExampleOptions
): Promise<void> {
  // Create main service structure
  await createMainService(targetDir);

  // Create nested microservices based on type
  if (options.type === 'basic' || options.type === 'advanced' || options.type === 'full') {
    await createLevel1Microservices(targetDir);
  }

  if (options.type === 'advanced' || options.type === 'full') {
    await createLevel2Microservices(targetDir);
  }

  if (options.type === 'full') {
    await createLevel3Microservices(targetDir);
  }

  // Generate documentation
  if (!options.skipDocs) {
    await generateDocumentation(targetDir);
  }

  // Install dependencies if not skipped
  if (!options.skipInstall) {
    await installDependencies(targetDir);
  }
}

/**
 * Create main service structure using templates
 */
async function createMainService(targetDir: string): Promise<void> {
  console.log('🏗️  Creating main service from template...');

  const templateDir = path.join(__dirname, '../templates/service');

  // Remove existing directory if it exists and create fresh
  await fs.remove(targetDir);
  await fs.ensureDir(targetDir);

  // Copy entire template (skip node_modules and dist)
  await fs.copy(templateDir, targetDir, {
    filter: (src) => {
      const relative = path.relative(templateDir, src);
      return !relative.includes('node_modules') && !relative.includes('dist');
    },
  });

  // Update module.config.json for example
  const moduleConfigPath = path.join(targetDir, 'module.config.json');
  if (await fs.pathExists(moduleConfigPath)) {
    const config = await fs.readJson(moduleConfigPath);
    config.name = 'main-service';
    config.description = 'Main service with nested microservices example';
    await fs.writeJson(moduleConfigPath, config, { spaces: 2 });
  }

  // Update package.json name
  const packageJsonPath = path.join(targetDir, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    const pkg = await fs.readJson(packageJsonPath);
    pkg.name = 'pnce-example-main';
    pkg.description = 'PNCE Example Project - Main Service';
    await fs.writeJson(packageJsonPath, pkg, { spaces: 2 });
  }

  console.log('✅ Main service created from template\n');
}

/**
 * Create level 1 microservices
 */
async function createLevel1Microservices(targetDir: string): Promise<void> {
  console.log('📦 Creating level 1 microservices...');

  for (const service of level1Services) {
    await createMicroservice(
      path.join(targetDir, 'src', 'local_modules', service.name),
      service.name,
      service.port,
      service.description
    );
  }

  console.log('✅ Level 1 microservices created\n');
}

/**
 * Create level 2 microservices
 */
async function createLevel2Microservices(targetDir: string): Promise<void> {
  console.log('📦 Creating level 2 microservices...');

  for (const service of level2Services) {
    const parentPath = path.join(targetDir, 'src', 'local_modules', service.parent);
    await createMicroservice(
      path.join(parentPath, 'src', 'local_modules', service.name),
      service.name,
      service.port,
      service.description
    );
  }

  console.log('✅ Level 2 microservices created\n');
}

/**
 * Create level 3 microservices
 */
async function createLevel3Microservices(targetDir: string): Promise<void> {
  console.log('📦 Creating level 3 microservices...');

  for (const service of level3Services) {
    const parentPath = path.join(
      targetDir,
      'src',
      'local_modules',
      service.grandParent,
      'src',
      'local_modules',
      service.parent
    );
    await createMicroservice(
      path.join(parentPath, 'src', 'local_modules', service.name),
      service.name,
      service.port,
      service.description
    );
  }

  console.log('✅ Level 3 microservices created\n');
}

/**
 * Create a single microservice using template
 */
async function createMicroservice(
  servicePath: string,
  name: string,
  port: number,
  description: string
): Promise<void> {
  const templateDir = path.join(__dirname, '../templates/microservice');

  // Remove existing directory if it exists and create fresh
  await fs.remove(servicePath);
  await fs.ensureDir(servicePath);

  // Copy template
  try {
    await fs.copy(templateDir, servicePath, {
      filter: (src) => {
        const relative = path.relative(templateDir, src);
        return !relative.includes('node_modules') && !relative.includes('dist');
      },
    });
  } catch (error) {
    console.error(
      `   ❌ Failed to copy microservice template:`,
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }

  // Update module.config.json
  const moduleConfigPath = path.join(servicePath, 'module.config.json');
  if (await fs.pathExists(moduleConfigPath)) {
    const config = await fs.readJson(moduleConfigPath);
    config.name = name;
    config.port = port;
    config.description = description;
    await fs.writeJson(moduleConfigPath, config, { spaces: 2 });
  }

  // Update package.json name
  const packageJsonPath = path.join(servicePath, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    const pkg = await fs.readJson(packageJsonPath);
    pkg.name = `pnce-example-${name}`;
    pkg.description = `PNCE Example - ${name}`;
    await fs.writeJson(packageJsonPath, pkg, { spaces: 2 });
  }
}

/**
 * Generate documentation from templates
 */
async function generateDocumentation(targetDir: string): Promise<void> {
  console.log('📚 Generating documentation...');

  const docsDir = path.join(targetDir, 'docs');
  const templateDocsDir = path.join(__dirname, '../templates/example/docs');

  // Copy all documentation templates
  await fs.copy(templateDocsDir, docsDir);

  console.log('✅ Documentation generated\n');
}

/**
 * Install dependencies
 */
async function installDependencies(targetDir: string): Promise<void> {
  console.log('📦 Installing dependencies...');

  try {
    const { execSync } = require('child_process');

    // Install main service dependencies
    execSync('pnpm install', {
      cwd: targetDir,
      stdio: 'ignore',
    });

    // Install microservice dependencies
    const localModulesPath = path.join(targetDir, 'src', 'local_modules');
    if (await fs.pathExists(localModulesPath)) {
      const services = await fs.readdir(localModulesPath);

      for (const service of services) {
        const servicePath = path.join(localModulesPath, service);
        const stat = await fs.stat(servicePath);

        if (stat.isDirectory()) {
          execSync('pnpm install', {
            cwd: servicePath,
            stdio: 'ignore',
          });

          // Check for nested microservices
          const nestedPath = path.join(servicePath, 'src', 'local_modules');
          if (await fs.pathExists(nestedPath)) {
            const nestedServices = await fs.readdir(nestedPath);

            for (const nested of nestedServices) {
              const nestedServicePath = path.join(nestedPath, nested);
              const nestedStat = await fs.stat(nestedServicePath);

              if (nestedStat.isDirectory()) {
                execSync('pnpm install', {
                  cwd: nestedServicePath,
                  stdio: 'ignore',
                });

                // Level 3
                const deepNestedPath = path.join(nestedServicePath, 'src', 'local_modules');
                if (await fs.pathExists(deepNestedPath)) {
                  const deepServices = await fs.readdir(deepNestedPath);

                  for (const deep of deepServices) {
                    const deepServicePath = path.join(deepNestedPath, deep);
                    const deepStat = await fs.stat(deepServicePath);

                    if (deepStat.isDirectory()) {
                      execSync('pnpm install', {
                        cwd: deepServicePath,
                        stdio: 'ignore',
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    console.log('✅ Dependencies installed\n');
  } catch (error) {
    console.log('⚠️  Dependency installation skipped (you can run manually)\n');
  }
}
