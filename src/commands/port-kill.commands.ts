import { Command } from 'commander';
import { getLogger } from '../utils/logger';

/**
 * Register port kill commands
 */
export function registerPortKillCommands(program: Command): void {
  const logger = getLogger();

  program
    .command('port:kill [port]')
    .alias('pk')
    .description('Kill all processes using specified port')
    .option('-f, --force', 'Force kill without confirmation')
    .option('-a, --all', 'Kill all processes in port range (3000-3010)')
    .action(async (port, options) => {
      try {
        if (options.all) {
          await killAllPorts(options.force);
        } else if (port) {
          await killPort(parseInt(port), options.force);
        } else {
          showPortKillHelp();
        }
      } catch (error) {
        logger.error('Port kill failed:', error);
        console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

  program
    .command('port:kill-all')
    .alias('pka')
    .description('Kill all processes using PNCE port range (3000-3010)')
    .option('-f, --force', 'Force kill without confirmation')
    .action(async (options) => {
      try {
        await killAllPorts(options.force);
      } catch (error) {
        logger.error('Port kill all failed:', error);
        console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
}

/**
 * Kill processes using specific port
 */
async function killPort(port: number, force: boolean = false): Promise<void> {
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error('Invalid port number. Please provide a valid port (1-65535)');
  }

  console.log(`\n🔍 Checking processes using port ${port}...`);

  // Get processes using the port
  const processes = await getProcessesUsingPort(port);

  if (processes.length === 0) {
    console.log(`✅ Port ${port} is not in use`);
    return;
  }

  console.log(`📋 Found ${processes.length} process(es) using port ${port}:`);
  processes.forEach((proc) => {
    console.log(`   - PID: ${proc.pid}, Command: ${proc.command}, User: ${proc.user}`);
  });

  // Ask for confirmation unless force flag is used
  if (!force) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question(`\n⚠️  Are you sure you want to kill these processes? (y/N): `, resolve);
    });

    rl.close();

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled');
      return;
    }
  }

  // Kill processes
  console.log(`\n🔨 Terminating processes on port ${port}...`);

  for (const proc of processes) {
    try {
      // Try graceful termination first
      process.kill(proc.pid, 'SIGTERM');
      console.log(`📤 Sent SIGTERM to PID ${proc.pid} (${proc.command})`);

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if process is still running
      if (await isProcessRunning(proc.pid)) {
        // Force kill
        process.kill(proc.pid, 'SIGKILL');
        console.log(`⚡ Force killed PID ${proc.pid} (${proc.command})`);
      } else {
        console.log(`✅ Process ${proc.pid} terminated gracefully`);
      }
    } catch (error) {
      console.log(`❌ Failed to kill PID ${proc.pid}: ${error}`);
    }
  }

  // Verify port is free
  await new Promise((resolve) => setTimeout(resolve, 500));
  const remainingProcesses = await getProcessesUsingPort(port);

  if (remainingProcesses.length === 0) {
    console.log(`\n🎉 Port ${port} successfully freed!`);
  } else {
    console.log(`\n⚠️  Port ${port} still has ${remainingProcesses.length} process(es) running`);
  }
}

/**
 * Kill all processes in PNCE port range
 */
async function killAllPorts(force: boolean = false): Promise<void> {
  const portRange = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];

  console.log(`\n🔍 Scanning PNCE port range (3000-3010)...`);

  let totalProcesses = 0;
  const portsWithProcesses: { port: number; processes: any[] }[] = [];

  for (const port of portRange) {
    const processes = await getProcessesUsingPort(port);
    if (processes.length > 0) {
      portsWithProcesses.push({ port, processes });
      totalProcesses += processes.length;
    }
  }

  if (totalProcesses === 0) {
    console.log(`✅ No processes found in PNCE port range (3000-3010)`);
    return;
  }

  console.log(`📋 Found ${totalProcesses} process(es) using PNCE ports:`);
  portsWithProcesses.forEach(({ port, processes }) => {
    console.log(`\n   Port ${port}:`);
    processes.forEach((proc) => {
      console.log(`     - PID: ${proc.pid}, Command: ${proc.command}, User: ${proc.user}`);
    });
  });

  // Ask for confirmation unless force flag is used
  if (!force) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question(
        `\n⚠️  Are you sure you want to kill all ${totalProcesses} processes? (y/N): `,
        resolve
      );
    });

    rl.close();

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled');
      return;
    }
  }

  // Kill all processes
  console.log(`\n🔨 Terminating all processes in PNCE port range...`);

  let successCount = 0;
  let failCount = 0;

  for (const { port, processes } of portsWithProcesses) {
    console.log(`\n   Processing port ${port}:`);

    for (const proc of processes) {
      try {
        // Try graceful termination first
        process.kill(proc.pid, 'SIGTERM');
        console.log(`     📤 Sent SIGTERM to PID ${proc.pid} (${proc.command})`);

        // Wait a moment
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Check if process is still running
        if (await isProcessRunning(proc.pid)) {
          // Force kill
          process.kill(proc.pid, 'SIGKILL');
          console.log(`     ⚡ Force killed PID ${proc.pid} (${proc.command})`);
        } else {
          console.log(`     ✅ Process ${proc.pid} terminated gracefully`);
        }
        successCount++;
      } catch (error) {
        console.log(`     ❌ Failed to kill PID ${proc.pid}: ${error}`);
        failCount++;
      }
    }
  }

  // Verify all ports are free
  await new Promise((resolve) => setTimeout(resolve, 1000));

  let remainingCount = 0;
  for (const { port } of portsWithProcesses) {
    const remaining = await getProcessesUsingPort(port);
    if (remaining.length > 0) {
      remainingCount += remaining.length;
      console.log(`   ⚠️  Port ${port} still has ${remaining.length} process(es) running`);
    }
  }

  console.log(`\n🎉 Port kill operation completed!`);
  console.log(`   ✅ Successfully terminated: ${successCount} processes`);
  console.log(`   ❌ Failed to terminate: ${failCount} processes`);
  console.log(`   ⚠️  Still running: ${remainingCount} processes`);

  if (remainingCount === 0) {
    console.log(`   🎯 All PNCE ports (3000-3010) are now free!`);
  }
}

/**
 * Get processes using specific port
 */
async function getProcessesUsingPort(port: number): Promise<any[]> {
  return new Promise((resolve) => {
    const { exec } = require('child_process');

    // Use lsof to get detailed process information
    exec(`lsof -i :${port}`, (error: any, stdout: string, stderr: string) => {
      if (error || !stdout) {
        resolve([]);
        return;
      }

      const lines = stdout.trim().split('\n');
      const processes: any[] = [];

      // Skip header line and parse each process
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const parts = line.split(/\s+/);
          if (parts.length >= 2) {
            processes.push({
              pid: parseInt(parts[1]),
              user: parts[2],
              command: parts[0],
              port: port,
            });
          }
        }
      }

      resolve(processes);
    });
  });
}

/**
 * Check if process is still running
 */
async function isProcessRunning(pid: number): Promise<boolean> {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec(`kill -0 ${pid}`, (error: any) => {
      resolve(!error);
    });
  });
}

/**
 * Show port kill help
 */
function showPortKillHelp(): void {
  console.log(`
╭───────────────────────────────────────────────────╮
│                                              │
│  PNCE Port Kill Commands                    │
│                                              │
│  USAGE:                                      │
│  • pnce port:kill <port> [--force]         │
│      Kill processes using specific port       │
│                                              │
│  • pnce port:kill-all [--force]            │
│      Kill all processes in PNCE port range  │
│      (ports 3000-3010)                    │
│                                              │
│  ALIASES:                                   │
│  • pk <port> = port:kill <port>           │
│  • pka = port:kill-all                      │
│                                              │
│  OPTIONS:                                    │
│  • -f, --force    Skip confirmation prompt    │
│  • -a, --all      Same as port:kill-all     │
│                                              │
│  EXAMPLES:                                   │
│  pnce port:kill 3000                     │
│  pnce pk 3000 --force                     │
│  pnce port:kill-all                       │
│  pnce pka                                 │
│                                              │
╰───────────────────────────────────────────────╯
  `);
}
