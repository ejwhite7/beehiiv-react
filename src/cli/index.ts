/**
 * beehiiv-react CLI entry point.
 * Provides `init` and `sync` commands for scaffolding and maintaining
 * beehiiv integration in Next.js projects. Uses Commander.js for
 * argument parsing and command routing.
 * @module cli
 */

import { Command } from 'commander';
import { runInit } from './commands/init.js';
import { runSync } from './commands/sync.js';

/**
 * Create and configure the CLI program.
 *
 * Sets up the Commander.js program with `init` and `sync` commands,
 * reads the package version, and configures error handling.
 *
 * @returns The configured Commander program
 */
function createProgram(): Command {
  const program = new Command();

  program
    .name('beehiiv-react')
    .description(
      'CLI tools for beehiiv-react — scaffold config, types, and API routes for your Next.js project',
    )
    .version('0.1.0');

  program
    .command('init')
    .description('Initialize beehiiv-react in your project')
    .option('--oauth', 'Use OAuth2 authentication flow instead of API key')
    .option(
      '--output-dir <dir>',
      'Output directory for generated files',
      '.',
    )
    .action(
      async (options: { oauth?: boolean; outputDir?: string }) => {
        try {
          await runInit({
            oauth: options.oauth,
            outputDir: options.outputDir,
          });
        } catch (error: unknown) {
          await handleError(error);
        }
      },
    );

  program
    .command('sync')
    .description(
      'Sync custom field types from beehiiv (regenerates types only)',
    )
    .option(
      '--output-dir <dir>',
      'Output directory where generated files live',
      '.',
    )
    .action(async (options: { outputDir?: string }) => {
      try {
        await runSync({
          outputDir: options.outputDir,
        });
      } catch (error: unknown) {
        await handleError(error);
      }
    });

  return program;
}

/**
 * Handle errors from command execution.
 * Prints the error message in red and exits with code 1.
 *
 * @param error - The error that occurred
 */
async function handleError(error: unknown): Promise<never> {
  const { default: chalk } = await import('chalk');

  const message =
    error instanceof Error ? error.message : String(error);
  console.error(chalk.red(`\nError: ${message}\n`));
  process.exit(1);
}

const program = createProgram();
program.parse();
