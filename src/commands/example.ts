import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
// @ts-ignore - This service will be available when the template is used
import { createExampleProject } from '../services/example-generator.service';

export function exampleCommand(program: Command) {
  const command = program
    .command('example [name]')
    .description('Create an example project with nested microservices for learning')
    .argument('[name]', 'Project name', 'pnce-example');

  let type = 'full';
  let skipInstall = false;
  let skipDocs = false;

  command
    .option(
      '-t, --type <type>',
      'Example type: basic | advanced | full',
      (value) => {
        type = value;
        return value;
      },
      'full'
    )
    .option('--skip-install', 'Skip dependency installation', () => {
      skipInstall = true;
    })
    .option('--skip-docs', 'Skip documentation generation', () => {
      skipDocs = true;
    })
    .action(async (name: string) => {
      try {
        console.log('\n╭────────────────────────────────────────────────────────────╮');
        console.log('│                                                            │');
        console.log('│  🎓  Creating Example Project                              │');
        console.log('│                                                            │');
        console.log('╰────────────────────────────────────────────────────────────╯\n');

        const projectName = name || 'pnce-example';
        const targetDir = path.join(process.cwd(), projectName);

        // Check if directory exists
        if (fs.existsSync(targetDir)) {
          console.log(`❌ Directory already exists: ${projectName}`);
          console.log('   Please remove it or choose a different name\n');
          return;
        }

        console.log(`📦 Creating example project: ${projectName}`);
        console.log(`📁 Type: ${type}`);
        console.log(`📍 Location: ${targetDir}\n`);

        // Generate example project
        await createExampleProject(targetDir, {
          type: type as any,
          skipInstall,
          skipDocs,
        });

        console.log('\n╭────────────────────────────────────────────────────────────╮');
        console.log('│                                                            │');
        console.log('│  ✅  Example Project Created Successfully!                 │');
        console.log('│                                                            │');
        console.log('╰────────────────────────────────────────────────────────────╯\n');

        console.log('📚 Next Steps:\n');
        console.log(`   1. cd ${projectName}`);
        console.log('   2. pnpm install');
        console.log('   3. pnpm dev\n');

        console.log('📖 Documentation:\n');
        console.log('   - README.md           - Project overview');
        console.log('   - docs/START.md       - Quick start guide');
        console.log('   - docs/ARCHITECTURE.md - Architecture explanation');
        console.log('   - docs/TUTORIAL.md    - Step-by-step tutorial\n');

        console.log('💡 Tips:\n');
        console.log('   - Each microservice has its own module.config.json');
        console.log('   - Services communicate via HTTP APIs');
        console.log('   - Check the service-registry for all running services');
        console.log('   - Use `pnce list` to see all available commands\n');
      } catch (error) {
        console.error('\n❌ Failed to create example project:');
        console.error(error instanceof Error ? error.message : String(error));
        console.error('\nPlease try again or report this issue on GitHub.\n');
        process.exit(1);
      }
    });
}
