/**
 * CLI program factory.
 * Exports the `createProgram` function used by the CLI entry point
 * and unit tests. Separated from `index.ts` so that importing the
 * factory does not trigger `program.parse()`.
 * @module cli/program
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { runInit } from './commands/init.js';
import { runSync } from './commands/sync.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(
  readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'),
) as { version: string };

/**
 * Create and configure the CLI program.
 *
 * Sets up the Commander.js program with `init` and `sync` commands,
 * reads the package version, and configures error handling.
 *
 * @returns The configured Commander program
 */
export function createProgram(): Command {
  const program = new Command();

  program
    .name('beehiiv-react')
    .description(
      'CLI tools for beehiiv-react — scaffold config, types, and API routes for your Next.js project',
    )
    .version(
      `beehiiv-react/${version}`,
      '-v, --version',
      'Print the beehiiv-react version',
    );

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
