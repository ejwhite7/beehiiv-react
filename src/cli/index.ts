/**
 * beehiiv-react CLI entry point.
 * Provides `init` and `sync` commands for project scaffolding.
 * @module cli
 */

import { Command } from 'commander';
import { runInit } from './commands/init.js';
import { runSync } from './commands/sync.js';

const program = new Command();

program
  .name('beehiiv-react')
  .description('CLI tools for beehiiv-react integration')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize beehiiv-react in your project')
  .option('--oauth', 'Use OAuth2 authentication flow')
  .option('--api-key <key>', 'Provide API key directly')
  .action(async (options: { oauth?: boolean; apiKey?: string }) => {
    await runInit(options);
  });

program
  .command('sync')
  .description('Sync custom field types from beehiiv')
  .option('--api-key <key>', 'Provide API key directly')
  .action(async (options: { apiKey?: string }) => {
    await runSync(options);
  });

program.parse();
